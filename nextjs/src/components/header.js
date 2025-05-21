"use client";

import { useAccount } from "wagmi";
import { useWeb3Modal } from "@web3modal/wagmi/react";
import { useDisconnect } from "wagmi";
import { Wallet, LogOut, User } from "lucide-react";

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
    <header className="bg-blue-600/10 sticky top-0 z-50">
    <div className="flex items-center px-24 justify-between h-16">
      <h1 className="text-3xl text-white flex items-center font-space-grotesk gap-3">
        richee
      </h1>
      <div>
        {isConnected ? (
          <div className="flex items-center gap-4 bg-gray-800 p-2 rounded-none border border-gray-700">
            <div className="flex items-center gap-2">
              <User className="text-blue-400 w-5 h-5" />
              <span className="text-sm text-white truncate max-w-[150px]">
                {address?.substring(0, 6)}...
                {address?.substring(address.length - 4)}
              </span>
            </div>
            <button
              onClick={handleDisconnect}
              className="bg-red-600 hover:bg-red-700 text-white px-3 py-1.5 rounded-none transition-colors flex items-center gap-2"
            >
              <LogOut className="w-4 h-4" />
              Logout
            </button>
          </div>
        ) : (
          <button
            onClick={handleConnect}
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2.5 rounded-none transition-colors flex items-center gap-2"
          >
            <Wallet className="w-5 h-5" />
            Connect Wallet
          </button>
        )}
      </div>
    </div>
    </header>
  );
}
