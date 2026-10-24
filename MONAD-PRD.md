# **NONGOL**

## **Minimum Viable Product (MVP) — Product Requirements Document**

**Tagline:** Daftar Boleh Gratis, Komitmen Jangan Setengah-Setengah.

**Product:** NONGOL — Anti-Wacana Event Protocol  
**Platform:** Web Application (Web3)  
**Blockchain:** Monad  
**Kategori:** Event Attendance / Commitment Protocol  
**Target:** Hackathon, Meetup, Workshop, dan Community Event  
**Status:** Hackathon MVP  
**Prioritas:** Membuktikan bahwa deposit yang dapat dikembalikan bisa digunakan sebagai mekanisme komitmen kehadiran.

---

# **1\. PRODUCT OVERVIEW**

## **1.1 Apa Itu NONGOL?**

NONGOL adalah aplikasi Web3 yang membantu penyelenggara event mengurangi risiko peserta tidak hadir setelah melakukan registrasi (no-show).

Pada event gratis, siapa pun dapat mendaftar tanpa konsekuensi apabila tidak datang. Hal ini membuat jumlah pendaftar tidak selalu mencerminkan jumlah peserta yang benar-benar hadir.

NONGOL memperkenalkan mekanisme **Commit-to-Attend**, yaitu peserta mengunci deposit sebesar 1 MON saat mendaftar event.

Aturannya sederhana:

* **Datang:** Peserta melakukan check-in dan menerima kembali 100% deposit.  
* **Tidak datang:** Deposit hangus setelah batas check-in berakhir.  
* **Pembagian deposit hangus:** 80% untuk organizer dan 20% untuk platform NONGOL.

Deposit dikelola oleh smart contract di Monad, sehingga pengembalian dan pembagian dana mengikuti aturan yang telah ditentukan.

NONGOL bukan platform penjualan tiket. NONGOL adalah sistem untuk meningkatkan komitmen kehadiran pada event.

## **1.2 Product Vision**

**Make every RSVP count.**

Membantu penyelenggara event mendapatkan peserta yang lebih berkomitmen untuk hadir melalui sistem deposit yang transparan, sederhana, dan berbasis blockchain.

## **1.3 Value Proposition**

**Untuk Organizer:**

* Memberikan konsekuensi nyata bagi peserta yang tidak hadir.  
* Membantu mengurangi risiko kursi kosong dan sumber daya terbuang.  
* Mendapatkan kompensasi dari deposit peserta yang tidak datang.  
* Memiliki data registrasi dan check-in yang dapat diverifikasi.

**Untuk Peserta:**

* Tetap bisa mengikuti event tanpa biaya tiket.  
* Mendapatkan kembali seluruh deposit apabila hadir sesuai ketentuan.  
* Memiliki tiket digital untuk proses check-in.  
* Dapat memverifikasi transaksi deposit dan refund melalui blockchain.

Catatan: peserta tetap membutuhkan biaya gas transaksi dan harus mengunci dana sementara.

---

# **2\. PROBLEM STATEMENT**

## **2.1 Masalah Utama**

**Banyak peserta mendaftar event gratis, tetapi tidak benar-benar hadir ketika acara berlangsung.**

Contoh:

Sebuah komunitas mengadakan workshop dengan kapasitas 100 orang.

Sebanyak 100 peserta melakukan registrasi. Namun, ketika acara dimulai, hanya 70 peserta yang hadir.

Akibatnya:

1. Terdapat 30 kursi yang tidak terpakai.  
2. Konsumsi dan perlengkapan berpotensi terbuang.  
3. Peserta lain yang ingin datang kehilangan kesempatan memperoleh tempat.  
4. Organizer kesulitan memprediksi jumlah kehadiran aktual.

Contoh tersebut merupakan simulasi, bukan statistik no-show yang telah diukur.

## **2.2 Root Cause**

Pada sistem registrasi event gratis, melakukan RSVP sering kali tidak membutuhkan komitmen yang berarti.

Peserta dapat mendaftar dan tidak hadir tanpa konsekuensi langsung.

## **2.3 Solusi NONGOL**

NONGOL membuat peserta memiliki komitmen finansial sementara.

Peserta yang hadir mendapatkan uangnya kembali, sedangkan peserta yang tidak hadir kehilangan deposit.

