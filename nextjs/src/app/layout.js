import localFont from "next/font/local";
import { Space_Grotesk } from "next/font/google";
import "./globals.css";
import { Web3Provider } from "@/provider/web3-provider";
import { ChainBalanceProvider } from "@/provider/balance-provider";
import Header from "@/components/header";

const fontSpaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-space-grotesk",
  weight: ["300", "400", "500", "600", "700"],
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
        className={`${fontSpaceGrotesk.variable} font-space-grotesk antialiased`}
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
