# NONGOL — Anti-Wacana Event Protocol

NONGOL adalah aplikasi Web3 untuk meningkatkan komitmen kehadiran pada event
gratis. Peserta melakukan RSVP dengan mengunci deposit **1 MON**. Deposit
dikembalikan ketika peserta hadir dan di-check-in oleh organizer; peserta yang
tidak hadir diproses sesuai aturan settlement smart contract.

> **Status:** Hackathon MVP. Antarmuka utama sudah tersedia, tetapi transaksi
> event belum diaktifkan pada frontend karena alamat kontrak ter-deploy, ABI
> final, metadata event, dan kebijakan settlement final masih perlu dikonfirmasi.

## Mengapa NONGOL?

Pada event gratis, RSVP tidak selalu mencerminkan jumlah peserta yang benar-benar
hadir. NONGOL menggunakan mekanisme **Commit-to-Attend**:

1. Peserta menghubungkan wallet dan mengunci deposit 1 MON.
2. Peserta memperoleh tiket digital setelah registrasi on-chain berhasil.
3. Organizer memvalidasi kehadiran melalui check-in.
4. Peserta yang hadir menerima refund 100% deposit.
5. Peserta yang tidak hadir masuk ke proses no-show settlement setelah batas
   check-in berakhir.

Tujuan MVP ini adalah membuktikan alur deposit, check-in, refund, dan settlement
secara transparan di Monad. NONGOL bukan marketplace atau platform penjualan
tiket.

## Fitur dan halaman

- **Landing / event registration (`/`)** — menampilkan event, aturan deposit,
  kapasitas, dan koneksi wallet.
- **My Ticket (`/ticket`)** — menampilkan tiket, status kehadiran, QR code, dan
  informasi wallet.
- **Organizer dashboard (`/organizer`)** — menampilkan ringkasan event,
  pencarian peserta, dan alur pemindaian QR untuk check-in.
- **Wallet connection** — injected browser wallet dan EIP-6963 discovery
  melalui Wagmi.
- **QR lokal** — QR dibuat di browser menggunakan `qrcode.react`; tidak dikirim
  ke layanan QR eksternal.
- **Responsive UI** — layout desktop dan mobile dengan tema gelap, aksen
  ungu, dan visual ticket/event.

Pada versi saat ini, contoh tiket dan statistik demo diberi penanda eksplisit.
Preview atau koneksi wallet saja tidak membuat tiket valid dan tidak mengirim
transaksi blockchain.

## Tech stack

### Frontend

- **Next.js 16** dengan App Router
- **React 19** dan **TypeScript**
- **Tailwind CSS 4** dengan konfigurasi Turbopack
- **Geist** melalui `next/font`
- **TanStack Query 5** untuk lifecycle dan cache query

### Web3

- **Wagmi 3** untuk koneksi wallet dan React hooks
- **Viem 2** untuk client EVM, tipe alamat/hash, dan transaksi
- **Monad Testnet** sebagai target utama, chain ID `10143`
- **Monad Mainnet** tersedia pada definisi chain, chain ID `143`
- **Solidity `^0.8.20`** untuk smart contract
- **Solc `^0.8.38`** dengan optimizer aktif (`runs: 200`) untuk kompilasi
- **Playwright** untuk pengujian UI end-to-end
- **ESLint** dan TypeScript untuk validasi kode

Native currency Monad adalah **MON** dengan 18 decimals. RPC, explorer, dan
alamat kontrak dapat dikonfigurasi melalui environment variable; tidak ada API
key yang diperlukan untuk fondasi wallet saat ini.

## Arsitektur aplikasi

```text
Browser
  │
  ├─ Next.js App Router
  │    ├─ app/page.tsx             Landing / registration
  │    ├─ app/ticket/page.tsx      My Ticket
  │    └─ app/organizer/page.tsx   Organizer dashboard
  │
  ├─ UI components
  │    ├─ components/landing
  │    ├─ components/ticket
  │    ├─ components/layout
  │    └─ components/wallet
  │
  ├─ Domain/view model
  │    ├─ lib/nongol/event.ts
  │    ├─ lib/nongol/view-models.ts
  │    └─ lib/nongol/protocol-store.ts
  │
  └─ Web3 boundary
       ├─ lib/web3/chains.ts
       ├─ lib/web3/wagmiConfig.ts
       ├─ lib/contracts/config.ts
       └─ lib/contracts/nongolEventAbi.ts
              │
              ▼
       Monad RPC → NongolEvent.sol
```

