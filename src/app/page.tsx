import { motion } from 'framer-motion';
import Navbar from '~/components/navbar';
import Link from 'next/link';
import Image from 'next/image';
import { Button } from '~/components/ui/button';
import { ShieldCheck, Repeat, Code2, FileOutput } from 'lucide-react';

const Section: React.FC<React.PropsWithChildren<{className?: string}>> = ({ children, className }) => (
  <motion.section
    initial={{ opacity: 0, y: 40 }}
    whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: true }}
    transition={{ duration: 0.6 }}
    className={`py-16 ${className || ''}`}
  >
    {children}
  </motion.section>
);

export default function Home() {
  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white">
      <Navbar />
      <main className="pt-20">
        <Section className="relative flex flex-col items-center justify-center min-h-[80vh] text-center space-y-6 overflow-hidden">
          <div className="absolute inset-0 -z-10">
            <div className="absolute inset-0 bg-gradient-to-b from-[#121212] via-[#0a0a0a] to-black" />
            <div className="absolute -top-40 left-1/2 w-[60rem] h-[60rem] -translate-x-1/2 rounded-full bg-purple-700/40 blur-3xl" />
            <div className="absolute top-1/3 left-1/3 w-96 h-96 bg-pink-500/30 blur-2xl rounded-full" />
          </div>
          <h1 className="text-5xl md:text-7xl font-semibold leading-tight">
            Expose <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 via-pink-400 to-yellow-300">Soroban contracts</span>
            <br /> to AI agents
          </h1>
          <p className="text-lg md:text-xl text-gray-300 max-w-2xl mx-auto">
            A CLI toolkit and signer infrastructure for safely integrating Stellar into AI-native workflows.
          </p>
          <Link href="/docs/get-started">
            <Button className="bg-amber-500 text-gray-900 hover:bg-amber-400">
              Get Started with the CLI
            </Button>
          </Link>
        </Section>

        <Section>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 text-center">
            <div className="p-px rounded-xl bg-gradient-to-br from-purple-700 via-pink-600 to-amber-500">
              <div className="bg-[#080808] rounded-xl p-6 h-full">
              <h3 className="text-lg font-medium mb-2">MCP Server Generator</h3>
              <p className="text-sm text-gray-400">
                Convert Soroban contracts into MCP-compliant servers (TypeScript &amp; Python).
              </p>
              </div>
            </div>
            <div className="p-px rounded-xl bg-gradient-to-br from-purple-700 via-pink-600 to-amber-500">
              <div className="bg-[#080808] rounded-xl p-6 h-full">
              <h3 className="text-lg font-medium mb-2">Policy Signer Generator</h3>
              <p className="text-sm text-gray-400">
                Guide developers to build scoped signer rules for agent-safe execution.
              </p>
              </div>
            </div>
            <div className="p-px rounded-xl bg-gradient-to-br from-purple-700 via-pink-600 to-amber-500">
              <div className="bg-[#080808] rounded-xl p-6 h-full">
              <h3 className="text-lg font-medium mb-2">Policy Sandbox Web App</h3>
              <p className="text-sm text-gray-400">
                Test policy signer logic before giving AI agents wallet access.
              </p>
              </div>
            </div>
            <div className="p-px rounded-xl bg-gradient-to-br from-purple-700 via-pink-600 to-amber-500">
              <div className="bg-[#080808] rounded-xl p-6 h-full">
              <h3 className="text-lg font-medium mb-2">MCP Client SDK</h3>
              <p className="text-sm text-gray-400">
                Build AI-native apps with safe transaction flows using Stellar’s policy model.
              </p>
              </div>
            </div>
          </div>
        </Section>

        <Section>
          <div className="grid md:grid-cols-2 gap-8 items-center">
            <div className="space-y-6">
              <div className="flex items-start space-x-3">
                <ShieldCheck className="w-5 h-5 text-amber-500" />
                <p>Secure delegated signing via Policy Signers</p>
              </div>
              <div className="flex items-start space-x-3">
                <Repeat className="w-5 h-5 text-amber-500" />
                <p>Soroban → MCP automation</p>
              </div>
              <div className="flex items-start space-x-3">
                <Code2 className="w-5 h-5 text-amber-500" />
                <p>TypeScript and Python support</p>
              </div>
              <div className="flex items-start space-x-3">
                <FileOutput className="w-5 h-5 text-amber-500" />
                <p>AssembledTransaction XDR output for AI agents</p>
              </div>
            </div>
            <div className="flex items-center justify-center">
              <div className="w-full h-64 bg-gray-800 rounded-lg flex items-center justify-center">
                <Image src="/placeholder.svg" alt="Execution Flow: Agent → MCP → Policy Signer → Stellar" width={400} height={250} className="object-contain" />
              </div>
            </div>
          </div>
        </Section>

        <Section className="text-center space-y-6 bg-gradient-to-b from-[#111] to-[#0a0a0a]">
          <h2 className="text-3xl font-semibold">Join the community</h2>
          <p className="text-gray-300">Meridian 2025 showcase coming soon</p>
          <div className="flex justify-center space-x-6">
            <a href="https://discord.gg" className="underline text-amber-400 hover:text-amber-300">Discord</a>
            <a href="https://github.com" className="underline text-amber-400 hover:text-amber-300">GitHub</a>
          </div>
        </Section>
      </main>

      <footer className="py-10 text-center text-sm text-gray-400 border-t border-gray-800 mt-16">
        <div className="space-x-4">
          <a href="https://github.com" className="hover:text-gray-200">GitHub Repo</a>
          <a href="/docs" className="hover:text-gray-200">CLI Docs</a>
          <a href="#" className="hover:text-gray-200">Newsletter Signup</a>
        </div>
        <p className="mt-4">© 2024 Stellar AI Agent Kit</p>
      </footer>
    </div>
  );
}
