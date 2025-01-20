import "~/styles/globals.css";

import { GeistSans } from "geist/font/sans";
import { type Metadata } from "next";

import { TRPCReactProvider } from "~/trpc/react";
import ToasterProvider from "~/providers/toaster-provider";

export const metadata: Metadata = {
  title: "Freelii Business",
  description: "Digital banking for businesses",
  icons: [{ rel: "icon", url: "/favicon.ico" }],
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${GeistSans.variable}`}>
      <body className="min-h-screen flex flex-col">
        <TRPCReactProvider>
          <main className="flex-1">
            <ToasterProvider />
            {children}
          </main>
          <footer className="text-sm text-muted-foreground flex items-center justify-center py-4">
            <p>© 2025 Freelii</p>
          </footer>
        </TRPCReactProvider>
      </body>
    </html>
  );
}