**Hipotesis produk:** Ketika peserta memiliki deposit yang berisiko hangus, mereka akan lebih mempertimbangkan keseriusan untuk hadir sebelum melakukan registrasi.

Hipotesis ini perlu diuji menggunakan data kehadiran event nyata setelah MVP.

---

# **3\. TARGET USERS**

## **3.1 Primary User — Event Organizer**

Penyelenggara event gratis atau komunitas dengan kapasitas terbatas.

Contoh:

* Organizer hackathon.  
* Penyelenggara workshop.  
* Komunitas developer dan Web3.  
* Penyelenggara meetup teknologi.

**Kebutuhan utama:** Mengurangi peserta yang melakukan registrasi tetapi tidak datang.

## **3.2 Secondary User — Event Attendee**

Peserta yang ingin mengikuti event dan bersedia memberikan deposit sebagai bentuk komitmen.

Untuk MVP, fokus pada pengguna yang sudah memiliki wallet dan memahami transaksi dasar Web3.

Hal ini mengurangi kebutuhan membangun sistem onboarding wallet yang kompleks.

---

# **4\. MVP OBJECTIVE**

## **4.1 Tujuan Utama**

Membuktikan bahwa sebuah event dapat menggunakan mekanisme deposit on-chain untuk mendorong peserta hadir dan memastikan pengembalian atau pembagian deposit dilakukan sesuai status kehadiran.

## **4.2 Core User Journey**

Seluruh produk berpusat pada satu alur:

**Register → Lock Deposit → Attend Event → Check-in → Get Refund**

Jika peserta tidak hadir:

**Register → Lock Deposit → No-Show → Deposit Forfeited → Revenue Split**

## **4.3 Success Criteria**

MVP dinyatakan berhasil apabila:

1. Peserta berhasil mendaftar event dengan deposit 1 MON.  
2. Deposit tersimpan di smart contract.  
3. Peserta memperoleh tiket setelah transaksi registrasi berhasil.  
4. Organizer dapat melakukan check-in peserta yang hadir.  
5. Peserta yang check-in menerima refund 100%.  
6. Deposit peserta yang tidak check-in dapat dibagikan 80/20 setelah batas check-in berakhir.

**North Star Metric untuk validasi produk jangka panjang: Attendance Rate.**

Formula:

Attendance Rate \= (Jumlah Peserta Hadir / Jumlah Peserta Terdaftar) × 100%

MVP hackathon berfokus pada pengujian alur dan mekanisme, bukan mengklaim telah meningkatkan attendance rate tanpa data pembanding.

---

# **5\. MVP FEATURES**

Hanya terdapat **3 fitur utama**.

## **FEATURE 1 — Commit to Attend**

**Prioritas: P0 (Must Have)**

Peserta dapat mendaftar sebuah event dengan mengunci deposit 1 MON melalui wallet.

### **User Story**

Sebagai peserta, saya ingin mendaftar event dengan mengunci deposit agar saya memiliki tempat sekaligus komitmen untuk hadir.

### **Functional Requirements**

1. Menampilkan informasi satu event.  
2. Menghubungkan wallet pengguna.  
3. Menampilkan nilai deposit dan aturan refund.  
4. Memungkinkan pengguna melakukan registrasi melalui smart contract.  
5. Memverifikasi keberhasilan transaksi.  
6. Membuat tiket digital setelah registrasi berhasil.

### **Business Rules**

* Deposit: 1 MON.  
* Hanya satu registrasi untuk setiap wallet pada event yang sama.  
* Registrasi hanya bisa dilakukan sebelum batas pendaftaran.  
* Seluruh deposit masuk ke smart contract.  
* Deposit tidak langsung masuk ke wallet organizer.  
* Registrasi berhasil hanya jika transaksi blockchain terkonfirmasi.

### **Acceptance Criteria**

* Pengguna dengan wallet yang kompatibel dapat melakukan registrasi.  
* Setelah transaksi berhasil, status berubah menjadi Registered.  
* Wallet yang telah terdaftar tidak dapat membayar deposit kedua untuk event yang sama.  
* Wallet dengan saldo tidak cukup mendapatkan pesan error yang jelas.  
* Pengguna tidak mendapatkan tiket valid jika transaksi gagal.

---

## **FEATURE 2 — Event Check-in & Automatic Refund**

**Prioritas: P0 (Must Have)**

Organizer dapat memvalidasi tiket peserta yang benar-benar datang ke lokasi event.

