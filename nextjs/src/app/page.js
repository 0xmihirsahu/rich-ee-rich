"use client";

import { useAccount } from "wagmi";
import { useEffect, useState } from "react";
import { Wallet } from "lucide-react";
import EncryptedTokenInterface from "@/components/encrypted-token-ineterface";
import EncryptedSend from "@/components/encrypted-send";
import CipherBackground from "@/components/cipher-background";
export default function Home() {
  const { isConnected } = useAccount();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted)
    return (
      <div className="bg-gray-900 min-h-screen flex items-center justify-center">
        <div className="text-white animate-pulse">Loading...</div>
      </div>
    );

  return (
    <div className="min-h-screen">
      <CipherBackground />
      <div className="max-w-4xl mx-auto p-6">
        {isConnected ? (
          <div className="grid md:grid-cols-2 place-items-start gap-6 mt-32">
            <EncryptedTokenInterface />
            <EncryptedSend />
          </div>
        ) : (
          <div className="bg-zinc-800/90 border border-gray-700 rounded-none p-10 text-center shadow-2xl">
            <Wallet className="mx-auto mb-4 w-12 h-12 text-blue-600" />
            <p className="text-white text-lg mb-4">
              Connect your wallet to find if you&apos;re the richest
            </p>
            <button
              onClick={() => document.querySelector('button')?.click()}
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2.5 rounded-none transition-colors"
            >
              Connect Wallet
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
