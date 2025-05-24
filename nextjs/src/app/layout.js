
import { Urbanist } from "next/font/google";
import "./globals.css";
import { Web3Provider } from "@/provider/web3-provider";
import { ChainBalanceProvider } from "@/provider/balance-provider";
import Header from "@/components/header";

const fontUrbanist = Urbanist({
  subsets: ["latin"],
  variable: "--font-urbanist",
  weight: ["300", "400", "500"],
  display: "swap",
})

export const metadata = {
  title: "Richee",
  description: "Richee - The Millionaire's Dilemma",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body
        className={`${fontUrbanist.variable} font-urbanist antialiased`}
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