Setelah check-in berhasil dicatat melalui smart contract, deposit peserta dikembalikan ke wallet terdaftar.

### **User Story**

Sebagai peserta yang datang ke event, saya ingin melakukan check-in dengan mudah agar deposit saya dikembalikan.

Sebagai organizer, saya ingin memverifikasi peserta secara langsung agar hanya peserta yang benar-benar hadir yang mendapatkan refund.

### **Functional Requirements**

1. Peserta dapat membuka tiket digital.  
2. Tiket menampilkan QR yang memuat identitas registrasi.  
3. Organizer membaca QR atau memasukkan identitas wallet/tiket secara manual.  
4. Sistem memeriksa apakah wallet telah terdaftar.  
5. Organizer mengonfirmasi kehadiran peserta.  
6. Smart contract mencatat status Checked-in dan mengirim refund sebesar 1 MON.

### **Business Rules**

* Check-in hanya dapat dilakukan oleh wallet organizer yang terotorisasi.  
* Check-in hanya dapat dilakukan selama periode check-in.  
* Setiap peserta hanya dapat check-in satu kali.  
* Wallet tujuan refund adalah wallet yang digunakan saat registrasi.  
* Refund sebesar 100% deposit, tidak termasuk biaya gas.  
* Status Refunded hanya ditampilkan setelah transaksi berhasil.

### **Acceptance Criteria**

* Organizer dapat menemukan peserta yang valid.  
* Peserta tidak terdaftar tidak dapat melakukan check-in.  
* Peserta yang sudah check-in tidak dapat diproses ulang.  
* Setelah transaksi check-in berhasil, peserta menerima kembali 1 MON.  
* Status tiket berubah menjadi Checked-in / Refunded.

**Batasan:** QR bukan bukti kehadiran fisik yang sempurna. Organizer tetap harus memastikan peserta berada di lokasi sebelum menekan tombol konfirmasi. QR yang dibagikan ke orang lain merupakan risiko yang belum sepenuhnya ditangani dalam MVP.

---

## **FEATURE 3 — No-Show Settlement**

**Prioritas: P0 (Must Have)**

Setelah periode check-in berakhir, deposit peserta yang tidak hadir dapat didistribusikan berdasarkan aturan smart contract.

### **User Story**

Sebagai organizer, saya ingin deposit peserta yang tidak datang dibagikan sesuai aturan sehingga saya memperoleh kompensasi atas no-show.

### **Functional Requirements**

1. Sistem dapat menentukan peserta yang belum check-in setelah deadline.  
2. Organizer dapat melihat status No-Show.  
3. Tersedia aksi untuk memproses settlement peserta yang tidak hadir.  
4. Smart contract membagikan deposit 80% kepada organizer dan 20% kepada platform.  
5. Status berubah menjadi Settled setelah transaksi selesai.

### **Business Rules**

* Settlement hanya dapat dilakukan setelah check-in deadline.  
* Deposit peserta yang sudah check-in tidak boleh dibagikan.  
* Setiap deposit hanya dapat diselesaikan satu kali.  
* Pembagian dilakukan oleh smart contract.  
* Tidak ada pemotongan dana sebelum deadline.

### **Contoh Perhitungan**

Deposit peserta: 1 MON.

Jika peserta tidak hadir:

* Organizer memperoleh 0,8 MON.  
* Platform NONGOL memperoleh 0,2 MON.  
* Peserta memperoleh 0 MON.

Untuk MVP, settlement dijalankan melalui transaksi setelah deadline, bukan proses otomatis yang berjalan sendiri.

### **Acceptance Criteria**

* Settlement sebelum deadline selalu ditolak.  
* Peserta yang sudah check-in tidak dapat dikenakan penalti.  
* Deposit peserta no-show terbagi tepat 80/20.  
* Settlement kedua untuk peserta yang sama ditolak.  
* Hasil pembagian dapat diverifikasi melalui transaksi blockchain.

---

# **6\. USER FLOW**

## **6.1 Attendee Flow — Peserta Hadir**

