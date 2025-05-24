"use client";

import { useAccount } from "wagmi";
import { useWeb3Modal } from "@web3modal/wagmi/react";
import { useDisconnect } from "wagmi";
import { Wallet, LogOut, User, Shield, Cpu } from "lucide-react";
import { motion } from "framer-motion";
import { Icon } from "@/components/ui/Icon";

export default function Header() {
  const { isConnected, address } = useAccount();
  const { open } = useWeb3Modal();
  const { disconnect } = useDisconnect();

  // Handle the disconnect action
  const handleDisconnect = () => {
    try {
      disconnect();
      setTimeout(() => {
        window.location.reload();
      }, 100);
    } catch (error) {
      console.error("Disconnect error:", error);
    }
  };

  // Handler for the connect button
  const handleConnect = () => {
    try {
      console.log("Connecting wallet...");
      open();
    } catch (error) {
      console.error("Connect error:", error);
    }
  };

  return (
    <motion.header 
      className="fixed top-0 left-0 right-0 bg-gray-900/50 backdrop-blur-md z-50 border-b border-gray-800/50"
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <motion.div 
            className="flex items-center gap-4"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-400 via-blue-500 to-blue-600 bg-clip-text text-transparent">
              richee
            </h1>
            <div className="hidden md:flex items-center gap-2 text-sm text-gray-400">
              <Cpu className="w-4 h-4 text-blue-400" />
              <span>Powered by Inco Lightning</span>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.4 }}
          >
            {isConnected ? (
              <div className="flex items-center gap-4">
                <motion.div 
                  className="flex items-center gap-2 bg-gray-800/50 p-2 rounded-none border border-gray-700/50"
                  whileHover={{ scale: 1.02 }}
                  transition={{ duration: 0.2 }}
                >
                  <div className="flex items-center gap-2">
                    <div className="relative">
                      <div className="absolute inset-0 bg-blue-500/20 blur-md rounded-full" />
                      <User className="text-blue-400 w-5 h-5 relative z-10" />
                    </div>
                    <span className="text-sm text-gray-300 font-mono">
                      {address?.substring(0, 6)}...
                      {address?.substring(address.length - 4)}
                    </span>
                  </div>
                </motion.div>
                <motion.button
                  onClick={handleDisconnect}
                  className="bg-red-500/10 hover:bg-red-500/20 text-red-400 px-4 py-2 rounded-none border border-red-500/20 transition-all duration-300 flex items-center gap-2"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <LogOut className="w-4 h-4" />
                  <span className="hidden sm:inline">Disconnect</span>
                </motion.button>
              </div>
            ) : (
              <motion.button
                onClick={handleConnect}
                className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white px-6 py-2.5 rounded-none transition-all duration-300 flex items-center gap-2"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <div className="relative">
                  <div className="absolute inset-0 bg-white/20 blur-md rounded-full" />
                  <Wallet className="w-5 h-5 relative z-10" />
                </div>
                <span>Connect Wallet</span>
              </motion.button>
            )}
          </motion.div>
        </div>
      </div>
    </motion.header>
  );
}
