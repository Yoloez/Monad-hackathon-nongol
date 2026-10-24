import {
  type PublicClient,
  type WalletClient,
  type Address,
  parseEther,
} from 'viem';
import { NONGOL_EVENT_ABI, DisplayStatus } from './nongolEventAbi';

/**
 * Guidelines from monskills 'gas' skill:
 * Monad charges on `gas_limit`, not on `gas_used`.
 * We apply a safe ~10% buffer at most when estimating, rather than high arbitrary buffers.
 */
function withMonadGasBuffer(estimatedGas: bigint): bigint {
  return estimatedGas + (estimatedGas / 10n); // 10% buffer
}

/**
 * Register attendee by locking 1 MON deposit
 */
export async function registerForEvent({
  walletClient,
  publicClient,
  contractAddress,
  account,
}: {
  walletClient: WalletClient;
  publicClient: PublicClient;
  contractAddress: Address;
  account: Address;
}) {
  const value = parseEther('1'); // 1 MON

  const estimatedGas = await publicClient.estimateContractGas({
    address: contractAddress,
    abi: NONGOL_EVENT_ABI,
    functionName: 'register',
    account,
    value,
  });

  const hash = await walletClient.writeContract({
    address: contractAddress,
    abi: NONGOL_EVENT_ABI,
    functionName: 'register',
    account,
    value,
    gas: withMonadGasBuffer(estimatedGas),
    chain: null,
  });

  return hash;
}

/**
 * Organizer checks in an attendee, triggering immediate 100% refund
 */
export async function checkInAttendee({
  walletClient,
  publicClient,
  contractAddress,
  organizerAccount,
  attendeeAddress,
}: {
  walletClient: WalletClient;
  publicClient: PublicClient;
  contractAddress: Address;
  organizerAccount: Address;
  attendeeAddress: Address;
}) {
  const estimatedGas = await publicClient.estimateContractGas({
    address: contractAddress,
    abi: NONGOL_EVENT_ABI,
    functionName: 'checkIn',
    args: [attendeeAddress],
    account: organizerAccount,
  });

  const hash = await walletClient.writeContract({
    address: contractAddress,
    abi: NONGOL_EVENT_ABI,
    functionName: 'checkIn',
    args: [attendeeAddress],
    account: organizerAccount,
    gas: withMonadGasBuffer(estimatedGas),
    chain: null,
  });

  return hash;
}

/**
 * Settle deposit of a no-show attendee after check-in deadline
 */
export async function settleNoShowAttendee({
  walletClient,
  publicClient,
  contractAddress,
  callerAccount,
  attendeeAddress,
}: {
  walletClient: WalletClient;
  publicClient: PublicClient;
  contractAddress: Address;
  callerAccount: Address;
  attendeeAddress: Address;
}) {
  const estimatedGas = await publicClient.estimateContractGas({
    address: contractAddress,
    abi: NONGOL_EVENT_ABI,
    functionName: 'settleNoShow',
    args: [attendeeAddress],
    account: callerAccount,
  });

  const hash = await walletClient.writeContract({
    address: contractAddress,
    abi: NONGOL_EVENT_ABI,
    functionName: 'settleNoShow',
    args: [attendeeAddress],
    account: callerAccount,
    gas: withMonadGasBuffer(estimatedGas),
    chain: null,
  });

  return hash;
}

/**
 * Read attendance status for an attendee
 */
export async function readAttendeeStatus({
  publicClient,
  contractAddress,
  attendeeAddress,
}: {
  publicClient: PublicClient;
  contractAddress: Address;
  attendeeAddress: Address;
}): Promise<DisplayStatus> {
  const status = await publicClient.readContract({
    address: contractAddress,
    abi: NONGOL_EVENT_ABI,
    functionName: 'getAttendeeStatus',
    args: [attendeeAddress],
  });

  return Number(status) as DisplayStatus;
}

/**
 * Read event summary details
 */
export async function readEventDetails({
  publicClient,
  contractAddress,
}: {
  publicClient: PublicClient;
  contractAddress: Address;
}) {
  const result = await publicClient.readContract({
    address: contractAddress,
    abi: NONGOL_EVENT_ABI,
    functionName: 'getEventDetails',
  });

  const [
    eventOrganizer,
    eventPlatform,
    eventDepositAmount,
    regDeadline,
    checkInStart,
    checkInEnd,
    registeredCount,
    checkedInCount,
    settledCount,
    contractBalance,
  ] = result;

  return {
    organizer: eventOrganizer,
    platform: eventPlatform,
    depositAmount: eventDepositAmount,
    registrationDeadline: Number(regDeadline),
    checkInStartTime: Number(checkInStart),
    checkInDeadline: Number(checkInEnd),
    totalRegistered: Number(registeredCount),
    totalCheckedIn: Number(checkedInCount),
    totalSettled: Number(settledCount),
    contractBalance,
  };
}

/**
 * Read all registered attendees
 */
export async function readAllAttendees({
  publicClient,
  contractAddress,
}: {
  publicClient: PublicClient;
  contractAddress: Address;
}): Promise<readonly Address[]> {
  return await publicClient.readContract({
    address: contractAddress,
    abi: NONGOL_EVENT_ABI,
    functionName: 'getAllAttendees',
  });
}