1. Pengguna membuka website NONGOL.  
2. Pengguna melihat informasi event dan deposit 1 MON.  
3. Pengguna menekan tombol "Commit to Attend".  
4. Pengguna menghubungkan wallet.  
5. Pengguna mengonfirmasi transaksi 1 MON.  
6. Smart contract menyimpan deposit dan registrasi.  
7. Pengguna melihat halaman tiket beserta QR.  
8. Pada hari event, pengguna menunjukkan QR kepada organizer.  
9. Organizer memvalidasi tiket dan kehadiran fisik.  
10. Organizer mengirim transaksi check-in.  
11. Smart contract mencatat check-in dan mengembalikan deposit.  
12. Pengguna melihat status "Checked-in — 1 MON Refunded".

**Final State: REFUNDED**

## **6.2 Attendee Flow — Peserta Tidak Hadir**

1. Pengguna mendaftar dan mengunci 1 MON.  
2. Pengguna menerima tiket.  
3. Pengguna tidak datang pada periode check-in.  
4. Batas waktu check-in berakhir.  
5. Status pengguna menjadi No-Show.  
6. Settlement dilakukan melalui smart contract.  
7. Deposit didistribusikan kepada organizer dan platform.  
8. Status berubah menjadi Settled.

**Final State: NO-SHOW SETTLED**

## **6.3 Organizer Flow**

1. Organizer membuka Admin Dashboard.  
2. Organizer menghubungkan wallet yang telah diotorisasi.  
3. Organizer mencari peserta melalui QR atau identitas tiket.  
4. Organizer memverifikasi kehadiran fisik peserta.  
5. Organizer menekan "Confirm Check-in".  
6. Smart contract memproses check-in dan refund.  
7. Setelah deadline, organizer melihat daftar peserta no-show.  
8. Organizer dapat menjalankan settlement untuk peserta yang belum check-in.

---

# **7\. UI/UX REQUIREMENTS**

MVP hanya menggunakan **3 halaman utama**.

Tidak perlu halaman Login, Profile, Explore Events, Wallet Dashboard, ataupun halaman terpisah untuk riwayat transaksi.

## **SCREEN 1 — Landing Page / Event Registration**

### **Tujuan**

Membuat pengguna memahami event dan aturan deposit, lalu melakukan registrasi.

### **Komponen UI**

**Header**

* Logo NONGOL.  
* Indikator jaringan Monad.  
* Tombol Connect Wallet.

**Hero Section**

Headline:

"Jangan Cuma Daftar. Buktiin Kamu Bakal Nongol."

Subheadline:

"Kunci 1 MON untuk reservasi tempat. Datang ke event, depositmu balik 100%."

**Event Card**

Menampilkan:

* Nama event.  
* Gambar/banner event.  
* Tanggal dan waktu.  
* Lokasi.  
* Check-in deadline.  
* Deposit: 1 MON.

Seluruh detail event menggunakan data statis (hardcoded) untuk MVP.

**Commitment Information**

"Datang dan check-in \= 1 MON kembali."

"Tidak check-in sampai deadline \= 1 MON hangus."

"Deposit no-show: 80% organizer, 20% platform."

**Primary CTA**

"Commit 1 MON"

### **UI States**

* Wallet disconnected → Connect Wallet.  
* Wallet connected → Commit 1 MON.  
* Awaiting signature → Confirm in Wallet.  
* Transaction pending → Securing Your Spot.  
* Transaction success → View My Ticket.  
* Transaction failed → Transaction Failed, Try Again.  
* Already registered → View My Ticket.

### **UX Rules**

* Satu CTA utama.  
* Hindari istilah seperti gas optimization, staking APY, atau liquidity.  
* Jelaskan konsekuensi kehilangan deposit sebelum pengguna menandatangani transaksi.  
* Jangan memperlihatkan tiket terkonfirmasi sebelum transaksi berhasil.

---

## **SCREEN 2 — My Ticket / Attendance Status**

### **Tujuan**

Menunjukkan tiket registrasi dan status pengembalian deposit.

### **Komponen UI**

**Ticket Card**

* Nama event.  
* Wallet address (disingkat).  
* QR code.  
* Deposit: 1 MON.  
* Status peserta.

**Attendance Status**

Sistem menampilkan salah satu status:

1. Registered — Waiting for Event.  
2. Checked-in — Refund Processing.  
3. Refunded — 1 MON Returned.  
4. No-Show — Deposit Forfeited.  
5. Settled — Deposit Distributed.

**Informasi Tambahan**

"Show this QR to the organizer when you arrive."

"Tiket berlaku untuk satu kali check-in."

### **UX Rules**

