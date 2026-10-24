const hre = require("hardhat");
const fs = require("fs");
const path = require("path");

async function main() {
  console.log("==================================================");
  console.log("🚀 NONGOL PROTOCOL - HARDHAT DEPLOYMENT TO MONAD");
  console.log("==================================================");

  const [deployer] = await hre.ethers.getSigners();
  if (!deployer) {
    throw new Error("No deployer account configured. Check DEPLOYER_PRIVATE_KEY in .env");
  }

  const deployerAddress = await deployer.getAddress();
  const balance = await hre.ethers.provider.getBalance(deployerAddress);
  console.log(`📍 Deployer Address: ${deployerAddress}`);
  console.log(`💰 Deployer Balance: ${hre.ethers.formatEther(balance)} MON`);

  if (balance === 0n) {
    throw new Error("Saldo MON deployer adalah 0. Klaim faucet terlebih dahulu.");
  }

  // Configurations
  const organizer = process.env.ORGANIZER_ADDRESS || deployerAddress;
  const platform = process.env.PLATFORM_ADDRESS || deployerAddress;

  const now = Math.floor(Date.now() / 1000);
  // Registration open for 30 days
  const registrationDeadline = now + 30 * 24 * 3600;
  // Check-in opens immediately (doors open now) so check-ins can be tested without waiting!
  const checkInStartTime = now - 60;
  // Check-in window stays open for 35 days
  const checkInDeadline = now + 35 * 24 * 3600;

  console.log("\n📋 Event Parameters:");
  console.log(`   Organizer:             ${organizer}`);
  console.log(`   Platform (15% share):  ${platform}`);
  console.log(`   Registration Deadline: ${new Date(registrationDeadline * 1000).toLocaleString()}`);
  console.log(`   Check-in Start Time:   ${new Date(checkInStartTime * 1000).toLocaleString()} (Active now!)`);
  console.log(`   Check-in Deadline:     ${new Date(checkInDeadline * 1000).toLocaleString()}`);

  console.log("\n⏳ Deploying NongolEvent contract to Monad Testnet...");
  const NongolEvent = await hre.ethers.getContractFactory("NongolEvent");
  const nongol = await NongolEvent.deploy(
    organizer,
    platform,
    registrationDeadline,
    checkInStartTime,
    checkInDeadline
  );

  console.log(`   Tx Hash: ${nongol.deploymentTransaction().hash}`);
  console.log("⏳ Menunggu konfirmasi blok Monad...");
  await nongol.waitForDeployment();

  const contractAddress = await nongol.getAddress();
  console.log("\n==================================================");
  console.log(`✅ NongolEvent BERHASIL DI-DEPLOY!`);
  console.log(`📍 Contract Address: ${contractAddress}`);
  console.log(`🔗 Monad Explorer:  https://testnet.monadexplorer.com/address/${contractAddress}`);
  console.log("==================================================");

  // Update .env file automatically
  const envPath = path.resolve(__dirname, "../.env");
  if (fs.existsSync(envPath)) {
    let envContent = fs.readFileSync(envPath, "utf8");
    if (envContent.includes("NEXT_PUBLIC_NONGOL_CONTRACT_ADDRESS=")) {
      envContent = envContent.replace(
        /NEXT_PUBLIC_NONGOL_CONTRACT_ADDRESS=.*/,
        `NEXT_PUBLIC_NONGOL_CONTRACT_ADDRESS=${contractAddress}`
      );
    } else {
      envContent += `\nNEXT_PUBLIC_NONGOL_CONTRACT_ADDRESS=${contractAddress}\n`;
    }
    fs.writeFileSync(envPath, envContent, "utf8");
    console.log(`📝 Berhasil mengupdate NEXT_PUBLIC_NONGOL_CONTRACT_ADDRESS di .env ke: ${contractAddress}`);
  }

  // Update ABI artifact in build/ if present
  const artifactPath = path.resolve(__dirname, "../artifacts/contracts/NongolEvent.sol/NongolEvent.json");
  if (fs.existsSync(artifactPath)) {
    const artifact = JSON.parse(fs.readFileSync(artifactPath, "utf8"));
    const buildDir = path.resolve(__dirname, "../build");
    if (!fs.existsSync(buildDir)) fs.mkdirSync(buildDir, { recursive: true });
    fs.writeFileSync(
      path.resolve(buildDir, "NongolEvent.json"),
      JSON.stringify({ address: contractAddress, abi: artifact.abi, bytecode: artifact.bytecode }, null, 2),
      "utf8"
    );
  }
}

main().catch((error) => {
  console.error("❌ Deployment failed:", error);
  process.exit(1);
});
