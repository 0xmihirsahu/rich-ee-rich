import localFont from "next/font/local";
import { DM_Mono, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { Web3Provider } from "@/provider/web3-provider";
import { ChainBalanceProvider } from "@/provider/balance-provider";
import Header from "@/components/header";

const fontJetBrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-jet-brains-mono",
  weight: ["300", "400", "500"],
  display: "swap",
})

export const metadata = {
  title: "Richee",
  description: "Richee",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body
        className={`${fontJetBrainsMono.variable} font-jet-brains-mono antialiased`}
      >
        <Web3Provider>
          <ChainBalanceProvider>
            <Header />
            {children}
          </ChainBalanceProvider>
        </Web3Provider>
      </body>
    </html>
  );
}
