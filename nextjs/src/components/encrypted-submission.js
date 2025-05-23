"use client";

import { useState, useEffect } from "react";
import { useAccount, usePublicClient, useWriteContract } from "wagmi";
import { Send } from "lucide-react";
import { RICHEE_CONTRACT_ADDRESS, RICHEE_ABI } from "@/utils/config";
import Card from "@/components/ui/card";
import { Lightning } from "@inco/js/lite"
import { supportedChains } from "@inco/js"

const EncryptedSubmission = () => {
  const { address } = useAccount();
  const [amount, setAmount] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [submissionCount, setSubmissionCount] = useState(0);
  const TOTAL_PARTICIPANTS = 3;

  const chainId = supportedChains.baseSepolia
  const zap = Lightning.latest("testnet", chainId)
 
  const { writeContractAsync } = useWriteContract();
  const publicClient = usePublicClient();

  // Function to fetch submission count
  const fetchSubmissionCount = async () => {
    try {
      const count = await publicClient.readContract({
        address: RICHEE_CONTRACT_ADDRESS,
        abi: RICHEE_ABI,
        functionName: "getSubmissionCount",
      });
      setSubmissionCount(Number(count));
    } catch (error) {
      console.error("Error fetching submission count:", error);
    }
  };

  useEffect(() => {
    fetchSubmissionCount();
    // Set up an interval to refresh the count
    const interval = setInterval(fetchSubmissionCount, 10000);
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const submitEncryptedAmount = async () => {
    if (!amount || Number(amount) <= 0) {
      setError("Please enter a valid amount");
      return;
    }

    setError("");
    setIsLoading(true);

    try {
      const encryptedValue = await zap.encrypt(parseFloat(amount), {
        accountAddress: address,
        dappAddress: RICHEE_CONTRACT_ADDRESS,
      })

      const txHash = await writeContractAsync({
        address: RICHEE_CONTRACT_ADDRESS,
        abi: RICHEE_ABI,
        functionName: "submit",
        args: [encryptedValue],
      });

      const transaction = await publicClient.waitForTransactionReceipt({
        hash: txHash,
      });

      if (transaction.status !== "success") {
        throw new Error("Transaction failed");
      }

      await fetchSubmissionCount();
      setAmount("");
    } catch (error) {
      console.error("Transaction failed:", error);
      setError(error.message || "Transaction failed");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="bg-gray-800/70">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold flex items-center">
          <Send className="mr-3 text-blue-400" />
          Submit Encrypted Amount
        </h2>
      </div>

      {/* Submission Status */}
      <div className="mb-6 bg-gray-700/50 p-4 rounded-none">
        <div className="flex items-center justify-between mb-2">
          <span className="text-gray-300">Submissions:</span>
          <span className="font-semibold">
            {submissionCount} / {TOTAL_PARTICIPANTS}
          </span>
        </div>
        <div className="w-full bg-gray-600 rounded-full h-2">
          <div
            className="bg-blue-500 h-2 rounded-full transition-all duration-300"
            style={{ width: `${(submissionCount / TOTAL_PARTICIPANTS) * 100}%` }}
          ></div>
        </div>
      </div>

      <div className="space-y-4">
        <div>
          <label htmlFor="amount" className="block text-sm font-medium text-gray-300 mb-2">
            Your Wealth Amount
          </label>
          <input
            type="number"
            id="amount"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="Enter your wealth amount"
          />
        </div>

        {error && (
          <div className="bg-red-900/20 border border-red-500 text-red-400 p-3 rounded-none text-center">
            {error}
          </div>
        )}

        <button
          onClick={submitEncryptedAmount}
          disabled={!amount || Number(amount) <= 0 || isLoading}
          className="w-full py-3 bg-blue-600 text-white rounded-none hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoading ? (
            <div className="flex items-center justify-center">
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
            </div>
          ) : (
            "Submit Encrypted Amount"
          )}
        </button>
      </div>
    </Card>
  );
};

export default EncryptedSubmission; 