"use client";

import { useState, useEffect } from "react";
import { useAccount, usePublicClient, useWriteContract, useWatchContractEvent } from "wagmi";
import { Trophy } from "lucide-react";
import { RICHEE_CONTRACT_ADDRESS, RICHEE_ABI } from "@/utils/config";
import Card from "@/components/ui/card";

const RichestReveal = () => {
  const { address } = useAccount();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [richestAddress, setRichestAddress] = useState(null);
  const [isFinalized, setIsFinalized] = useState(false);
  const [allSubmitted, setAllSubmitted] = useState(false);

  const { writeContractAsync } = useWriteContract();
  const publicClient = usePublicClient();

  useEffect(() => {
    let unwatch;
  
    const setupWatcher = async () => {
      unwatch = await publicClient.watchContractEvent({
        address: RICHEE_CONTRACT_ADDRESS,
        abi: RICHEE_ABI,
        eventName: "RichestFound",
        onLogs: (logs) => {
          if (logs?.length) {
            console.log("logs: ",logs);
            console.log("logs[0].args: ",logs[0].args);
            const richest = logs[0]?.args?.richest;
            console.log("richest: ",richest);
            if (richest) {
              setRichestAddress(richest);
              setIsFinalized(true);
            }
          }
        },
      });
    };
  
    setupWatcher();
  
    return () => {
      if (unwatch) unwatch();
    };
  }, [publicClient]);

  // Function to check if all participants have submitted
  const checkAllSubmitted = async () => {
    try {
      const submitted = await publicClient.readContract({
        address: RICHEE_CONTRACT_ADDRESS,
        abi: RICHEE_ABI,
        functionName: "allSubmitted",
      });
      setAllSubmitted(submitted);
    } catch (error) {
      console.error("Error checking submissions:", error);
    }
  };

  // Function to check if the result has been finalized
  const checkFinalized = async () => {
    try {
      const finalized = await publicClient.readContract({
        address: RICHEE_CONTRACT_ADDRESS,
        abi: RICHEE_ABI,
        functionName: "isFinalized",
      });
      setIsFinalized(finalized);
    } catch (error) {
      console.error("Error checking finalization:", error);
    }
  };

  // Function to start the comparison
  const startComparison = async () => {
    setError("");
    setIsLoading(true);

    try {
      const hash = await writeContractAsync({
        address: RICHEE_CONTRACT_ADDRESS,
        abi: RICHEE_ABI,
        functionName: "startComparison",
      });

      const transaction = await publicClient.waitForTransactionReceipt({
        hash: hash,
      });

      if (transaction.status !== "success") {
        throw new Error("Transaction failed");
      }

      // Start polling for the result
      pollForResult();
    } catch (error) {
      console.error("Transaction failed:", error);
      setError(error.message || "Transaction failed");
    } finally {
      setIsLoading(false);
    }
  };

  // Function to poll for the result
  const pollForResult = async () => {
    const checkResult = async () => {
      try {
        const finalized = await publicClient.readContract({
          address: RICHEE_CONTRACT_ADDRESS,
          abi: RICHEE_ABI,
          functionName: "isFinalized",
        });

        if (finalized) {
          setIsFinalized(true);
        } else {
          setTimeout(checkResult, 2000); // Poll every 2 seconds
        }
      } catch (error) {
        console.error("Error polling for result:", error);
      }
    };

    checkResult();
  };

  useEffect(() => {
    checkAllSubmitted();
    checkFinalized();
    // Set up polling interval
    const interval = setInterval(() => {
      checkAllSubmitted();
      checkFinalized();
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  return (
    <Card className="bg-gray-800/70">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold flex items-center">
          <Trophy className="mr-3 text-yellow-400" />
          Richest Participant
        </h2>
      </div>

      <div className="space-y-4">
        {error && (
          <div className="bg-red-900/20 border border-red-500 text-red-400 p-3 rounded-none text-center">
            {error}
          </div>
        )}

        {isFinalized ? (
          <div className="text-center">
            <p className="text-gray-300 mb-2">The richest participant is:</p>
            <p className="text-xl font-semibold text-yellow-400">
              {richestAddress === address ? "You!" : richestAddress}
            </p>
          </div>
        ) : (
          <div className="text-center">
            <p className="text-gray-300 mb-4">
              {allSubmitted
                ? "All participants have submitted their wealth. Ready to reveal the richest!"
                : "Waiting for all participants to submit their wealth..."}
            </p>
            <button
              onClick={startComparison}
              disabled={!allSubmitted || isLoading}
              className="w-full py-3 bg-yellow-600 text-white rounded-none hover:bg-yellow-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <div className="flex items-center justify-center">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                </div>
              ) : (
                "Reveal Richest"
              )}
            </button>
          </div>
        )}
      </div>
    </Card>
  );
};

export default RichestReveal; 