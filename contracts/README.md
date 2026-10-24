# Nongol Smart Contract Documentation

Contract: `NongolEvent.sol`  
Target Network: **Monad Testnet** (Chain ID: `10143`) / **Monad Mainnet** (Chain ID: `143`)  
Native Currency: **MON** (18 decimals)

---

## 1. Overview & Mechanics (PRD Section 8)

`NongolEvent.sol` implements the core **Commit-to-Attend** protocol for NONGOL on Monad:
- **Deposit**: 1 MON per registration.
- **Single RSVP**: Only 1 registration per wallet per event.
- **Attend & Check-in**: Organizer confirms physical attendance during the check-in window. Smart contract immediately issues a **100% refund** (1 MON) to the attendee wallet.
- **No-Show Settlement**: After the check-in deadline has passed, any attendee who did not check in has their deposit partially forfeited:
  - **50% refunded** to the attendee (0.5 MON)
  - **35%** to the Organizer (0.35 MON)
  - **15%** to the NONGOL Platform (0.15 MON)

---

## 2. Monad-Specific Optimizations (from Monskills `gas` & `concepts`)

1. **Charged on Gas Limit**: Monad charges based on `gas_limit` (not `gas_used`). All frontend viem/wagmi calls use bounded gas limits with a tight ~10% buffer instead of high arbitrary limits.
2. **Cold State Access Optimization**: Monad charges +6,000 to +7,500 more gas for cold storage reads/writes. `NongolEvent.sol` packs attendee timestamps into `uint64` so `status`, `registeredAt`, `checkedInAt`, and `settledAt` all fit into a single storage slot.
3. **CEI & Reentrancy Guard**: Follows Checks-Effects-Interactions strictly, updating internal status before transferring native MON, guarded by custom non-reentrant locks.

---

## 3. Core Contract Functions

### Write Functions

| Function | Access | Description |
|---|---|---|
| `register()` | Public (payable) | Locks 1 MON (`msg.value == 1 ether`). Checks that `block.timestamp <= registrationDeadline`. |
| `checkIn(address attendee)` | Organizer Only | Verifies physical arrival within `[checkInStartTime, checkInDeadline]`. Automatically refunds 1 MON to `attendee`. |
| `settleNoShow(address attendee)` | Permissionless (Post-Deadline) | Forfeits no-show deposit if `block.timestamp > checkInDeadline`. Returns **0.50 MON** to attendee, **0.35 MON** to organizer, **0.15 MON** to platform. |
| `settleBatchNoShow(address[] attendees)` | Public | Batch helper to settle multiple no-shows in a single transaction. |

### View Functions

| Function | Description |
|---|---|
| `getAttendeeStatus(address attendee)` | Returns `DisplayStatus` (0: NotRegistered, 1: Registered, 2: CheckedInRefunded, 3: NoShowPending, 4: Settled). Dynamically returns `NoShowPending` if deadline passed without needing a settlement transaction. |
| `getEventDetails()` | Returns organizer, platform, depositAmount (1 MON), deadlines, and counts (`registered`, `checkedIn`, `settled`). |
| `getAllAttendees()` | Returns array of all registered wallet addresses. |
| `getAttendeeCount()` | Returns total number of registered wallets. |

---

## 4. Integration with Wagmi & Viem

The contract is fully typed with TypeScript using `as const` in `lib/contracts/nongolEventAbi.ts` and configured for MetaMask via `lib/web3/wagmiConfig.ts`.

Example Wagmi React hook usage (for frontend when ready):

```typescript
import { useReadContract, useWriteContract } from 'wagmi';
import { NONGOL_EVENT_ABI } from '@/lib/contracts/nongolEventAbi';
import { parseEther } from 'viem';

// Register with 1 MON
const { writeContract } = useWriteContract();
writeContract({
  address: CONTRACT_ADDRESS,
  abi: NONGOL_EVENT_ABI,
  functionName: 'register',
  value: parseEther('1'),
});

// Check status
const { data: status } = useReadContract({
  address: CONTRACT_ADDRESS,
  abi: NONGOL_EVENT_ABI,
  functionName: 'getAttendeeStatus',
  args: [userAddress],
});
```
