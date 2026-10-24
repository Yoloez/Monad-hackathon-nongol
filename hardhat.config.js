require("@nomicfoundation/hardhat-toolbox");
require("dotenv").config();

const rawPk = process.env.DEPLOYER_PRIVATE_KEY || "";
const accounts = rawPk ? [rawPk.startsWith("0x") ? rawPk : `0x${rawPk}`] : [];

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  solidity: {
    version: "0.8.20",
    settings: {
      optimizer: {
        enabled: true,
        runs: 200,
      },
    },
  },
  networks: {
    monadTestnet: {
      url: process.env.MONAD_RPC_URL || process.env.NEXT_PUBLIC_MONAD_RPC_URL || "https://rpc.ankr.com/monad_testnet",
      chainId: 10143,
      accounts: accounts,
    },
  },
  paths: {
    sources: "./contracts",
    tests: "./test",
    cache: "./cache",
    artifacts: "./artifacts",
  },
};
