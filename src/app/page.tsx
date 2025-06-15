import { motion } from 'framer-motion';
import Navbar from '~/components/navbar';
import Link from 'next/link';
import { Button } from '~/components/ui/button';

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
    <div className="min-h-screen bg-gray-950 text-gray-50">
      <Navbar />
      <main className="pt-24 px-6 md:px-10">
        <Section className="text-center space-y-6">
          <h1 className="text-4xl md:text-6xl font-semibold">
            Expose Soroban contracts to AI agents
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
            <div className="bg-gray-900 rounded-xl p-6 border border-gray-800">
              <h3 className="text-lg font-medium mb-2">MCP Server Generator</h3>
              <p className="text-sm text-gray-400">
                Convert Soroban contracts into MCP-compliant servers (TypeScript &amp; Python).
              </p>
            </div>
            <div className="bg-gray-900 rounded-xl p-6 border border-gray-800">
              <h3 className="text-lg font-medium mb-2">Policy Signer Generator</h3>
              <p className="text-sm text-gray-400">
                Guide developers to build scoped signer rules for agent-safe execution.
              </p>
            </div>
            <div className="bg-gray-900 rounded-xl p-6 border border-gray-800">
              <h3 className="text-lg font-medium mb-2">Policy Sandbox Web App</h3>
              <p className="text-sm text-gray-400">
                Test policy signer logic before giving AI agents wallet access.
              </p>
            </div>
            <div className="bg-gray-900 rounded-xl p-6 border border-gray-800">
              <h3 className="text-lg font-medium mb-2">MCP Client SDK</h3>
              <p className="text-sm text-gray-400">
                Build AI-native apps with safe transaction flows using Stellar’s policy model.
              </p>
            </div>
          </div>
        </Section>

        <Section>
          <div className="grid md:grid-cols-2 gap-8">
            <div className="space-y-4">
              <div className="flex items-start space-x-3">
                <span className="w-4 h-4 mt-1 bg-amber-500 rounded-full" />
                <p>Secure delegated signing via Policy Signers</p>
              </div>
              <div className="flex items-start space-x-3">
                <span className="w-4 h-4 mt-1 bg-amber-500 rounded-full" />
                <p>Soroban → MCP automation</p>
              </div>
              <div className="flex items-start space-x-3">
                <span className="w-4 h-4 mt-1 bg-amber-500 rounded-full" />
                <p>TypeScript and Python support</p>
              </div>
              <div className="flex items-start space-x-3">
                <span className="w-4 h-4 mt-1 bg-amber-500 rounded-full" />
                <p>AssembledTransaction XDR output for AI agents</p>
              </div>
            </div>
            <div className="flex items-center justify-center">
              <div className="w-full h-64 bg-gray-800 rounded-lg flex items-center justify-center text-sm text-gray-400">
                Execution Flow: Agent → MCP → Policy Signer → Stellar
              </div>
            </div>
          </div>
        </Section>

        <Section className="text-center space-y-6">
          <h2 className="text-3xl font-semibold">Join the community</h2>
          <p className="text-gray-300">Meridian 2025 showcase coming soon</p>
          <div className="flex justify-center space-x-6">
            <a href="https://discord.gg" className="underline text-amber-400">Discord</a>
            <a href="https://github.com" className="underline text-amber-400">GitHub</a>
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
