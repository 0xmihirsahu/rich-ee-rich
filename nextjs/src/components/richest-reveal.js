"use client";

import { useState, useEffect, useCallback } from "react";
import { useAccount, usePublicClient, useWriteContract, useWalletClient } from "wagmi";
import { Trophy } from "lucide-react";
import { RICHEE_CONTRACT_ADDRESS, RICHEE_ABI } from "@/utils/config";
import Card from "@/components/ui/card";
import TextScramble from "@/components/text-scramble";
import { motion, AnimatePresence } from 'framer-motion';
import { supportedChains } from '@inco/js';
import { Lightning } from "@inco/js/lite";
import { getAddress, parseEventLogs } from "viem";

const RichestReveal = () => {
  const { address } = useAccount();
  const [isLoading, setIsLoading] = useState(false);
  const [isRevealing, setIsRevealing] = useState(false);
  const [error, setError] = useState("");
  const [richestAddress, setRichestAddress] = useState(null);
  const [isFinalized, setIsFinalized] = useState(false);
  const [allSubmitted, setAllSubmitted] = useState(false);
  const [participants, setParticipants] = useState({
    alice: null,
    bob: null,
    eve: null
  });
  const [showScramble, setShowScramble] = useState(false);
  const [displayText, setDisplayText] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [shouldShowModal, setShouldShowModal] = useState(false);

  const { writeContractAsync } = useWriteContract();
  const publicClient = usePublicClient();
  const { data: walletClient } = useWalletClient();
  const incoConfig = Lightning.latest('testnet', supportedChains.baseSepolia);

  // Add these helper functions at the top level of the component
  const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

  const pollForResult = async (maxAttempts = 10, interval = 3000) => {
    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      console.log(`Polling attempt ${attempt}/${maxAttempts}`);
      
      try {
        // Try to get the result from contract state first
        const encryptedRichest = await publicClient.readContract({
          address: RICHEE_CONTRACT_ADDRESS,
          abi: RICHEE_ABI,
          functionName: "encryptedRichest",
        });

        if (encryptedRichest) {
          console.log("Got encryptedRichest from contract:", encryptedRichest);
          const reencryptor = await incoConfig.getReencryptor(walletClient);
          const decryptedRichest = await reencryptor({handle: encryptedRichest});
          console.log("decryptedRichest:", decryptedRichest);
          
          const decryptedNumber = decryptedRichest.value.toString();
          const richest = getAddress('0x' + decryptedNumber.toString(16).padStart(40, '0'));
          console.log("Setting richest address to:", richest);
          
          return richest;
        }
      } catch (error) {
        console.log(`Attempt ${attempt} failed to get result from contract:`, error);
      }

      // If contract state failed, try recent blocks
      try {
        const currentBlock = await publicClient.getBlockNumber();
        const fromBlock = currentBlock - 50n;
        
        const logs = await publicClient.getLogs({
          address: RICHEE_CONTRACT_ADDRESS,
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
          fromBlock,
          toBlock: currentBlock
        });

        if (logs.length > 0) {
          const encryptedRichest = logs[logs.length - 1].args?.encryptedAddress;
          console.log("Got encryptedRichest from logs:", encryptedRichest);
          const reencryptor = await incoConfig.getReencryptor(walletClient);
          const decryptedRichest = await reencryptor({handle: encryptedRichest});
          console.log("decryptedRichest:", decryptedRichest);
          
          const decryptedNumber = decryptedRichest.value.toString();
          const richest = getAddress('0x' + decryptedNumber.toString(16).padStart(40, '0'));
          console.log("Setting richest address to:", richest);
          
          return richest;
        }
      } catch (error) {
        console.log(`Attempt ${attempt} failed to get result from logs:`, error);
      }

      // If this wasn't the last attempt, wait before trying again
      if (attempt < maxAttempts) {
        console.log(`Waiting ${interval}ms before next attempt...`);
        await sleep(interval);
      }
    }
    
    throw new Error("Failed to get result after maximum attempts");
  };

  const fetchEventLogs = async (fromBlock, toBlock, retries = 8, initialDelay = 3000) => {
    for (let i = 0; i < retries; i++) {
      try {
        console.log(`Attempt ${i + 1} to fetch logs from block ${fromBlock} to ${toBlock}`);
        const logs = await publicClient.getLogs({
          address: RICHEE_CONTRACT_ADDRESS,
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
          fromBlock,
          toBlock
        });

        if (logs.length > 0) {
          console.log(`Found ${logs.length} logs on attempt ${i + 1}`);
          return logs;
        }

        // If no logs found and we have retries left, wait and try again
        if (i < retries - 1) {
          const delay = initialDelay * Math.pow(1.5, i); // Less aggressive exponential backoff
          console.log(`No logs found, waiting ${delay}ms before retry...`);
          await sleep(delay);
          continue;
        }
      } catch (error) {
        console.error(`Attempt ${i + 1} failed:`, error);
        if (i < retries - 1) {
          const delay = initialDelay * Math.pow(1.5, i);
          console.log(`Error occurred, waiting ${delay}ms before retry...`);
          await sleep(delay);
          continue;
        }
        throw error;
      }
    }
    return [];
  };

  // Fetch participant addresses
  const fetchParticipants = async () => {
    try {
      const [alice, bob, eve] = await Promise.all([
        publicClient.readContract({
          address: RICHEE_CONTRACT_ADDRESS,
          abi: RICHEE_ABI,
          functionName: "alice",
        }),
        publicClient.readContract({
          address: RICHEE_CONTRACT_ADDRESS,
          abi: RICHEE_ABI,
          functionName: "bob",
        }),
        publicClient.readContract({
          address: RICHEE_CONTRACT_ADDRESS,
          abi: RICHEE_ABI,
          functionName: "eve",
        })
      ]);

      setParticipants({ alice, bob, eve });
    } catch (error) {
      console.error("Error fetching participants:", error);
    }
  };

  // Get participant name from address
  const getParticipantName = (address) => {
    if (!address) return "Unknown";
    if (address.toLowerCase() === participants.alice?.toLowerCase()) return "Alice";
    if (address.toLowerCase() === participants.bob?.toLowerCase()) return "Bob";
    if (address.toLowerCase() === participants.eve?.toLowerCase()) return "Eve";
    return "Unknown";
  };

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

  // Add this helper function for fetching events with retries
  const fetchEventWithRetry = async (fromBlock, toBlock, maxRetries = 3) => {
    for (let i = 0; i < maxRetries; i++) {
      try {
        console.log(`Attempt ${i + 1} to fetch event logs`);
        const logs = await publicClient.getLogs({
          address: RICHEE_CONTRACT_ADDRESS,
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
          fromBlock,
          toBlock
        });

        if (logs.length > 0) {
          console.log(`Found ${logs.length} logs on attempt ${i + 1}`);
          return logs;
        }

        // If no logs found and we have retries left, wait and try again
        if (i < maxRetries - 1) {
          const delay = 2000 * (i + 1); // 2s, 4s, 6s
          console.log(`No logs found, waiting ${delay}ms before retry...`);
          await sleep(delay);
        }
      } catch (error) {
        console.error(`Attempt ${i + 1} failed:`, error);
        if (i < maxRetries - 1) {
          const delay = 2000 * (i + 1);
          console.log(`Error occurred, waiting ${delay}ms before retry...`);
          await sleep(delay);
        }
      }
    }
    return [];
  };

  // Function to start the comparison
  const startComparison = async () => {
    setError("");
    setIsLoading(true);
    setIsRevealing(true);

    try {
      // Check if already finalized
      const isFinalized = await publicClient.readContract({
        address: RICHEE_CONTRACT_ADDRESS,
        abi: RICHEE_ABI,
        functionName: "isFinalized",
      });

      if (isFinalized) {
        try {
          // Get current block number
          const currentBlock = await publicClient.getBlockNumber();
          // Look back 3000 blocks for the event
          const fromBlock = currentBlock - 3000n;
          
          const logs = await fetchEventWithRetry(fromBlock, currentBlock);

          if (logs.length > 0) {
            const encryptedRichest = logs[logs.length - 1].args?.encryptedAddress;
            console.log("encryptedRichest:", encryptedRichest);
            const reencryptor = await incoConfig.getReencryptor(walletClient);
            const decryptedRichest = await reencryptor({handle: encryptedRichest});
            console.log("decryptedRichest:", decryptedRichest);
            
            // Convert the decrypted number to an Ethereum address
            const decryptedNumber = decryptedRichest.value.toString();
            console.log("decryptedNumber:", decryptedNumber);
            
            // Convert to hex and ensure it's 40 characters (20 bytes)
            const hexAddress = BigInt(decryptedNumber).toString(16).padStart(40, '0');
            const richest = getAddress('0x' + hexAddress);
            console.log("richest address:", richest);
            
            setRichestAddress(richest);
            setIsFinalized(true);
            setShowScramble(true);
            setShouldShowModal(true);
          } else {
            setError("No event logs found. Please try again.");
          }
        } catch (error) {
          console.error("Error fetching logs:", error);
          setError("Failed to decrypt the richest address. Please try again.");
        }
      } else {
        // Start comparison
        const hash = await writeContractAsync({
          address: RICHEE_CONTRACT_ADDRESS,
          abi: RICHEE_ABI,
          functionName: "startComparison",
        });

        // Wait for transaction receipt
        const receipt = await publicClient.waitForTransactionReceipt({
          hash: hash,
        });

        if (receipt.status === "success") {
          // Wait for the event to be indexed
          await sleep(5000);

          // Get the event from transaction logs
          const parsedLogs = parseEventLogs({
            abi: RICHEE_ABI,
            logs: receipt.logs,
          });

          const richestEvent = parsedLogs.find(
            (log) => log.eventName === "EncryptedRichestAddress"
          );

          if (richestEvent && richestEvent.args) {
            const encryptedRichest = richestEvent.args.encryptedAddress;
            const reencryptor = await incoConfig.getReencryptor(walletClient);
            const decryptedRichest = await reencryptor({handle: encryptedRichest});
            const decryptedNumber = decryptedRichest.value.toString();
            const richest = getAddress('0x' + decryptedNumber.toString(16).padStart(40, '0'));
            console.log("Setting richest address to:", richest);
            
            setRichestAddress(richest);
            setIsFinalized(true);
            setShowScramble(true);
            setShouldShowModal(true);
          } else {
            // If no event in receipt logs, try fetching from recent blocks with retries
            const currentBlock = await publicClient.getBlockNumber();
            const fromBlock = currentBlock - 10n; // Look back 10 blocks
            
            const logs = await fetchEventWithRetry(fromBlock, currentBlock);

            if (logs.length > 0) {
              const encryptedRichest = logs[logs.length - 1].args?.encryptedAddress;
              const reencryptor = await incoConfig.getReencryptor(walletClient);
              const decryptedRichest = await reencryptor({handle: encryptedRichest});
              const decryptedNumber = decryptedRichest.value.toString();
              const richest = getAddress('0x' + decryptedNumber.toString(16).padStart(40, '0'));
              
              setRichestAddress(richest);
              setIsFinalized(true);
              setShowScramble(true);
              setShouldShowModal(true);
            } else {
              setError("No event found in transaction logs. Please try again.");
            }
          }
        } else {
          setError("Transaction failed. Please try again.");
        }
      }
    } catch (error) {
      console.error("Transaction failed:", error);
      setError(error.message || "Transaction failed. Please try again.");
    } finally {
      setIsLoading(false);
      setIsRevealing(false);
    }
  };

  // Effect to handle modal and message when richestAddress changes
  useEffect(() => {
    if (richestAddress && shouldShowModal) {
      console.log("Effect triggered - Richest address:", richestAddress);
      console.log("User address:", address);
      setShowModal(true);
      typeResultMessage();
      setShouldShowModal(false);
    }
  }, [richestAddress, shouldShowModal, address]);

  // Function to type out the result message
  const typeResultMessage = useCallback(() => {
    console.log("typeResultMessage called");
    console.log("richestAddress in typeResultMessage:", richestAddress);
    console.log("address in typeResultMessage:", address);
    
    const isRichest = richestAddress?.toLowerCase() === address?.toLowerCase();
    console.log("Is richest:", isRichest);
    
    const text = isRichest ? "YOU ARE THE RICHEST!🤑" : "YOU'RE BROKE AF!😭";
    let currentIndex = 0;

    const typeInterval = setInterval(() => {
      if (currentIndex <= text.length) {
        setDisplayText(text.slice(0, currentIndex));
        currentIndex++;
      } else {
        clearInterval(typeInterval);
      }
    }, 100);

    return () => clearInterval(typeInterval);
  }, [richestAddress, address]);

  useEffect(() => {
    fetchParticipants();
    checkAllSubmitted();
    const interval = setInterval(checkAllSubmitted, 5000);
    return () => clearInterval(interval);
  }, []);

  const handleClose = useCallback(() => {
    setShowModal(false);
  }, []);

  return (
    <>
      <Card className="bg-gray-800/70 h-fit">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold flex items-center">
            {/* <Trophy className="mr-3 text-yellow-400" /> */}
            💰 Richee Rich 
          </h2>
        </div>

        <div className="space-y-4">
          {error && (
            <div className="bg-red-900/20 border border-red-500 text-red-400 p-3 rounded-none text-center">
              {error}
            </div>
          )}

          {isFinalized && !isRevealing ? (
            <div className="text-center">
              <div className="space-y-2">
                <p className="text-gray-300 mb-2">The richest participant is:</p>
                {showScramble ? (
                  <TextScramble 
                    scrambleOnMount={true}
                    scrambleCount={10}
                    scrambleDelay={100}
                  >
                    <p className="text-xl font-semibold text-green-400">
                      {richestAddress === address ? "You!" : getParticipantName(richestAddress)}
                    </p>
                  </TextScramble>
                ) : (
                  <p className="text-xl font-semibold text-green-400">
                    {richestAddress === address ? "You!" : getParticipantName(richestAddress)}
                  </p>
                )}
                <p className="text-sm text-gray-400">
                  {richestAddress}
                </p>
              </div>
              <button
                onClick={() => setShowModal(true)}
                className="mt-4 w-full py-3 bg-blue-600 text-white rounded-none hover:bg-blue-700 transition-colors"
              >
                {richestAddress === address ? "Feel the richness!" : "Feel the poverty!"}
              </button>
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
                className="w-full py-3 bg-blue-600 text-white rounded-none hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? (
                  <div className="flex items-center justify-center">
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  </div>
                ) : (
                  <TextScramble scrambleOnHover={true} scrambleDelay={100}>
                    Reveal Richest
                  </TextScramble>
                )}
              </button>
            </div>
          )}
        </div>
      </Card>

      <AnimatePresence>
        {showModal && !isRevealing && (
          <div className="fixed inset-0 flex items-center justify-center bg-black/90 z-50 overflow-y-auto">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 pointer-events-none crt"
              style={{
                backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,112,243,0.1) 2px, rgba(0,112,243,0.1) 4px)'
              }}
            />

            <motion.div 
              className="z-10 w-full max-w-5xl py-8 sm:py-12 px-2 sm:px-4 relative"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              transition={{ duration: 0.3 }}
            >
              <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ 
                  opacity: [0, 1, 0.5, 1],
                  textShadow: [
                    "0 0 5px #0f0",
                    "0 0 20px #0f0",
                    "0 0 5px #0f0",
                    "0 0 2px #0f0"
                  ]
                }}
                transition={{ duration: 2.7, repeat: Infinity }}
                className="text-xl sm:text-2xl md:text-3xl font-mono font-bold mb-4 sm:mb-8 text-center text-green-500 min-h-[48px]"
              >
                <TextScramble scrambleOnMount={true} scrambleCount={10} scrambleDelay={100}>
                  {displayText}
                </TextScramble>
              </motion.div>

              <div className="bg-gray-800/70 p-6 rounded-none text-center">
                <p className="text-gray-300 mb-4">The richest participant is:</p>
                <div className="space-y-2">
                  {showScramble ? (
                    <TextScramble 
                      scrambleOnMount={true}
                      scrambleCount={10}
                      scrambleDelay={100}
                    >
                      <p className="text-xl font-semibold text-green-400">
                        {richestAddress === address ? "You!" : getParticipantName(richestAddress)}
                      </p>
                    </TextScramble>
                  ) : (
                    <p className="text-xl font-semibold text-green-400">
                      {richestAddress === address ? "You!" : getParticipantName(richestAddress)}
                    </p>
                  )}
                  <p className="text-sm text-gray-400">
                    {richestAddress}
                  </p>
                </div>
              </div>

              <motion.button
                onClick={handleClose}
                className="mt-4 sm:mt-6 md:mt-8 px-3 sm:px-4 py-2 font-mono text-sm sm:text-base text-green-500 border border-green-500/50 hover:bg-green-500/20 transition-colors mx-auto block rounded-none"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                [CLOSE]
              </motion.button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
};

export default RichestReveal; 