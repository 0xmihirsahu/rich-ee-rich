import { expect } from "chai";
import { wallet, namedWallets, publicClient } from "../utils/wallet";
import {
  Address,
  getContract,
  parseEther,
  getAddress,
} from "viem";
import { HexString } from "@inco/js/dist/binary";
import { Lightning } from "@inco/js/lite";
import contractAbi from "../artifacts/contracts/MillionairesDilemma.sol/MillionairesDilemma.json";

describe("MillionairesDilemma Tests", function () {
  let contractAddress: Address;
  let millionairesDilemma: any;
  let incoConfig: any;
  let reEncryptors: Record<string, any>;

  beforeEach(async function () {
    const chainId = publicClient.chain.id;
    incoConfig = chainId === 31337
      ? Lightning.localNode()
      : Lightning.latest('testnet', 84532);

    reEncryptors = {
      alice: await incoConfig.getReencryptor(namedWallets.alice),
      bob: await incoConfig.getReencryptor(namedWallets.bob),
      eve: await incoConfig.getReencryptor(namedWallets.eve),
      main: await incoConfig.getReencryptor(wallet),
    };

    const txHash = await wallet.deployContract({
      abi: contractAbi.abi,
      bytecode: contractAbi.bytecode as HexString,
      args: [
        namedWallets.alice.account.address,
        namedWallets.bob.account.address,
        namedWallets.eve.account.address,
      ],
    });

    const receipt = await publicClient.waitForTransactionReceipt({ hash: txHash });
    contractAddress = receipt.contractAddress as Address;

    millionairesDilemma = getContract({
      address: contractAddress as HexString,
      abi: contractAbi.abi,
      client: wallet,
    });
  });

  describe("Encrypted Balance Submission", function () {
    it("should allow each participant to submit an encrypted balance", async function () {
      const participants = ['alice', 'bob', 'eve'];
      const amounts = ['100', '200', '150'];

      for (let i = 0; i < participants.length; i++) {
        const participant = participants[i];
        const amount = parseEther(amounts[i]);
        const encryptedAmount = await incoConfig.encrypt(amount, {
          accountAddress: namedWallets[participant].account.address,
          dappAddress: contractAddress,
        });

        const txHash = await namedWallets[participant].writeContract({
          address: contractAddress,
          abi: contractAbi.abi,
          functionName: "submitEncryptedBalance",
          args: [encryptedAmount],
        });

        await publicClient.waitForTransactionReceipt({ hash: txHash });
      }

      for (const participant of participants) {
        const hasSubmitted = await publicClient.readContract({
          address: contractAddress,
          abi: contractAbi.abi,
          functionName: "hasSubmitted",
          args: [namedWallets[participant].account.address],
        });
        expect(hasSubmitted).to.be.true;
      }
    });

    it("should revert if a participant submits more than once", async function () {
      const amount = parseEther("100");
      const encryptedAmount = await incoConfig.encrypt(amount, {
        accountAddress: namedWallets.alice.account.address,
        dappAddress: contractAddress,
      });

      const txHash = await namedWallets.alice.writeContract({
        address: contractAddress,
        abi: contractAbi.abi,
        functionName: "submitEncryptedBalance",
        args: [encryptedAmount],
      });

      await publicClient.waitForTransactionReceipt({ hash: txHash });

      await expect(
        namedWallets.alice.writeContract({
          address: contractAddress,
          abi: contractAbi.abi,
          functionName: "submitEncryptedBalance",
          args: [encryptedAmount],
        })
      ).to.be.revertedWith("AlreadySubmitted()");
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
          functionName: "submitEncryptedBalance",
          args: [encryptedAmount],
        })
      ).to.be.revertedWith("InvalidSender()");
    });
  });

  describe("Determine Richest", function () {
    beforeEach(async function () {
      const participants = ['alice', 'bob', 'eve'];
      const amounts = ['100', '200', '150'];

      for (let i = 0; i < participants.length; i++) {
        const participant = participants[i];
        const amount = parseEther(amounts[i]);
        const encryptedAmount = await incoConfig.encrypt(amount, {
          accountAddress: namedWallets[participant].account.address,
          dappAddress: contractAddress,
        });

        const txHash = await namedWallets[participant].writeContract({
          address: contractAddress,
          abi: contractAbi.abi,
          functionName: "submitEncryptedBalance",
          args: [encryptedAmount],
        });

        await publicClient.waitForTransactionReceipt({ hash: txHash });
      }
    });

    it("should revert if not all participants have submitted", async function () {
      // Deploy a new contract with only two submissions
      const txHash = await wallet.deployContract({
        abi: contractAbi.abi,
        bytecode: contractAbi.bytecode as HexString,
        args: [
          namedWallets.alice.account.address,
          namedWallets.bob.account.address,
          namedWallets.eve.account.address,
        ],
      });

      const receipt = await publicClient.waitForTransactionReceipt({ hash: txHash });
      const newContractAddress = receipt.contractAddress as Address;

      const newMillionairesDilemma = getContract({
        address: newContractAddress as HexString,
        abi: contractAbi.abi,
        client: wallet,
      });

      const amount = parseEther("100");
      const encryptedAmount = await incoConfig.encrypt(amount, {
        accountAddress: namedWallets.alice.account.address,
        dappAddress: newContractAddress,
      });

      const txHashSubmit = await namedWallets.alice.writeContract({
        address: newContractAddress,
        abi: contractAbi.abi,
        functionName: "submitEncryptedBalance",
        args: [encryptedAmount],
      });

      await publicClient.waitForTransactionReceipt({ hash: txHashSubmit });

      await expect(
        wallet.writeContract({
          address: newContractAddress,
          abi: contractAbi.abi,
          functionName: "determineRichest",
          args: [],
        })
      ).to.be.revertedWith("NotAllSubmitted()");
    });

    it("should correctly determine the richest participant", async function () {
      const txHash = await wallet.writeContract({
        address: contractAddress,
        abi: contractAbi.abi,
        functionName: "determineRichest",
        args: [],
      });

      const receipt = await publicClient.waitForTransactionReceipt({ hash: txHash });

      const logs = receipt.logs.filter(
        (log) => log.eventName === "RichestDetermined"
      );

      expect(logs.length).to.equal(1);

      const event = logs[0];
      const { isAlice, isBob, isEve } = event.args;

      // Assuming isBob is true, as Bob had the highest amount (200)
      expect(isBob).to.be.true;
      expect(isAlice).to.be.false;
      expect(isEve).to.be.false;
    });
  });
});