* QR digunakan sebagai alat bantu identifikasi registrasi.  
* Status harus berdasarkan data smart contract.  
* Tidak diperlukan tombol manual "Claim Refund" karena refund dilakukan dalam transaksi check-in.  
* Jika transaksi refund gagal, jangan menampilkan status sukses.

---

## **SCREEN 3 — Organizer Dashboard**

### **Tujuan**

Memungkinkan organizer melakukan check-in dan menyelesaikan deposit peserta no-show.

### **Komponen UI**

**Header**

* Nama event.  
* Connected organizer wallet.  
* Event status: Upcoming / Check-in Open / Closed.

**Summary Cards**

* Total Registered.  
* Total Checked-in.  
* Total No-Show.

Angka harus berasal dari data registrasi/check-in yang benar-benar tersimpan; jangan menampilkan angka contoh sebagai data live.

**Check-in Section**

* Input ticket identifier / wallet address.  
* Opsi QR scanner jika implementasi memungkinkan.  
* Tombol Find Attendee.  
* Informasi status registrasi.  
* Tombol Confirm Check-in.

**No-Show Settlement Section**

* Daftar peserta yang belum check-in.  
* Status settlement.  
* Tombol Settle No-Show per peserta setelah deadline.

### **UX Rules**

* Organizer yang tidak memiliki otorisasi tidak dapat menjalankan check-in.  
* Tombol settlement tidak aktif sebelum deadline.  
* Seluruh transaksi menampilkan status loading dan feedback hasil.  
* QR scanner dengan kamera bukan syarat wajib. Input manual harus tetap dapat digunakan untuk MVP.

---

# **8\. SMART CONTRACT REQUIREMENTS**

## **8.1 Arsitektur**

Gunakan satu smart contract untuk satu event.

Konfigurasi event ditentukan ketika kontrak di-deploy.

**Contract:** NongolEvent.sol

Smart contract menyimpan:

* Organizer wallet address.  
* Platform wallet address.  
* Deposit amount: 1 MON.  
* Registration deadline.  
* Check-in start time.  
* Check-in deadline.  
* Data peserta terdaftar.  
* Status check-in dan settlement.

Informasi seperti banner dan deskripsi event tetap disimpan secara statis pada frontend.

## **8.2 Core Functions**

**register() — payable**

Digunakan peserta untuk mendaftar dan mengunci deposit.

Validasi:

* Waktu registrasi masih terbuka.  
* Wallet belum terdaftar.  
* Jumlah native MON yang dikirim tepat 1 MON.

Hasil:

* Deposit tersimpan dalam kontrak.  
* Status peserta menjadi Registered.  
* Event `Registered` dikeluarkan.

**checkIn(address attendee)**

Dipanggil wallet organizer untuk mencatat kehadiran peserta.

Validasi:

* Pemanggil merupakan organizer.  
* Periode check-in sedang berlangsung.  
* Peserta sudah terdaftar.  
* Peserta belum check-in.  
* Deposit belum diselesaikan.

Hasil:

* Status peserta menjadi Checked-in.  
* Deposit 1 MON dikembalikan kepada peserta melalui transaksi yang sama.  
* Event `CheckedIn` dan `Refunded` dikeluarkan.

**settleNoShow(address attendee)**

Memproses deposit peserta yang tidak hadir.

Validasi:

* Check-in deadline telah terlewati.  
* Peserta terdaftar.  
* Peserta belum check-in.  
* Deposit belum diselesaikan.

Hasil:

* Status menjadi Settled.  
* Organizer menerima 80%.  
* Platform menerima 20%.  
* Event `NoShowSettled` dikeluarkan.

Fungsi ini dapat dibuat permissionless agar settlement tidak hanya bergantung pada organizer, tetapi antarmuka settlement cukup tersedia di dashboard admin.

**getAttendeeStatus(address attendee)**

Mengambil status registrasi dan penyelesaian deposit berdasarkan wallet.

Hasil:

* Not Registered.  
* Registered.  
* Checked-in / Refunded.  
* No-Show Pending Settlement.  
* Settled.

Status No-Show dapat dihitung dari waktu deadline dan data peserta, tanpa harus menunggu transaksi settlement.

## **8.3 Security Requirements**

Minimal perlindungan:

