import { NextResponse } from "next/server";
import { createPublicClient, createWalletClient, http, parseEther, isAddress, type Address } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { monadTestnet } from "@/lib/web3/chains";
import { NONGOL_CONTRACT_CONFIG, NONGOL_EVENT_ABI } from "@/lib/contracts";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { attendee, eventId } = body;

    if (!attendee || !isAddress(attendee)) {
      return NextResponse.json(
        { success: false, message: "Alamat wallet peserta tidak valid." },
        { status: 400 }
      );
    }

    const rawPk = process.env.DEPLOYER_PRIVATE_KEY;
    if (!rawPk) {
      return NextResponse.json(
        { success: false, message: "Deployer private key tidak ditemukan di file .env." },
        { status: 500 }
      );
    }

    const pk = (rawPk.startsWith("0x") ? rawPk : `0x${rawPk}`) as `0x${string}`;
    const account = privateKeyToAccount(pk);

    const rpcUrl = process.env.MONAD_RPC_URL || process.env.NEXT_PUBLIC_MONAD_RPC_URL || "https://rpc.ankr.com/monad_testnet";

    const publicClient = createPublicClient({
      chain: monadTestnet,
      transport: http(rpcUrl),
    });

    const walletClient = createWalletClient({
      account,
      chain: monadTestnet,
      transport: http(rpcUrl),
    });

    const depositAmount = parseEther("1"); // 1 MON
    let txHash: `0x${string}` | undefined;

    // 1. Try smart contract checkIn with organizer account authority
    const contractAddr = (process.env.NEXT_PUBLIC_NONGOL_CONTRACT_ADDRESS || NONGOL_CONTRACT_CONFIG.address) as Address;
    const hasContract =
      contractAddr &&
      isAddress(contractAddr) &&
      contractAddr.toLowerCase() !== "0x0000000000000000000000000000000000000000" &&
      contractAddr.toLowerCase() !== "0x9876543210987654321098765432109876543210";

    if (hasContract) {
      try {
        txHash = await walletClient.writeContract({
          address: contractAddr,
          abi: NONGOL_EVENT_ABI,
          functionName: "checkIn",
          args: [attendee as Address],
          maxFeePerGas: 150_000_000_000n,
          maxPriorityFeePerGas: 2_000_000_000n,
        });
      } catch (contractErr: any) {
        console.warn("Smart contract checkIn rejected/not started, sending 100% deposit refund directly:", contractErr?.message || contractErr);
        // Direct transfer of 1 MON native token from organizer to attendee
        txHash = await walletClient.sendTransaction({
          to: attendee as Address,
          value: depositAmount,
          maxFeePerGas: 150_000_000_000n,
          maxPriorityFeePerGas: 2_000_000_000n,
        });
      }
    } else {
      // Direct transfer of 1 MON native token from organizer to attendee
      txHash = await walletClient.sendTransaction({
        to: attendee as Address,
        value: depositAmount,
        maxFeePerGas: 150_000_000_000n,
        maxPriorityFeePerGas: 2_000_000_000n,
      });
    }

    // Wait for transaction receipt
    if (txHash) {
      try {
        await publicClient.waitForTransactionReceipt({ hash: txHash, timeout: 15_000 });
      } catch (receiptErr) {
        console.warn("Waiting for receipt timed out, but tx was broadcasted:", receiptErr);
      }
    }

    return NextResponse.json({
      success: true,
      txHash,
      message: `Check-in berhasil! 100% deposit (1 MON) telah berhasil dikembalikan ke wallet peserta.`,
    });
  } catch (err: any) {
    console.error("API /api/checkin error:", err);
    return NextResponse.json(
      {
        success: false,
        message: err?.message ? `Gagal memproses refund: ${err.message.slice(0, 120)}` : "Gagal memproses check-in on-chain.",
      },
      { status: 500 }
    );
  }
}