### Tanggung jawab tiap lapisan

- **App Router** mengatur route, loading/error state, layout, dan provider
  global.
- **`app/providers.tsx`** memasang `WagmiProvider`, `QueryClientProvider`, dan
  `WalletProvider` pada sisi client.
- **Komponen UI** menangani presentasi event, tiket, QR, scanner, feedback,
  dan interaksi organizer.
- **Domain/view model** memisahkan data event, status attendee, tiket
  terkonfirmasi, data demo, dan ringkasan statistik dari tipe kontrak.
- **`protocol-store` dan hook event** saat ini menyediakan state lokal/editorial
  untuk MVP. Hook belum melakukan `readContract` atau write transaksi ke chain.
- **Web3 boundary** mendefinisikan chain, transport, ABI, dan konfigurasi
  alamat agar integrasi kontrak dapat diaktifkan tanpa mencampur detail RPC ke
  komponen UI.
- **Smart contract** menjadi sumber kebenaran untuk deposit, status registrasi,
  check-in, refund, dan settlement setelah frontend dihubungkan ke deployment
  final.

## Smart contract `NongolEvent`

File kontrak berada di [`contracts/NongolEvent.sol`](./contracts/NongolEvent.sol).
Satu instance kontrak merepresentasikan satu event dan menyimpan organizer,
platform, jadwal, daftar attendee, serta saldo deposit event.

### Data dan konfigurasi

- `organizer` dan `platform` adalah alamat immutable.
- `depositAmount` selalu `1 ether` atau 1 MON.
- `registrationDeadline` menutup pendaftaran.
- `checkInStartTime` dan `checkInDeadline` menentukan jendela check-in.
- `AttendeeInfo` menyimpan status dan timestamp registrasi, check-in, serta
  settlement.
- Counter `totalRegistered`, `totalCheckedIn`, dan `totalSettled` menyimpan
  statistik agregat.
- Array attendee menyimpan seluruh wallet yang pernah mendaftar.

### Fungsi utama

| Fungsi | Akses | Perilaku |
| --- | --- | --- |
| `register()` | Publik, payable | Menerima tepat 1 MON, hanya sebelum deadline, dan menolak registrasi kedua dari wallet yang sama. |
| `checkIn(address)` | Organizer | Memvalidasi jendela check-in, mengubah status, lalu mengembalikan 1 MON secara atomik. |
| `settleNoShow(address)` | Publik setelah deadline | Memproses attendee yang masih `Registered` dan membagi deposit sesuai implementasi kontrak. |
| `settleBatchNoShow(address[])` | Publik setelah deadline | Memanggil settlement untuk banyak attendee; alamat yang sudah tidak eligible dilewati. |
| `getAttendeeStatus(address)` | View | Mengembalikan status presentasi dan menghitung `NoShowPending` secara dinamis setelah deadline. |
| `getEventDetails()` | View | Mengembalikan konfigurasi event, counter, dan saldo kontrak. |
| `getAttendeeCount()` | View | Mengembalikan jumlah wallet yang terdaftar. |
| `getAllAttendees()` | View | Mengembalikan daftar wallet attendee. |

Status tampilan yang digunakan kontrak adalah:
`NotRegistered`, `Registered`, `CheckedInRefunded`, `NoShowPending`, dan
`Settled`. Transfer native MON dilakukan setelah state diperbarui, menggunakan
Checks-Effects-Interactions dan custom reentrancy guard.

### Settlement: catatan penting

Ada ketidaksesuaian yang harus diselesaikan sebelum transaksi diaktifkan:

- **PRD** mendeskripsikan no-show sebagai pembagian **80% organizer / 20%
  platform**, tanpa refund untuk attendee.
- **Implementasi Solidity saat ini** membagi **50% attendee / 35% organizer /
  15% platform**. Komentar, event, dan dokumentasi kontrak mengikuti angka ini.

Jangan deploy atau menghubungkan frontend ke aturan settlement ini sebelum
organizer menyetujui kebijakan final. Dokumentasi kontrak tersedia di
[`contracts/README.md`](./contracts/README.md).

### Pertimbangan Monad

Monad kompatibel dengan EVM dan mendukung kontrak Solidity ini tanpa perubahan
khusus pada semantics kontrak. Namun, integrasi transaksi perlu memperhatikan:

- Monad membebankan biaya berdasarkan **gas limit**, bukan gas yang benar-benar
  terpakai. Hindari gas limit yang terlalu tinggi; gunakan estimasi ketat
  dengan buffer kecil.
- Akses storage/account cold lebih mahal dibanding Ethereum, sehingga batch
  dan pembacaan banyak attendee perlu diuji dengan gas limit yang realistis.
- State Monad bersifat asynchronous. Setelah funding atau perubahan state,
  frontend perlu menunggu receipt dan membaca ulang state chain, bukan hanya
  menganggap transaksi terkirim sebagai sukses.
- Status deadline harus berasal dari timestamp chain, bukan jam perangkat
  pengguna.

## Struktur direktori

```text
app/                  Route dan layout Next.js
components/           Komponen UI berdasarkan domain
contracts/             Source Solidity dan dokumentasi kontrak
docs/                  Handoff dan catatan integrasi frontend
hooks/                 React hooks untuk data event/tiket
lib/contracts/         ABI dan konfigurasi alamat kontrak
lib/nongol/            Domain model, event fixture, dan protocol store
lib/web3/              Definisi chain dan konfigurasi Wagmi
scripts/               Kompilasi dan deployment kontrak
tests/                 Pengujian Playwright
public/                Asset gambar dan ikon
```

## Menjalankan secara lokal

Prasyarat: Node.js yang kompatibel dengan Next.js dan npm.

```bash
npm install
npm run dev
```

Buka [http://localhost:3000](http://localhost:3000).

Perintah validasi:

```bash
npm run lint
npm run build
node node_modules/typescript/bin/tsc --noEmit
node node_modules/@playwright/test/cli.js test
```

Pada PowerShell dengan policy script yang membatasi `npm`, gunakan `npm.cmd`.

## Kompilasi dan deployment kontrak

Kompilasi Solidity menghasilkan artifact `build/NongolEvent.json`:

```bash
npx tsx scripts/compile.ts
```

Deployment testnet menggunakan `scripts/deploy.ts`. Simpan private key hanya
di environment lokal/secret manager dan jangan commit ke repository:

```bash
$env:DEPLOYER_PRIVATE_KEY="0x..."
$env:ORGANIZER_ADDRESS="0x..."
$env:PLATFORM_ADDRESS="0x..."
npx tsx scripts/deploy.ts
```

Script deployment menggunakan Monad Testnet (`10143`), menampilkan hash transaksi
dan alamat kontrak setelah receipt diterima. Setelah deployment, konfigurasi
frontend dapat diisi melalui `.env.local`:

```dotenv
NEXT_PUBLIC_NONGOL_CONTRACT_ADDRESS=0x...
NEXT_PUBLIC_CHAIN_ID=10143
NEXT_PUBLIC_MONAD_RPC_URL=https://testnet-rpc.monad.xyz
NEXT_PUBLIC_MONAD_EXPLORER_URL=https://testnet.monadexplorer.com
NEXT_PUBLIC_PLATFORM_ADDRESS=0x...
```

Alamat `NEXT_PUBLIC_*` boleh terlihat di browser; private key dan credential
RPC yang memiliki hak istimewa tidak boleh diekspos ke client.

## Batasan dan pekerjaan lanjutan

Sebelum produksi atau demo on-chain, lengkapi hal berikut:

1. Putuskan kebijakan settlement final dan samakan PRD, Solidity, ABI, serta
   copy di UI.
2. Deploy dan verifikasi kontrak di network yang dipilih, lalu catat address,
   deployment block, organizer, platform, dan deadline final.
3. Ganti state placeholder dengan contract reads untuk event, attendee, dan
   statistik.
4. Tambahkan alur write yang mensimulasikan transaksi, menggunakan gas limit
   terukur, menunggu successful receipt, lalu melakukan refetch.
5. Validasi organizer berdasarkan state kontrak; koneksi wallet saja tidak
   memberi hak check-in.
6. Uji registrasi, refund, no-show, batch settlement, revert, pending
   transaction, perubahan chain, dan refresh setelah transaksi.
7. Tentukan strategi pagination/indexing bila daftar attendee atau histori event
   melebihi kebutuhan satu `getAllAttendees()` call.

Dokumen handoff teknis dan daftar blocker tersedia di
[`docs/frontend-integration.md`](./docs/frontend-integration.md).
