# NONGOL frontend handoff

## Current scope

The three App Router screens reproduce the supplied Figma prototype's dark palette, purple accents, Indonesian copy, angled ticket, event photograph, and shared navigation. The event image was downloaded from the reference's public `/nongol-meetup.jpg`. The existing Geist fonts are retained. The logo and Monad mark are CSS/SVG approximations; official vector assets can replace these later.

Event metadata in `lib/nongol/event.ts` is explicitly an editorial sample from the reference. The 21 August 2027 date and 100-person capacity are placeholders, not the confirmed Monad Blitz Jogja 2026 schedule or deployed capacity. Update them with the organizer's final details before release.

Wallet foundation: Wagmi 3.7.9, Viem 2.57.10, TanStack Query 5.104.5; chain 10143 only. Injected browser wallets and EIP-6963 discovery are supported. Mobile users need an in-wallet browser; remote WalletConnect sessions are not configured. No API keys are required. `qrcode.react` 4.2.0 renders QR locally without sharing addresses with an external QR service.

## Integration boundary

- `hooks/use-event-data.ts` returns unavailable/empty states. It performs no contract requests and calls no write helpers.
- `lib/nongol/view-models.ts` separates read state, confirmed tickets, demo tickets, attendance states, and summary counts from contract-specific types.
- The main ticket requires a confirmed on-chain model matching the connected wallet and chain. Connection or preview does not create a ticket. Demo QR uses `NONGOL:DEMO:NOT_A_VALID_TICKET`; it encodes no registration or payment intent.
- Demo fixtures only appear in an explicitly opened preview and are not persisted. Organizer wallet connection does not grant or imply organizer authorization.
- Registration, check-in, refund, and settlement actions remain disabled. Participant search only validates address syntax; it never labels an address registered without a contract read.

## Contract handoff required

Existing teammate-owned code is present in `contracts/`, `scripts/deploy.ts`, and `lib/contracts/`; the UI does not import it. No contract address has been supplied or invented.

**Resolve the settlement mismatch first:** the PRD and prototype specify 80% organizer / 20% platform, with no attendee refund for no-show. The existing Solidity implementation and contract README specify 50% attendee / 35% organizer / 15% platform. UI copy follows the PRD. Agree on the final policy before enabling transactions; do not deploy or connect these rules blindly.

Required inputs: final compiled ABI matching deployed bytecode, testnet address, chain ID, deployment block, organizer address, event deadlines, final event metadata, capacity behavior, and settlement policy. Confirm the getters (`getEventDetails`, `getAttendeeStatus`, `getAllAttendees`), status enum, events, errors, and pagination or log strategy.

Next frontend work:

1. Add deployment configuration without any private key. Keep privileged RPC credentials server-side; browser configuration is public.
2. Replace unavailable read hooks with Wagmi reads; map confirmed state to presentation models. Invalidate on wallet/network changes and refresh after transactions and external organizer actions.
3. Verify organizer against contract state. Derive deadlines from chain timestamps, not device time.
4. Simulate writes, estimate gas accurately, submit, await successful receipts, then refetch. A submitted hash alone is not registration/refund success. Enforce expected chain and contract address for every write.
5. Confirm refund occurs atomically with check-in and failed transfers revert. Do not add a claim-refund button for the current PRD.
6. Test attendance/refund and no-show/settlement with two participant wallets, rejection/revert/pending states, duplicate actions, and refresh recovery.

## Local checks

```text
node node_modules/next/dist/bin/next typegen
node node_modules/typescript/bin/tsc --noEmit
npm run lint
npm run build
node node_modules/@playwright/test/cli.js test
```

On Windows PowerShell with script execution disabled, use `npm.cmd` in place of `npm`. Browser tests use installed Microsoft Edge, exercise desktop/mobile layouts and a test-only injected EIP-1193 wallet, and start the production build on port 3100. They never use a real wallet, private key, or chain transaction. Build first. Set the browser channel in `playwright.config.ts` if Edge is unavailable on another development machine.
