"use client";

import { useState, useEffect } from "react";
import { useAccount, usePublicClient, useWriteContract } from "wagmi";
import { Send, Lock, Shield, Cpu, CheckCircle } from "lucide-react";
import { RICHEE_CONTRACT_ADDRESS, RICHEE_ABI } from "@/utils/config";
import Card from "@/components/ui/card";
import { Lightning } from "@inco/js/lite"
import { supportedChains } from "@inco/js"
import { motion, AnimatePresence } from 'framer-motion';
import CipherBackground from './cipher-background';

const EncryptedSubmission = () => {
  const { address } = useAccount();
  const [amount, setAmount] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [submissionCount, setSubmissionCount] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [hasSubmitted, setHasSubmitted] = useState(false);
  const TOTAL_PARTICIPANTS = 3;

  const chainId = supportedChains.baseSepolia
  const zap = Lightning.latest("testnet", chainId)
 
  const { writeContractAsync } = useWriteContract();
  const publicClient = usePublicClient();

  // Function to fetch submission count and user's submission status
  const fetchSubmissionStatus = async () => {
    try {
      const [count, submitted] = await Promise.all([
        publicClient.readContract({
          address: RICHEE_CONTRACT_ADDRESS,
          abi: RICHEE_ABI,
          functionName: "getSubmissionCount",
        }),
        publicClient.readContract({
          address: RICHEE_CONTRACT_ADDRESS,
          abi: RICHEE_ABI,
          functionName: "hasSubmitted",
          args: [address],
        })
      ]);
      setSubmissionCount(Number(count));
      setHasSubmitted(submitted);
    } catch (error) {
      console.error("Error fetching submission status:", error);
    }
  };

  useEffect(() => {
    if (address) {
      fetchSubmissionStatus();
      // Set up an interval to refresh the status
      const interval = setInterval(fetchSubmissionStatus, 10000);
      return () => clearInterval(interval);
    }
  }, [address]);

  const submitEncryptedAmount = async () => {
    if (!amount || Number(amount) <= 0) {
      setError("Please enter a valid amount");
      return;
    }

    setError("");
    setIsLoading(true);
    setIsSubmitting(true);

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

      await fetchSubmissionStatus();
      setAmount("");
    } catch (error) {
      console.error("Transaction failed:", error);
      setError(error.message || "Transaction failed");
    } finally {
      setIsLoading(false);
      setIsSubmitting(false);
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
      <motion.div 
        className="mb-6 bg-gray-700/50 p-4 rounded-none border border-gray-600/50"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="flex items-center justify-between mb-4">
          <span className="text-gray-300 flex items-center">
            <Shield className="w-4 h-4 mr-2 text-blue-400" />
            Encrypted Amount Submissions
          </span>
          <span className="font-semibold flex items-center text-blue-400">
            {submissionCount} / {TOTAL_PARTICIPANTS}
            {submissionCount === TOTAL_PARTICIPANTS && (
              <span className="text-green-400 ml-2">
                <CheckCircle className="w-4 h-4" />
              </span>
            )}
          </span>
        </div>
        
        <div className="relative w-full bg-gray-600/50 h-2 overflow-hidden">
          <motion.div
            className="absolute top-0 left-0 h-full bg-gradient-to-r from-blue-500 to-blue-600"
            initial={{ width: 0 }}
            animate={{ width: `${(submissionCount / TOTAL_PARTICIPANTS) * 100}%` }}
            transition={{ duration: 0.5, ease: "easeOut" }}
          />
          <div className="absolute inset-0 bg-gradient-to-r from-blue-400/20 to-transparent" />
        </div>

      </motion.div>

      <div className="space-y-4">
        {hasSubmitted ? (
          <div className="bg-green-900/20 border border-green-500 text-green-400 p-3 rounded-none text-center">
            You have already submitted your encrypted amount.
          </div>
        ) : (
          <>
            <div className="relative">
              <label htmlFor="amount" className="text-sm font-medium text-gray-300 mb-2 flex items-center">
                <Lock className="w-4 h-4 mr-2 text-blue-400" />
                Your Wealth Amount
              </label>
              <div className="relative">
                <input
                  type="number"
                  id="amount"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="w-full px-4 py-3 focus:outline-none bg-gray-700/50 border border-gray-600/50 rounded-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300"
                  placeholder="Enter your wealth amount"
                  disabled={isLoading}
                />
                <div className="absolute inset-0 pointer-events-none">
                  <CipherBackground density="high" colorScheme="blue" hover={false} />
                </div>
              </div>
            </div>

            <AnimatePresence>
              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="bg-red-900/20 border border-red-500 text-red-400 p-3 rounded-none text-center"
                >
                  {error}
                </motion.div>
              )}
            </AnimatePresence>

            <motion.button
              onClick={submitEncryptedAmount}
              disabled={!amount || Number(amount) <= 0 || isLoading}
              className={`w-full py-3 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-none transition-all duration-300 ${
                !amount || Number(amount) <= 0 || isLoading
                  ? 'opacity-50 cursor-not-allowed'
                  : 'hover:from-blue-600 hover:to-blue-700'
              }`}
              whileHover={!isLoading && amount && Number(amount) > 0 ? { scale: 1.02 } : {}}
              whileTap={!isLoading && amount && Number(amount) > 0 ? { scale: 0.98 } : {}}
            >
              {isLoading ? (
                <div className="flex items-center justify-center">
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                    className="w-5 h-5 border-2 border-white border-t-transparent rounded-full"
                  />
                </div>
              ) : (
                <span className="flex items-center justify-center">
                  <Cpu className="w-4 h-4 mr-2" />
                  Submit Encrypted Amount
                </span>
              )}
            </motion.button>
          </>
        )}
      </div>
    </Card>
  );
};

export default EncryptedSubmission; 