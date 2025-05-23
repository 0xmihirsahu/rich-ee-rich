import { expect } from "chai";
import { wallet, namedWallets, publicClient } from "../utils/wallet";
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

    it("should revert if not all participants have submitted", async function () {
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
      const newContractAddress = receipt.contractAddress as Address;

      const richeeTemp = getContract({
        address: newContractAddress as HexString,
        abi: contractAbi.abi,
        client: wallet,
      });

      const amount = parseEther("100");
      const encryptedAmount = await incoConfig.encrypt(amount, {
        accountAddress: namedWallets.alice.account?.address,
        dappAddress: newContractAddress,
      });

      const txHashSubmit = await namedWallets.alice.writeContract({
        address: newContractAddress,
        abi: contractAbi.abi,
        functionName: "submit",
        args: [encryptedAmount],
        chain: publicClient.chain,
        account: namedWallets.alice.account as Account,
      });

      await publicClient.waitForTransactionReceipt({ hash: txHashSubmit });

      await expect(
        wallet.writeContract({
          address: newContractAddress,
          abi: contractAbi.abi,
          functionName: "startComparison",
          args: [],
          chain: publicClient.chain,
          account: wallet.account,
        })
      ).to.be.rejectedWith("IncompleteSubmissions()");
    });

    it("should emit RichestFound event upon determining the richest", async function () {
      const txHash = await namedWallets.alice.writeContract({
        address: contractAddress,
        abi: contractAbi.abi,
        functionName: "startComparison",
        args: [],
        chain: publicClient.chain,
        account: namedWallets.alice.account as Account,
      });

      const receipt = await publicClient.waitForTransactionReceipt({ hash: txHash });

      const logs = receipt.logs
        .map((log) => {
          try {
            return decodeEventLog({
              abi: contractAbi.abi,
              data: log.data,
              topics: log.topics,
            });
          } catch {
            return null;
          }
        })
        .filter((log): log is NonNullable<typeof log> =>
          log !== null && log.eventName === "RichestFound"
        );
      console.log("logs: ",logs);
      expect(logs.length).to.equal(1);
      console.log("logs: ",logs[0]);
      console.log("logs[0].args: ",logs[0].args);
      const richestAddress = logs[0].args as unknown as Address;
      expect(richestAddress).to.equal(namedWallets.bob.account?.address); // Bob had 200
    });
  });
});
