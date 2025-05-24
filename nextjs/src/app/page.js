"use client";

import { useAccount } from "wagmi";
import { useEffect, useState } from "react";
import { Wallet } from "lucide-react";
import EncryptedSubmission from "@/components/encrypted-submission";
import RichestReveal from "@/components/richest-reveal";
import CipherBackground from "@/components/cipher-background";
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
      <div className="max-w-4xl mx-auto p-6">
        {isConnected ? (
          <div className="space-y-8">
            <h1 className="text-4xl font-bold text-center mb-8">
              Millionaire&apos;s Dilemma
            </h1>
            <div className="grid md:grid-cols-2 gap-8">
              <EncryptedSubmission />
              <RichestReveal />
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center min-h-[60vh]">
            <Wallet className="w-16 h-16 text-blue-500 mb-4" />
            <h2 className="text-2xl font-semibold mb-4">
              Connect your wallet to play
            </h2>
            <p className="text-gray-400 text-center mb-8">
              Join the encrypted wealth comparison game where you can submit your wealth
              privately and discover who is the richest without revealing individual values.
            </p>
            <button
              onClick={() => document.querySelector('button')?.click()}
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg transition-colors"
            >
              Connect Wallet
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
