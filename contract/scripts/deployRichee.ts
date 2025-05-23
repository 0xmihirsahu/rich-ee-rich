import hre from "hardhat"

async function main() {
  const [account] = await hre.viem.getWalletClients()
  const alice = "0xefef25DC435BE9B8c72D52b598806abEFF3f2c28"
  const bob = "0x40AB46732a2EC746066e93D2f7e671d91b4cb2B4"
  const eve =  "0x73e41EA30121593b367020D8e6B62984660D2989"
  const richee = await hre.viem.deployContract("Richee", [
    alice, // alice address
    bob, // bob address
    eve, // eve address
  ])

  console.log("Richee deployed to:", richee.address)
  console.log("Owner address:", account.account.address)
  console.log("Alice address:", alice)
  console.log("Bob address:", bob)
  console.log("Eve address:", eve)
}

main().catch((error) => {
  console.error(error)
  process.exitCode = 1
})