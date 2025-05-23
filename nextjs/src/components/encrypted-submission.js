import React, { useState, useEffect } from "react";
import {
  useAccount,
  usePublicClient,
  useWriteContract,
} from "wagmi";
import { Send, Users } from "lucide-react";
import { encryptValue } from "@/utils/inco-lite";
import { parseEther } from "viem";
import { ENCRYPTED_ERC20_CONTRACT_ADDRESS } from "@/utils/contract";
import Card from "@/components/ui/card";

const EncryptedSubmission = () => {
  const { address } = useAccount();
  const [amount, setAmount] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [submissionCount, setSubmissionCount] = useState(0);
  const TOTAL_PARTICIPANTS = 3;

  const { writeContractAsync } = useWriteContract();
  const publicClient = usePublicClient();

  // Function to fetch submission count
  const fetchSubmissionCount = async () => {
    try {
      const count = await publicClient.readContract({
        address: ENCRYPTED_ERC20_CONTRACT_ADDRESS,
        abi: [
          {
            inputs: [],
            name: "getSubmissionCount",
            outputs: [{ type: "uint256" }],
            stateMutability: "view",
            type: "function",
          },
        ],
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
      let parsedAmount = parseEther(amount);
      // Encrypt the value
      const encryptedData = await encryptValue({
        value: parsedAmount,
        address: address,
        contractAddress: ENCRYPTED_ERC20_CONTRACT_ADDRESS,
      });

      const hash = await writeContractAsync({
        address: ENCRYPTED_ERC20_CONTRACT_ADDRESS,
        abi: [
          {
            inputs: [
              {
                internalType: "bytes",
                name: "encryptedAmount",
                type: "bytes",
              },
            ],
            name: "submitEncryptedAmount",
            outputs: [],
            stateMutability: "nonpayable",
            type: "function",
          },
        ],
        functionName: "submitEncryptedAmount",
        args: [encryptedData],
      });

      const transaction = await publicClient.waitForTransactionReceipt({
        hash: hash,
      });

      if (transaction.status !== "success") {
        throw new Error("Transaction failed");
      }

      // Refresh submission count after successful submission
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
    <Card className="flex items-center justify-center w-full">
      <div className="w-full bg-gray-700/40 rounded-none shadow-2xl border border-gray-700 overflow-hidden">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-white flex items-center">
              <Send className="mr-3 text-blue-400" />
              Submit Encrypted Amount
            </h2>
          </div>

          {/* Submission Status */}
          <div className="mb-6 bg-gray-800/50 p-4 rounded-none">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <Users className="mr-2 text-blue-400" />
                <span className="text-gray-300">Submissions:</span>
              </div>
              <div className="text-white font-semibold">
                {submissionCount} / {TOTAL_PARTICIPANTS}
              </div>
            </div>
            <div className="mt-2 w-full bg-gray-700 rounded-none h-1">
              <div
                className="bg-blue-500 h-1 rounded-none transition-all duration-300"
                style={{ width: `${(submissionCount / TOTAL_PARTICIPANTS) * 100}%` }}
              ></div>
            </div>
          </div>

          <div className="space-y-5">

            {error && (
              <div className="bg-red-900/20 border border-red-500 text-red-400 p-3 rounded-lg text-center">
                {error}
              </div>
            )}

            <button
              onClick={submitEncryptedAmount}
              className="w-full p-3 bg-blue-600 text-white rounded-none hover:bg-blue-700 transition-colors flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={!amount || Number(amount) <= 0 || isLoading}
            >
              {isLoading ? (
                <div className="animate-spin rounded-none h-5 w-5 border-b-2 border-white"></div>
              ) : (
                "Submit Encrypted Amount"
              )}
            </button>
          </div>
        </div>
      </div>
    </Card>
  );
};

export default EncryptedSubmission; 