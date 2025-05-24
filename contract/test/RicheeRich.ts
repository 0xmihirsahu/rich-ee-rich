import { expect } from "chai";
import { wallet, namedWallets, publicClient, wallet as walletClient } from "../utils/wallet";
import {
  Address,
  getContract,
  parseEther,
  getAddress,
  Abi,
  decodeEventLog,
  Account,
} from "viem";
import { HexString } from "@inco/js/dist/binary";
// @ts-ignore
import { Lightning } from "@inco/js/lite";
import contractAbi from "../artifacts/contracts/Richee.sol/Richee.json";

describe("Richee Tests", function () {
  let contractAddress: Address;
  let richee: any;
  let incoConfig: any;

  beforeEach(async function () {
    const chainId = publicClient.chain.id;
    incoConfig = chainId === 31337
      ? Lightning.localNode()
      : Lightning.latest("testnet", 84532);

    const txHash = await wallet.deployContract({
      abi: contractAbi.abi,
      bytecode: contractAbi.bytecode as HexString,
      args: [
        namedWallets.alice.account?.address,
        namedWallets.bob.account?.address,
        namedWallets.eve.account?.address,
      ],
    });

    const receipt = await publicClient.waitForTransactionReceipt({ hash: txHash });
    contractAddress = receipt.contractAddress as Address;

    richee = getContract({
      address: contractAddress as HexString,
      abi: contractAbi.abi,
      client: wallet,
    });
  });

  describe("Encrypted Wealth Submission", function () {
    it("should allow each participant to submit an encrypted wealth", async function () {
      const participants = ["alice", "bob", "eve"];
      const amounts = ["100", "200", "150"];

      for (let i = 0; i < participants.length; i++) {
        const participant = participants[i];
        const amount = parseEther(amounts[i]);
        const encryptedAmount = await incoConfig.encrypt(amount, {
          accountAddress: namedWallets[participant].account?.address,
          dappAddress: contractAddress,
        });

        const txHash = await namedWallets[participant].writeContract({
          address: contractAddress,
          abi: contractAbi.abi,
          functionName: "submit",
          args: [encryptedAmount],
          chain: publicClient.chain,
          account: namedWallets[participant].account as Account,
        });

        await publicClient.waitForTransactionReceipt({ hash: txHash });
      }

      for (const participant of participants) {
        const hasSubmitted = await publicClient.readContract({
          address: contractAddress,
          abi: contractAbi.abi,
          functionName: "hasSubmitted",
          args: [namedWallets[participant].account?.address],
        });
        expect(hasSubmitted).to.be.true;
      }
    });

    it("should revert if a participant submits more than once", async function () {
      const amount = parseEther("100");
      const encryptedAmount = await incoConfig.encrypt(amount, {
        accountAddress: namedWallets.alice.account?.address,
        dappAddress: contractAddress,
      });

      const txHash = await namedWallets.alice.writeContract({
        address: contractAddress,
        abi: contractAbi.abi,
        functionName: "submit",
        args: [encryptedAmount],
        chain: publicClient.chain,
        account: namedWallets.alice.account as Account,
      });

      await publicClient.waitForTransactionReceipt({ hash: txHash });

      await expect(
        namedWallets.alice.writeContract({
          address: contractAddress,
          abi: contractAbi.abi,
          functionName: "submit",
          args: [encryptedAmount],
          chain: publicClient.chain,
          account: namedWallets.alice.account as Account,
        })
      ).to.be.rejectedWith("DuplicateSubmission()");
    });

    it("should revert if a non-participant tries to submit", async function () {
      const amount = parseEther("100");
      const encryptedAmount = await incoConfig.encrypt(amount, {
        accountAddress: wallet.account.address,
        dappAddress: contractAddress,
      });

      await expect(
        wallet.writeContract({
          address: contractAddress,
          abi: contractAbi.abi,
          functionName: "submit",
          args: [encryptedAmount],
          chain: publicClient.chain,
          account: wallet.account,
        })
      ).to.be.rejectedWith("InvalidParticipant()");
    });
  });

  describe("Determine Richest", function () {
    beforeEach(async function () {
      const participants = ["alice", "bob", "eve"];
      const amounts = ["100", "200", "150"];

      for (let i = 0; i < participants.length; i++) {
        const participant = participants[i];
        const amount = parseEther(amounts[i]);
        const encryptedAmount = await incoConfig.encrypt(amount, {
          accountAddress: namedWallets[participant].account?.address,
          dappAddress: contractAddress,
        });

        const txHash = await namedWallets[participant].writeContract({
          address: contractAddress,
          abi: contractAbi.abi,
          functionName: "submit",
          args: [encryptedAmount],
          chain: publicClient.chain,
          account: namedWallets[participant].account as Account,
        });

        await publicClient.waitForTransactionReceipt({ hash: txHash });
      }
    });

    it("should emit EncryptedRichestAddress and decrypt it to find actual richest", async function () {
      const txHash = await namedWallets.alice.writeContract({
        address: contractAddress,
        abi: contractAbi.abi,
        functionName: "startComparison",
        args: [],
        chain: publicClient.chain,
        account: namedWallets.alice.account as Account,
      });

      const receipt = await publicClient.waitForTransactionReceipt({ hash: txHash });
      const blockNumber = receipt.blockNumber;

      const logs = await publicClient.getLogs({
        address: contractAddress,
        event: {
          type: 'event',
          name: 'EncryptedRichestAddress',
          inputs: [
            {
              indexed: false,
              name: 'encryptedAddress',
              type: 'bytes32'
            }
          ]
        },
        fromBlock: blockNumber,
        toBlock: blockNumber,
      });

      expect(logs.length).to.be.greaterThan(0);
      const encryptedRichest = logs[logs.length - 1].args?.encryptedAddress as HexString;
      console.log("Encrypted richest address:", encryptedRichest);

      const reencryptor = await incoConfig.getReencryptor(walletClient);
      console.log("Reencryptor obtained");
      
      const decryptedRichest = reencryptor({handle: encryptedRichest});
      console.log("Decrypted result:", decryptedRichest);
      
      if (!decryptedRichest || !decryptedRichest.value) {
        throw new Error("Decryption failed: No value returned");
      }

      const decryptedRichestString = decryptedRichest.value.toString();
      console.log("Decrypted string:", decryptedRichestString);

      // Convert the decrypted string to an address
      const decryptedAddress = getAddress(decryptedRichestString);
      console.log("Decrypted address:", decryptedAddress);
      console.log("Expected address:", namedWallets.bob.account?.address);
      
      expect(decryptedAddress).to.equal(namedWallets.bob.account?.address);
    });
  });
});