1. Mencegah registrasi ganda.  
2. Mencegah refund ganda.  
3. Mencegah settlement ganda.  
4. Membatasi check-in hanya kepada organizer.  
5. Memvalidasi seluruh batas waktu di smart contract.  
6. Memperbarui state sebelum transfer dana dan menggunakan perlindungan reentrancy.  
7. Tidak menyediakan penarikan deposit peserta secara sewenang-wenang oleh organizer.  
8. Memastikan kegagalan transfer dana membatalkan transaksi sehingga status tidak salah tercatat.

Gunakan timestamp blockchain sebagai sumber batas waktu pada smart contract, bukan waktu perangkat pengguna.

---

# **9\. BUSINESS MODEL**

## **9.1 Monetization Strategy**

Untuk MVP, NONGOL menggunakan model **No-Show Revenue Split**.

Setiap deposit peserta yang tidak hadir dibagi:

* 80% organizer.  
* 20% platform NONGOL.

Peserta yang hadir memperoleh 100% deposit kembali.

## **9.2 Business Model Simulation**

Contoh satu event:

* Total pendaftar: 100 peserta.  
* Deposit per peserta: 1 MON.  
* Total deposit terkunci: 100 MON.  
* Peserta hadir: 70 orang.  
* Peserta no-show: 30 orang.

Distribusi:

| Komponen | Nilai |
| ----- | ----- |
| Total deposit | 100 MON |
| Refund peserta hadir | 70 MON |
| Deposit no-show | 30 MON |
| Organizer revenue (80%) | 24 MON |
| NONGOL revenue (20%) | 6 MON |

Angka tersebut merupakan simulasi pada tingkat no-show 30%, bukan proyeksi pendapatan yang sudah tervalidasi.

## **9.3 Why Blockchain?**

NONGOL menggunakan Monad karena smart contract memungkinkan:

* Dana deposit dikunci dengan aturan yang sudah ditentukan.  
* Refund diberikan berdasarkan status check-in yang dicatat secara on-chain.  
* Pembagian penalti dapat dieksekusi dan diaudit secara transparan.  
* Organizer tidak memiliki akses bebas terhadap deposit yang tersimpan.  
* Aplikasi dapat menggunakan ekosistem wallet dan tooling EVM.

Monad dipilih untuk menyediakan pengalaman transaksi yang cepat dengan arsitektur berperforma tinggi.

Meskipun demikian, kecepatan akhir yang dirasakan pengguna masih bergantung pada wallet, jaringan, dan konfirmasi transaksi.

## **9.4 Business Limitation**

Pendapatan dari penalti bukan indikator utama keberhasilan produk.

Apabila NONGOL berhasil mengurangi no-show, pendapatan penalti kemungkinan ikut berkurang.

Karena itu, pada tahap berikutnya, monetisasi dapat dikembangkan melalui biaya layanan atau langganan organizer.

Fitur monetisasi tambahan tersebut **tidak masuk MVP**.

---

# **10\. MVP SCOPE**

## **10.1 In Scope**

Hanya implementasikan:

1. **Commit to Attend:** Registrasi dengan deposit 1 MON.  
2. **Check-in & Refund:** Organizer mengonfirmasi kehadiran dan smart contract mengembalikan deposit.  
3. **No-Show Settlement:** Distribusi deposit peserta tidak hadir sebesar 80/20 setelah deadline.

Pendukung minimal:

* Wallet connection.  
* QR/ticket identifier.  
* Status transaksi.  
* Status kehadiran.  
* Admin check-in.  
* Penampilan data dari smart contract.

## **10.2 Out of Scope**

Tidak dikerjakan untuk MVP:

* Multi-event management.  
* Create event form.  
* User account dan profil.  
* Email atau push notification.  
* Leaderboard.  
* Reward dan loyalty points.  
* Social features.  
* NFT tickets.  
* Secondary ticket marketplace.  
* Token swap.  
* Subscription/payment gateway.  
* Waitlist.  
* AI recommendations.  
* Advanced analytics.  
* Attendance prediction.  
* Refund dispute system.  
* Dynamic QR anti-sharing.

Satu event hardcoded sudah cukup untuk membuktikan mekanisme inti.

---

# **11\. EDGE CASES**

