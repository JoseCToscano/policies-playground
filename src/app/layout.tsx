import "~/styles/globals.css";

import { GeistSans } from "geist/font/sans";
import { type Metadata } from "next";

import { TRPCReactProvider } from "~/trpc/react";
import ToasterProvider from "~/providers/toaster-provider";
import { StellarProvider } from "~/contexts/stellar-context";

export const metadata: Metadata = {
  title: "Passkey Wallet Sandbox",
  description: "Passkey Wallet Sandbox",
  icons: [{ rel: "icon", url: "/favicon.ico" }],
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${GeistSans.variable}`}>
      <body className="min-h-screen flex flex-col">
        <StellarProvider defaultNetwork="testnet">
          <TRPCReactProvider>
            <main className="flex-1">
              <ToasterProvider />
              {children}
            </main>
          </TRPCReactProvider>
        </StellarProvider>
      </body>
    </html>
  );
}
