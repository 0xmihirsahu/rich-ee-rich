import { expect } from "chai";
import { wallet, namedWallets, publicClient } from "../utils/wallet";
import {
  Address,
  getContract,
  parseEther,
  getAddress,
  Abi,
  decodeEventLog,
} from "viem";
import { HexString } from "@inco/js/dist/binary";
// @ts-ignore
import { Lightning } from "@inco/js/lite";
import contractAbi from "../artifacts/contracts/RicheeRich.sol/RicheeRich.json";

describe("RicheeRich Tests", function () {
  let contractAddress: Address;
  let richeeRich: any;
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
        namedWallets.alice.account?.address,
        namedWallets.bob.account?.address,
        namedWallets.eve.account?.address,
      ],
    });

    const receipt = await publicClient.waitForTransactionReceipt({ hash: txHash });
    contractAddress = receipt.contractAddress as Address;

    richeeRich = getContract({
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
          accountAddress: namedWallets[participant].account?.address,
          dappAddress: contractAddress,
        });

        const txHash = await namedWallets[participant].writeContract({
          address: contractAddress,
          abi: contractAbi.abi,
          functionName: "submitEncryptedBalance",
          args: [encryptedAmount],
          chain: publicClient.chain,
          account: namedWallets[participant].account ?? null,
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
        functionName: "submitEncryptedBalance",
        args: [encryptedAmount],
        chain: publicClient.chain,
        account: namedWallets.alice.account ?? null,
      });

      await publicClient.waitForTransactionReceipt({ hash: txHash });

      await expect(
        namedWallets.alice.writeContract({
          address: contractAddress,
          abi: contractAbi.abi,
          functionName: "submitEncryptedBalance",
          args: [encryptedAmount],
          chain: publicClient.chain,
          account: namedWallets.alice.account ?? null,
        })
      ).to.be.rejectedWith("AlreadySubmitted()");
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
          chain: publicClient.chain,
          account: wallet.account,
        })
      ).to.be.rejectedWith("InvalidSender()");
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
          accountAddress: namedWallets[participant].account?.address,
          dappAddress: contractAddress,
        });

        const txHash = await namedWallets[participant].writeContract({
          address: contractAddress,
          abi: contractAbi.abi,
          functionName: "submitEncryptedBalance",
          args: [encryptedAmount],
          chain: publicClient.chain,
          account: namedWallets[participant].account ?? null,
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

      const newMillionairesDilemma = getContract({
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
        functionName: "submitEncryptedBalance",
        args: [encryptedAmount],
        chain: publicClient.chain,
        account: namedWallets.alice.account ?? null,
      });

      await publicClient.waitForTransactionReceipt({ hash: txHashSubmit });

      await expect(
        wallet.writeContract({
          address: newContractAddress,
          abi: contractAbi.abi,
          functionName: "determineRichest",
          args: [],
          chain: publicClient.chain,
          account: wallet.account ?? null,
        })
      ).to.be.rejectedWith("NotAllSubmitted()");
    });

    it("should correctly determine the richest participant and decrypt balances", async function () {
      const txHash = await wallet.writeContract({
        address: contractAddress,
        abi: contractAbi.abi,
        functionName: "determineRichest",
        args: [],
        chain: publicClient.chain,
        account: wallet.account ?? null,
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
          log !== null && log.eventName === "RichestDetermined"
        );

      expect(logs.length).to.equal(1);

      const event = logs[0];
      const { isAlice, isBob, isEve } = (event.args as unknown) as { isAlice: boolean; isBob: boolean; isEve: boolean };
      console.log("isAlice", isAlice);
      console.log("isBob", isBob);
      console.log("isEve", isEve);
      expect(isBob).to.be.true;
      expect(isAlice).to.be.false;
      expect(isEve).to.be.false;

      // Decrypt and assert balances
      const expectedValues: Record<string, string> = {
        alice: '100',
        bob: '200',
        eve: '150',
      };

      for (const participant of ['alice', 'bob', 'eve']) {
        const address = namedWallets[participant].account?.address;

        const encryptedBalance = await publicClient.readContract({
          address: contractAddress,
          abi: contractAbi.abi,
          functionName: "getEncryptedBalance",
          args: [address],
        });

        const reencryptor = reEncryptors[participant];
        const resultPlaintext = await reencryptor({ handle: encryptedBalance });

        console.log(`${participant} decrypted:`, resultPlaintext.value.toString());
        expect(resultPlaintext.value.toString()).to.equal(
          parseEther(expectedValues[participant]).toString()
        );
      }
    });
  });
});