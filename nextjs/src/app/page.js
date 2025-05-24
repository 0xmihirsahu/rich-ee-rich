"use client";

import { useAccount } from "wagmi";
import { useEffect, useState } from "react";
import { Wallet, Shield, Lock, Cpu } from "lucide-react";
import EncryptedSubmission from "@/components/encrypted-submission";
import RichestReveal from "@/components/richest-reveal";
import CipherBackground from "@/components/cipher-background";
import { motion } from "framer-motion";

export default function Home() {
  const { isConnected } = useAccount();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  return (
    <div className="min-h-screen bg-gray-900/0 text-white">
      <CipherBackground hover={true} />
      <div className="max-w-6xl mx-auto p-6">
        {isConnected ? (
          <motion.div 
            className="space-y-8"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <div className="text-center space-y-4">
              <motion.h1 
                className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-blue-400 via-blue-500 to-blue-600 bg-clip-text text-transparent"
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.2 }}
              >
                richee
              </motion.h1>
              <motion.p 
                className="text-gray-400 max-w-2xl mx-auto text-lg"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.5, delay: 0.4 }}
              >
                Solving the Millionaire&apos;s Dilemma using Inco&apos;s Trusted Execution Environment
              </motion.p>
            </div>

            <div className="grid md:grid-cols-2 gap-8">
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5, delay: 0.6 }}
              >
                <EncryptedSubmission />
              </motion.div>
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5, delay: 0.8 }}
              >
                <RichestReveal />
              </motion.div>
            </div>
          </motion.div>
        ) : (
          <motion.div 
            className="flex flex-col items-center justify-center min-h-[80vh] space-y-8"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5 }}
          >
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="relative"
            >
              <div className="absolute inset-0 bg-blue-500/20 blur-3xl rounded-full" />
            </motion.div>

            <motion.div 
              className="text-center space-y-4"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.4 }}
            >
              <h2 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-blue-400 via-blue-500 to-blue-600 bg-clip-text text-transparent">
                Richee: The Millionaire&apos;s Dilemma
              </h2>
              <p className="text-gray-400 text-lg max-w-xl mx-auto">
                A Rich Execution Environment to solve the classic Millionaire&apos;s Dilemma using Inco&apos;s TEE technology.
                Compare wealth privately and securely without revealing individual values.
              </p>
            </motion.div>

            <motion.div
              className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-3xl w-full"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.6 }}
            >
              <div className="bg-gray-800/50 p-6 rounded-none border border-gray-700/50">
                <Lock className="w-8 h-8 text-blue-400 mb-4" />
                <h3 className="text-lg font-semibold mb-2">Private Submissions</h3>
                <p className="text-gray-400 text-sm">Submit your wealth amount encrypted, ensuring complete privacy</p>
              </div>
              <div className="bg-gray-800/50 p-6 rounded-none border border-gray-700/50">
                <Cpu className="w-8 h-8 text-blue-400 mb-4" />
                <h3 className="text-lg font-semibold mb-2">TEE Computation</h3>
                <p className="text-gray-400 text-sm">Secure comparison using Inco&apos;s Trusted Execution Environment</p>
              </div>
              <div className="bg-gray-800/50 p-6 rounded-none border border-gray-700/50">
                <Shield className="w-8 h-8 text-blue-400 mb-4" />
                <h3 className="text-lg font-semibold mb-2">Secure Results</h3>
                <p className="text-gray-400 text-sm">Only the richest participant is revealed, keeping all other values private</p>
              </div>
            </motion.div>

            <motion.div className="text-center max-w-2xl mx-auto">
              <p className="text-gray-400 text-sm mb-6">
                Powered by Inco&apos;s confidential computing technology, Richee enables secure wealth comparison
                while maintaining complete privacy of individual values.
              </p>
            </motion.div>

            <motion.button
              onClick={() => document.querySelector('button')?.click()}
              className="bg-gradient-to-r from-blue-500 to-blue-600 text-white px-8 py-4 rounded-none text-lg font-semibold hover:from-blue-600 hover:to-blue-700 transition-all duration-300 transform hover:scale-105"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.8 }}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              Connect Wallet to Play
            </motion.button>
          </motion.div>
        )}
      </div>
    </div>
  );
}
