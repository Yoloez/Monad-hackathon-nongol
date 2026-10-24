// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title NongolEvent
 * @author NONGOL Protocol
 * @notice Anti-Wacana Event Commitment Protocol on Monad.
 *         Participants lock 1 MON to commit to attending.
 *         - Attend & Check-in: 100% refund (1 MON)
 *         - No-show: 50% refunded to attendee, 35% to organizer, 15% to NONGOL platform
 */
contract NongolEvent {
    // --- Custom Errors (Gas optimized for Monad) ---
    error RegistrationClosed();
    error IncorrectDepositAmount();
    error AlreadyRegistered();
    error OnlyOrganizer();
    error CheckInNotStarted();
    error CheckInDeadlinePassed();
    error InvalidAttendeeStatus();
    error CheckInStillActive();
    error NotEligibleForSettlement();
    error TransferFailed();
    error ReentrancyGuardReentrantCall();
    error EmptyAttendeeList();
    error InvalidConfiguration();

    // --- Data Structures ---
    enum AttendeeStatus {
        NotRegistered, // 0
        Registered,    // 1
        CheckedIn,     // 2 (Refunded)
        Settled        // 3 (No-show forfeited and distributed)
    }

    enum DisplayStatus {
        NotRegistered,     // 0
        Registered,        // 1
        CheckedInRefunded, // 2
        NoShowPending,     // 3 (Registered, but checkInDeadline passed)
        Settled            // 4 (Deposit distributed 80/20)
    }

    struct AttendeeInfo {
        AttendeeStatus status;
        uint64 registeredAt;
        uint64 checkedInAt;
        uint64 settledAt;
    }

    // --- Immutables & Config ---
    address public immutable organizer;
    address public immutable deployer;
    address public immutable platform;
    uint256 public immutable depositAmount; // 1 MON (1 ether)
    uint64 public immutable registrationDeadline;
    uint64 public immutable checkInStartTime;
    uint64 public immutable checkInDeadline;

    // --- State Variables ---
    uint256 public totalRegistered;
    uint256 public totalCheckedIn;
    uint256 public totalSettled;
    address[] private _attendees;

    mapping(address => AttendeeInfo) public attendees;

    // --- Reentrancy Guard ---
    uint8 private _locked = 1;

    modifier nonReentrant() {
        if (_locked != 1) revert ReentrancyGuardReentrantCall();
        _locked = 2;
        _;
        _locked = 1;
    }

    modifier onlyAuthorized() {
        if (msg.sender != organizer && msg.sender != deployer) revert OnlyOrganizer();
        _;
    }

    // --- Events ---
    event Registered(address indexed attendee, uint256 deposit, uint256 timestamp);
    event CheckedIn(address indexed attendee, uint256 timestamp);
    event Refunded(address indexed attendee, uint256 amount, uint256 timestamp);
    event NoShowSettled(
        address indexed attendee,
        uint256 attendeeRefund,
        uint256 organizerShare,
        uint256 platformShare,
        uint256 timestamp
    );

    /**
     * @notice Constructor for creating a single Nongol event
     * @param _organizer Address of the organizer wallet authorized to check in attendees
     * @param _platform Address of the NONGOL platform wallet receiving 20% no-show fee
     * @param _registrationDeadline Unix timestamp when registration closes
     * @param _checkInStartTime Unix timestamp when check-in opens
     * @param _checkInDeadline Unix timestamp when check-in closes (after which no-shows can be settled)
     */
    constructor(
        address _organizer,
        address _platform,
        uint64 _registrationDeadline,
        uint64 _checkInStartTime,
        uint64 _checkInDeadline
    ) {
        if (_organizer == address(0) || _platform == address(0)) revert InvalidConfiguration();
        if (_checkInDeadline <= _checkInStartTime) revert InvalidConfiguration();

        organizer = _organizer;
        deployer = msg.sender;
        platform = _platform;
        depositAmount = 1 ether; // 1 MON
        registrationDeadline = _registrationDeadline;
        checkInStartTime = _checkInStartTime;
        checkInDeadline = _checkInDeadline;
    }

    /**
     * @notice Attendee commits 1 MON to RSVP for the event.
     */
    function register() external payable nonReentrant {
        if (block.timestamp > registrationDeadline) revert RegistrationClosed();
        if (msg.value != depositAmount) revert IncorrectDepositAmount();
        if (attendees[msg.sender].status != AttendeeStatus.NotRegistered) revert AlreadyRegistered();

        attendees[msg.sender] = AttendeeInfo({
            status: AttendeeStatus.Registered,
            registeredAt: uint64(block.timestamp),
            checkedInAt: 0,
            settledAt: 0
        });

        _attendees.push(msg.sender);
        totalRegistered += 1;

        emit Registered(msg.sender, msg.value, block.timestamp);
    }

    /**
     * @notice Check in an attendee who arrived physically at the event.
     *         Immediately triggers a 100% refund of the 1 MON deposit to the attendee.
     * @param attendee Address of the registered attendee
     */
    function checkIn(address attendee) external onlyAuthorized nonReentrant {
        if (block.timestamp < checkInStartTime) revert CheckInNotStarted();
        if (block.timestamp > checkInDeadline) revert CheckInDeadlinePassed();

        AttendeeInfo storage info = attendees[attendee];
        if (info.status != AttendeeStatus.Registered) revert InvalidAttendeeStatus();

        // State update (Checks-Effects-Interactions)
        info.status = AttendeeStatus.CheckedIn;
        info.checkedInAt = uint64(block.timestamp);
        totalCheckedIn += 1;

        emit CheckedIn(attendee, block.timestamp);
        emit Refunded(attendee, depositAmount, block.timestamp);

        // Interaction: Refund 1 MON to attendee
        (bool success, ) = payable(attendee).call{value: depositAmount}("");
        if (!success) revert TransferFailed();
    }

    /**
     * @notice Settle a no-show attendee's deposit after checkInDeadline has passed.
     *         50% of the deposit (0.5 MON) is returned to the attendee.
     *         Of the remaining 50% penalty:
     *           - 35% of total deposit (0.35 MON) goes to the organizer.
     *           - 15% of total deposit (0.15 MON) goes to the NONGOL platform.
     *         Permissionless call so anyone or admin can trigger it after deadline.
     * @param attendee Address of the attendee who failed to check in
     */
    function settleNoShow(address attendee) public nonReentrant {
        if (block.timestamp <= checkInDeadline) revert CheckInStillActive();

        AttendeeInfo storage info = attendees[attendee];
        if (info.status != AttendeeStatus.Registered) revert NotEligibleForSettlement();

        // State update (Checks-Effects-Interactions)
        info.status = AttendeeStatus.Settled;
        info.settledAt = uint64(block.timestamp);
        totalSettled += 1;

        // Penalty split: 50% returned to attendee, 35% to organizer, 15% to platform
        uint256 attendeeRefund = (depositAmount * 50) / 100; // 0.50 MON
        uint256 organizerShare = (depositAmount * 35) / 100; // 0.35 MON
        uint256 platformShare  = depositAmount - attendeeRefund - organizerShare; // 0.15 MON

        emit NoShowSettled(attendee, attendeeRefund, organizerShare, platformShare, block.timestamp);

        // Interactions — update state first, then transfer
        (bool s1, ) = payable(attendee).call{value: attendeeRefund}("");
        if (!s1) revert TransferFailed();

        (bool s2, ) = payable(organizer).call{value: organizerShare}("");
        if (!s2) revert TransferFailed();

        (bool s3, ) = payable(platform).call{value: platformShare}("");
        if (!s3) revert TransferFailed();
    }

    /**
     * @notice Batch helper to settle multiple no-shows in one transaction.
     * @param attendeesToSettle Array of attendee addresses to settle
     */
    function settleBatchNoShow(address[] calldata attendeesToSettle) external {
        uint256 length = attendeesToSettle.length;
        if (length == 0) revert EmptyAttendeeList();

        for (uint256 i = 0; i < length; ) {
            // Internal call with safety check to allow processing batch without failing whole batch if one already settled
            address att = attendeesToSettle[i];
            if (attendees[att].status == AttendeeStatus.Registered && block.timestamp > checkInDeadline) {
                settleNoShow(att);
            }
            unchecked {
                ++i;
            }
        }
    }

    // --- View Functions ---

    /**
     * @notice Get attendance status of a given address, dynamically computing NoShow status
     * @param attendee Address to query
     * @return DisplayStatus:
     *         0: NotRegistered
     *         1: Registered
     *         2: CheckedInRefunded
     *         3: NoShowPending (deadline has passed without check-in)
     *         4: Settled
     */
    function getAttendeeStatus(address attendee) external view returns (DisplayStatus) {
        AttendeeStatus status = attendees[attendee].status;

        if (status == AttendeeStatus.NotRegistered) {
            return DisplayStatus.NotRegistered;
        } else if (status == AttendeeStatus.CheckedIn) {
            return DisplayStatus.CheckedInRefunded;
        } else if (status == AttendeeStatus.Settled) {
            return DisplayStatus.Settled;
        } else {
            // Status is Registered
            if (block.timestamp > checkInDeadline) {
                return DisplayStatus.NoShowPending;
            }
            return DisplayStatus.Registered;
        }
    }

    /**
     * @notice Returns complete event configuration and real-time statistics
     */
    function getEventDetails()
        external
        view
        returns (
            address eventOrganizer,
            address eventPlatform,
            uint256 eventDepositAmount,
            uint64 regDeadline,
            uint64 checkInStart,
            uint64 checkInEnd,
            uint256 registeredCount,
            uint256 checkedInCount,
            uint256 settledCount,
            uint256 contractBalance
        )
    {
        return (
            organizer,
            platform,
            depositAmount,
            registrationDeadline,
            checkInStartTime,
            checkInDeadline,
            totalRegistered,
            totalCheckedIn,
            totalSettled,
            address(this).balance
        );
    }

    /**
     * @notice Returns total count of registered attendees
     */
    function getAttendeeCount() external view returns (uint256) {
        return _attendees.length;
    }

    /**
     * @notice Returns the full list of registered attendee addresses
     */
    function getAllAttendees() external view returns (address[] memory) {
        return _attendees;
    }
}