| Kondisi | Expected Behavior |
| ----- | ----- |
| Wallet belum terhubung | Meminta pengguna connect wallet |
| Saldo kurang dari 1 MON \+ gas | Registrasi tidak dapat dilanjutkan |
| Registrasi sudah ditutup | Tombol registrasi disabled |
| Peserta sudah terdaftar | Arahkan ke tiket yang sudah ada |
| Transaksi registrasi gagal | Tidak membuat tiket valid |
| Peserta belum terdaftar | Check-in ditolak |
| Organizer salah wallet | Akses check-in ditolak |
| Peserta check-in dua kali | Transaksi kedua ditolak |
| Peserta datang setelah deadline | Check-in ditolak sesuai aturan |
| Check-in refund gagal | Seluruh transaksi gagal, status tetap aman |
| Settlement sebelum deadline | Ditolak |
| Settlement peserta sudah hadir | Ditolak |
| Settlement dipanggil dua kali | Ditolak |
| Transaksi masih pending | Tampilkan proses, jangan klaim berhasil |
| Halaman di-refresh | Status direkonstruksi dari data kontrak |

---

# **12\. KNOWN RISKS & LIMITATIONS**

## **Risk 1 — Organizer Tidak Jujur**

Organizer dapat menolak melakukan check-in meskipun peserta benar-benar hadir.

**Mitigasi MVP:**

* Ketentuan check-in dan deadline harus ditampilkan jelas.  
* Status dan transaksi dapat diverifikasi on-chain.  
* Organizer wallet harus teridentifikasi.  
* Check-in hanya boleh dilakukan saat peserta hadir.

**Batasan:** MVP belum memiliki mekanisme sengketa. Transparansi blockchain tidak dengan sendirinya membuktikan bahwa keputusan organizer benar.

## **Risk 2 — QR Dibagikan kepada Orang Lain**

Peserta dapat membagikan screenshot QR.

**Mitigasi MVP:** Organizer harus memeriksa kehadiran fisik sebelum mengonfirmasi check-in.

Dynamic QR dan identitas yang lebih kuat dapat menjadi pengembangan berikutnya.

## **Risk 3 — Deposit Terlalu Mahal**

Nilai 1 MON dapat menjadi hambatan bagi sebagian calon peserta dan nilainya dapat berfluktuasi.

**Keputusan MVP:** Gunakan deposit tetap 1 MON untuk menyederhanakan implementasi. Nilai deposit dapat dibuat configurable pada versi berikutnya.

## **Risk 4 — Kegagalan Transaksi**

Transaksi blockchain dapat gagal atau mengalami keterlambatan.

**Mitigasi MVP:** Sediakan state Pending, Success, dan Failed serta kemampuan mencoba ulang aksi yang gagal tanpa membuat transaksi ganda.

## **Risk 5 — Deadline dan Keterlambatan Peserta**

Peserta yang terlambat melewati check-in deadline tetap dianggap no-show.

**Mitigasi MVP:** Tampilkan waktu check-in dan deadline secara jelas sebelum registrasi. Organizer harus menetapkan waktu tenggang yang wajar saat kontrak di-deploy.

---

# **13\. DEVELOPMENT PRIORITY**

## **P0 — Core Loop Wajib Berhasil**

* Smart contract menerima deposit.  
* Website dapat melakukan registrasi.  
* Tiket muncul setelah transaksi sukses.  
* Organizer dapat memproses check-in.  
* Smart contract mengembalikan deposit.  
* Deposit no-show dapat dibagi 80/20 setelah deadline.

## **P1 — UX Polish**

Hanya jika seluruh P0 selesai:

* Animasi success.  
* QR camera scanner.  
* Visualisasi status tambahan.  
* Transisi halaman.  
* Penyempurnaan responsive layout.

## **Development Ownership**

**Smart Contract Developer:**

* Contract deployment.  
* Registrasi deposit.  
* Check-in dan refund.  
* No-show settlement.  
* Contract testing.

**Frontend Developer:**

* Integrasi wallet.  
* Integrasi kontrak.  
* Implementasi tiga halaman.  
* Rendering QR.  
* Status transaksi.  
* Admin check-in.

**UI/UX Designer & Business Strategist:**

* Finalisasi user flow.  
* Desain tiga halaman Figma.  
* Microcopy dan transaction states.  
* Product positioning.  
* Model bisnis.  
* Pitch deck.  
* Live demo narrative.

---

# **14\. DEFINITION OF DONE**

MVP dinyatakan selesai ketika skenario berikut dapat didemonstrasikan secara nyata.

