import hre from "hardhat"

async function main() {
  const [account] = await hre.viem.getWalletClients()
  const confidentialERC20 = await hre.viem.deployContract("ConfidentialERC20")

  console.log("ConfidentialERC20 deployed to:", confidentialERC20.address)
  console.log("Owner address:", account.account.address)
}

main().catch((error) => {
  console.error(error)
  process.exitCode = 1
})