## **Scenario A — Peserta Hadir**

* Peserta terhubung ke wallet Monad.  
* Peserta mengunci 1 MON.  
* Smart contract menyimpan registrasi.  
* Tiket tampil.  
* Organizer menemukan peserta.  
* Organizer mengonfirmasi check-in.  
* Peserta menerima kembali 1 MON.  
* Status berubah menjadi Refunded.

## **Scenario B — Peserta Tidak Hadir**

* Peserta mengunci 1 MON.  
* Peserta tidak melakukan check-in.  
* Check-in deadline berakhir.  
* Status berubah menjadi No-Show.  
* Settlement diproses.  
* Organizer menerima 0,8 MON.  
* Platform menerima 0,2 MON.  
* Status berubah menjadi Settled.

## **Scenario C — Prevent Double Claim**

* Wallet tidak dapat registrasi dua kali.  
* Peserta tidak dapat menerima refund dua kali.  
* Deposit tidak dapat diselesaikan dua kali.  
* Peserta yang check-in tidak dapat dikenai no-show settlement.

**Final MVP Goal:** Minimal satu alur deposit → check-in → refund dan satu alur deposit → no-show → revenue split dapat dibuktikan melalui transaksi smart contract.

---

# **15\. LIVE DEMO PLAN**

Estimasi durasi: 60–75 detik.

**Step 1 — Landing Page (10 detik)**

Tunjukkan satu event dan mekanisme deposit.

Narasi:

"Di NONGOL, peserta tidak cukup hanya klik RSVP. Mereka mengunci 1 MON sebagai komitmen hadir."

**Step 2 — Register (15 detik)**

Connect wallet, lakukan registrasi, dan tunjukkan transaksi.

Narasi:

"Deposit ini masuk ke smart contract Monad, bukan langsung ke organizer."

**Step 3 — Ticket (10 detik)**

Tunjukkan tiket digital dan status Registered.

Narasi:

"Setelah registrasi berhasil, peserta mendapatkan tiket untuk digunakan saat check-in."

**Step 4 — Admin Check-in (20 detik)**

Buka dashboard organizer, masukkan identitas tiket, dan konfirmasi kehadiran.

Narasi:

"Ketika peserta datang, organizer memvalidasi kehadiran. Smart contract kemudian mengembalikan deposit kepada peserta."

**Step 5 — Business Logic (15 detik)**

Tunjukkan hasil refund dan jelaskan pembagian deposit jika no-show.

Narasi:

"Kalau hadir, 100% deposit kembali. Kalau tidak hadir sampai deadline, deposit dibagi 80% kepada panitia dan 20% untuk NONGOL."

Apabila settlement dapat ditunjukkan live, gunakan peserta kedua dan konfigurasi waktu yang cocok untuk demo. Jika belum, jelaskan batas implementasi secara transparan.

---

# **16\. POST-MVP VALIDATION**

Setelah hackathon, lakukan uji coba di satu event komunitas yang sebenarnya.

Data yang perlu dikumpulkan:

1. Jumlah peserta registrasi.  
2. Jumlah peserta yang check-in.  
3. Persentase no-show.  
4. Jumlah refund yang berhasil.  
5. Kesulitan peserta saat mengunci deposit.  
6. Feedback organizer mengenai kemudahan check-in.

Bandingkan hasilnya dengan event sejenis yang menggunakan registrasi tanpa deposit.

Tujuannya adalah membuktikan apakah mekanisme komitmen finansial benar-benar dapat meningkatkan kehadiran, bukan sekadar memastikan smart contract berjalan.

---

# **17\. FINAL PRODUCT STATEMENT**

**NONGOL is an on-chain attendance commitment protocol built on Monad.**

NONGOL membantu organizer mengurangi masalah no-show pada event gratis dengan menerapkan refundable deposit.

Peserta mengunci 1 MON untuk melakukan registrasi. Apabila hadir dan melakukan check-in, deposit dikembalikan sepenuhnya. Apabila tidak hadir sampai batas waktu yang telah ditentukan, deposit didistribusikan kepada organizer dan platform melalui smart contract.

Dengan hanya tiga fitur utama—Commit to Attend, Check-in & Refund, dan No-Show Settlement—NONGOL berfokus menyelesaikan satu masalah nyata: **orang yang mendaftar event tetapi tidak datang.**

**NONGOL — Make Every RSVP Count.**

