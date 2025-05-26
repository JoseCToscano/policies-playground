import React from 'react';

export default function Home() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="flex justify-between items-center px-8 py-6">
        <div className="flex items-center space-x-2">

          <span className="text-xl font-bold text-gray-900">Stellar AI Playground</span>
        </div>
        <div className="flex items-center space-x-6">
          <a href="#" className="text-gray-600 hover:text-gray-900">Documentation</a>
          <button className="bg-black text-white px-6 py-2 rounded-lg hover:bg-gray-800 transition duration-300">
            Get Started
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="px-8 py-16">
        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            {/* Left Column */}
            <div>
              <h1 className="text-6xl font-bold text-gray-900 leading-tight mb-6">
                Every Stellar Contract{' '}
                <span className="text-orange-500">AI-Accessible</span>
              </h1>
              <p className="text-xl text-gray-600 mb-8 leading-relaxed">
                Transform any Soroban Smart Contract into an AI-ready interface with a single command.
                Let users interact with blockchain through natural language: "Send 10 XLM to my mom"
                or "Move 5% of my balance to the best yield instrument."
              </p>
              <div className="flex flex-col sm:flex-row gap-4">

                <a
                  href="https://github.com/JoseCToscano/stellar-cli"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center space-x-2 text-gray-900 border border-gray-300 px-6 py-3 rounded-lg font-medium hover:bg-gray-50 transition duration-300">
                  <span>View on GitHub</span>
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
                  </svg>
                </a>
              </div>
            </div>

            {/* Right Column - Terminal */}
            <div className="bg-gray-900 rounded-xl p-8 font-mono text-sm shadow-2xl">
              <div className="flex space-x-3 mb-6">
                <div className="w-4 h-4 bg-red-500 rounded-full"></div>
                <div className="w-4 h-4 bg-yellow-500 rounded-full"></div>
                <div className="w-4 h-4 bg-green-500 rounded-full"></div>
              </div>
              <div className="text-green-400 space-y-2 text-sm leading-relaxed">
                <div>$ stellar contract bindings mcp-server --contract-id CDOCQ4YNWDPWB3HHGQQCVCX5PWJYHWYKYAC2PCE237WWZFQNW2GYXSDA --output-dir contacts-mcp --network testnet --overwrite --name contacts-mcp</div>
                <div className="text-blue-400">ℹ️  Network: Test SDF Network ; September 2015</div>
                <div className="text-yellow-400">🌎 Downloading contract spec: CDOCQ4YNWDPWB3HHGQQCVCX5PWJYHWYKYAC2PCE237WWZFQNW2GYXSDA</div>
                <div className="text-orange-400">⚠️  A new release of stellar-cli is available: 22.6.0 -&gt; 22.8.1</div>
                <div className="text-white mt-3"></div>
                <div className="text-green-400">✨ Generated MCP server in contacts-mcp</div>
                <div className="text-white mt-3"></div>
                <div className="text-cyan-400">📝 Next steps:</div>
                <div className="text-gray-300">1. Install dependencies and build the project:</div>
                <div className="text-gray-400 ml-4">cd contacts-mcp</div>
                <div className="text-gray-400 ml-4">npm install</div>
                <div className="text-gray-400 ml-4">npm run build</div>
                <div className="text-white mt-2"></div>
                <div className="text-gray-300">2. Set up your environment variables:</div>
                <div className="text-white mt-2"></div>
                <div className="text-gray-300">3. Add the following configuration to your MCP config file:</div>
                <div className="text-gray-400 ml-4">{`"contacts-mcp": {`}</div>
                <div className="text-gray-400 ml-6">{`"command": "node",`}</div>
                <div className="text-gray-400 ml-6">{`"args": ["contacts-mcp/build/index.js"],`}</div>
                <div className="text-gray-400 ml-6">{`"env": { "NETWORK": "testnet", ... }`}</div>
                <div className="text-gray-400 ml-4">{`}`}</div>
                <div className="text-white mt-3"></div>
                <div className="text-cyan-400">📚 For more information, check the README.md file in the generated project.</div>
              </div>
            </div>
          </div>

          {/* YouTube Video Section */}
          <div className="mt-24 text-center">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">See AI-Powered Smart Contracts In Action</h2>
            <p className="text-xl text-gray-600 mb-12">Watch how natural language transforms blockchain interaction</p>
            <div className="max-w-4xl mx-auto">
              <div className="relative w-full h-0 pb-[56.25%] overflow-hidden rounded-lg shadow-2xl">
                <iframe
                  src="https://www.youtube.com/embed/caj7q1o8N70"
                  title="YouTube video player"
                  frameBorder="0"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                  className="absolute top-0 left-0 w-full h-full"
                ></iframe>
              </div>
            </div>
          </div>

          {/* What We Built Section */}
          <div className="mt-32">
            <div className="text-center mb-16">
              <h2 className="text-5xl font-bold text-gray-900 mb-6">What We Built</h2>
              <p className="text-xl text-gray-600 max-w-3xl mx-auto">
                A complete toolkit that bridges AI and Web3, making Stellar smart contracts accessible through natural language.
              </p>
            </div>

            <div className="grid md:grid-cols-2 gap-12">
              {/* MCP Server Generator */}
              <div className="bg-white rounded-2xl shadow-xl p-8 border border-gray-100">
                <div className="flex items-center mb-6">
                  <div className="w-12 h-12 bg-gradient-to-r from-orange-500 to-red-500 rounded-lg flex items-center justify-center mr-4">
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 9l3 3-3 3m5 0h3M5 20h14a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v14a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <h3 className="text-2xl font-bold text-gray-900">MCP Server Generator</h3>
                </div>

                <p className="text-gray-600 mb-6">
                  A CLI tool that reads Soroban contract specifications and outputs a complete MCP server.
                  Supports both Stellar Asset Contracts (SAC) and custom WASM contracts.
                </p>

                <div className="space-y-4 mb-6">
                  <div className="flex items-center space-x-3">
                    <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                    <span className="text-gray-700">Maps contract functions to MCP tools</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                    <span className="text-gray-700">Handles parameter validation with Zod</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                    <span className="text-gray-700">Returns AssembledTransaction XDRs ready for signing</span>
                  </div>
                </div>

                <div className="bg-gray-50 rounded-lg p-4">
                  <code className="text-sm text-gray-800">npx stellar-mcp-cli generate</code>
                </div>
              </div>

              {/* Stellar MCP Server */}
              <div className="bg-white rounded-2xl shadow-xl p-8 border border-gray-100">
                <div className="flex items-center mb-6">
                  <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-500 rounded-lg flex items-center justify-center mr-4">
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                    </svg>
                  </div>
                  <h3 className="text-2xl font-bold text-gray-900">Stellar MCP Server</h3>
                </div>

                <p className="text-gray-600 mb-6">
                  A secure MCP server that handles account operations, XDR signing, and integrates
                  with Stellar's passkey-based policy signers for delegated authorization.
                </p>

                <div className="space-y-4 mb-6">
                  <div className="flex items-center space-x-3">
                    <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                    <span className="text-gray-700">Creates and funds accounts securely</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                    <span className="text-gray-700">Signs and submits XDRs safely</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                    <span className="text-gray-700">Integrates with Policy Signers</span>
                  </div>
                </div>

                <div className="bg-gray-50 rounded-lg p-4">
                  <code className="text-sm text-gray-800">npx stellar-mcp-server start</code>
                </div>
              </div>
            </div>
          </div>

          {/* Security & Policy Signers Section */}
          <div className="mt-32">
            <div className="text-center mb-16">
              <h2 className="text-5xl font-bold text-gray-900 mb-6">
                Security First:{' '}
                <span className="text-orange-500">Policy Signers</span>
              </h2>
              <p className="text-xl text-gray-600 max-w-4xl mx-auto">
                AI agents should never have full control over user accounts. Our policy signers provide
                secure, granular authorization that lets agents perform only explicitly authorized actions.
              </p>
            </div>

            <div className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-2xl p-12 text-white">
              <div className="grid lg:grid-cols-2 gap-12 items-center">
                <div>
                  <h3 className="text-3xl font-bold mb-6">Policies Playground</h3>
                  <p className="text-gray-300 mb-8 text-lg">
                    An interactive CLI tool and web interface where developers can create smart wallets,
                    manage multiple signers, and define granular policies for secure AI agent interactions.
                  </p>

                  <div className="space-y-4 mb-8">
                    <div className="flex items-center space-x-3">
                      <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
                        <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                      </div>
                      <span>Create passkey-powered smart wallets</span>
                    </div>
                    <div className="flex items-center space-x-3">
                      <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
                        <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                      </div>
                      <span>Add and manage multiple signers</span>
                    </div>
                    <div className="flex items-center space-x-3">
                      <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
                        <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                      </div>
                      <span>Define granular policies for AI agents</span>
                    </div>
                    <div className="flex items-center space-x-3">
                      <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
                        <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                      </div>
                      <span>Test transactions against policy rules</span>
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row gap-4">
                    <a href="/home" className="bg-orange-500 text-white px-6 py-3 rounded-lg font-medium hover:bg-orange-600 transition duration-300 text-center">
                      Try Policies Playground
                    </a>
                    <button className="border border-gray-400 text-gray-300 px-6 py-3 rounded-lg font-medium hover:bg-gray-700 transition duration-300">
                      View CLI Tool
                    </button>
                  </div>
                </div>

                <div className="bg-gray-800 rounded-lg p-6 font-mono text-sm">
                  <div className="text-green-400 space-y-2">
                    <div>$ npx stellar-policy-cli policy create</div>
                    <div className="text-gray-400"># Creating smart wallet...</div>
                    <div>$ policy add-signer --type ai-agent</div>
                    <div>$ policy set-rule "max_amount: 100 XLM"</div>
                    <div>$ policy set-rule "allowed_contracts: [DEFI_POOL]"</div>
                    <div className="text-blue-400">✅ Policy signer configured!</div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Use Cases Section */}
          <div className="mt-32">
            <div className="text-center mb-20">
              <h2 className="text-5xl font-bold text-gray-900 mb-6">Real-World Use Cases</h2>
              <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
                See how natural language transforms complex blockchain interactions into simple conversations.
              </p>
            </div>

            <div className="grid lg:grid-cols-3 gap-8">
              {/* Use Case 1 */}
              <div className="group bg-white rounded-2xl shadow-sm border border-gray-100 p-8 hover:shadow-xl hover:border-gray-200 transition-all duration-300">
                <div className="flex items-center justify-between mb-6">
                  <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center shadow-lg">
                    <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                    </svg>
                  </div>
                  <div className="w-8 h-8 bg-blue-50 rounded-full flex items-center justify-center group-hover:bg-blue-100 transition-colors duration-300">
                    <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                </div>

                <h3 className="text-2xl font-bold text-gray-900 mb-4">Simple Payments</h3>

                <div className="bg-gradient-to-r from-gray-50 to-gray-100 rounded-xl p-5 mb-6 border-l-4 border-blue-500">
                  <div className="flex items-center space-x-2 mb-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                    <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">User Input</span>
                  </div>
                  <p className="text-gray-800 font-medium italic">"Send 10 XLM to my mom"</p>
                </div>

                <div className="space-y-3 mb-6">
                  <div className="flex items-center space-x-3">
                    <div className="w-1.5 h-1.5 bg-blue-500 rounded-full"></div>
                    <span className="text-sm text-gray-600">Calls list_contacts</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <div className="w-1.5 h-1.5 bg-blue-500 rounded-full"></div>
                    <span className="text-sm text-gray-600">Resolves "mom" contact</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <div className="w-1.5 h-1.5 bg-blue-500 rounded-full"></div>
                    <span className="text-sm text-gray-600">Executes transfer_to_contact</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <div className="w-1.5 h-1.5 bg-green-500 rounded-full"></div>
                    <span className="text-sm text-gray-600 font-medium">Returns XDR for secure signing</span>
                  </div>
                </div>

                <div className="pt-4 border-t border-gray-100">
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-blue-50 text-blue-700">
                    Instant & Secure
                  </span>
                </div>
              </div>

              {/* Use Case 2 */}
              <div className="group bg-white rounded-2xl shadow-sm border border-gray-100 p-8 hover:shadow-xl hover:border-gray-200 transition-all duration-300">
                <div className="flex items-center justify-between mb-6">
                  <div className="w-14 h-14 bg-gradient-to-br from-green-500 to-green-600 rounded-xl flex items-center justify-center shadow-lg">
                    <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                    </svg>
                  </div>
                  <div className="w-8 h-8 bg-green-50 rounded-full flex items-center justify-center group-hover:bg-green-100 transition-colors duration-300">
                    <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                </div>

                <h3 className="text-2xl font-bold text-gray-900 mb-4">DeFi Automation</h3>

                <div className="bg-gradient-to-r from-gray-50 to-gray-100 rounded-xl p-5 mb-6 border-l-4 border-green-500">
                  <div className="flex items-center space-x-2 mb-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                    <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">User Input</span>
                  </div>
                  <p className="text-gray-800 font-medium italic">"Move 5% of my balance to the best yield instrument"</p>
                </div>

                <div className="space-y-3 mb-6">
                  <div className="flex items-center space-x-3">
                    <div className="w-1.5 h-1.5 bg-green-500 rounded-full"></div>
                    <span className="text-sm text-gray-600">Calls get_balance</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <div className="w-1.5 h-1.5 bg-green-500 rounded-full"></div>
                    <span className="text-sm text-gray-600">Computes 5% allocation</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <div className="w-1.5 h-1.5 bg-green-500 rounded-full"></div>
                    <span className="text-sm text-gray-600">Compares yield protocols</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <div className="w-1.5 h-1.5 bg-green-500 rounded-full"></div>
                    <span className="text-sm text-gray-600 font-medium">Executes with policy controls</span>
                  </div>
                </div>

                <div className="pt-4 border-t border-gray-100">
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-green-50 text-green-700">
                    Smart & Automated
                  </span>
                </div>
              </div>

              {/* Use Case 3 */}
              <div className="group bg-white rounded-2xl shadow-sm border border-gray-100 p-8 hover:shadow-xl hover:border-gray-200 transition-all duration-300">
                <div className="flex items-center justify-between mb-6">
                  <div className="w-14 h-14 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
                    <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                    </svg>
                  </div>
                  <div className="w-8 h-8 bg-purple-50 rounded-full flex items-center justify-center group-hover:bg-purple-100 transition-colors duration-300">
                    <svg className="w-4 h-4 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                </div>

                <h3 className="text-2xl font-bold text-gray-900 mb-4">Voice & Chat Interfaces</h3>

                <div className="bg-gradient-to-r from-gray-50 to-gray-100 rounded-xl p-5 mb-6 border-l-4 border-purple-500">
                  <div className="flex items-center space-x-2 mb-2">
                    <div className="w-2 h-2 bg-purple-500 rounded-full animate-pulse"></div>
                    <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">Interface Types</span>
                  </div>
                  <p className="text-gray-800 font-medium">Voice assistants, Telegram bots, desktop apps</p>
                </div>

                <div className="space-y-3 mb-6">
                  <div className="flex items-center space-x-3">
                    <div className="w-1.5 h-1.5 bg-purple-500 rounded-full"></div>
                    <span className="text-sm text-gray-600">Universal MCP compatibility</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <div className="w-1.5 h-1.5 bg-purple-500 rounded-full"></div>
                    <span className="text-sm text-gray-600">Cross-platform integration</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <div className="w-1.5 h-1.5 bg-purple-500 rounded-full"></div>
                    <span className="text-sm text-gray-600">No Stellar knowledge required</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <div className="w-1.5 h-1.5 bg-purple-500 rounded-full"></div>
                    <span className="text-sm text-gray-600 font-medium">Seamless user experience</span>
                  </div>
                </div>

                <div className="pt-4 border-t border-gray-100">
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-purple-50 text-purple-700">
                    Universal Access
                  </span>
                </div>
              </div>
            </div>

            {/* Additional Info Section */}
            <div className="mt-16 bg-gradient-to-r from-gray-50 to-white rounded-2xl p-8 border border-gray-100">
              <div className="text-center">
                <h3 className="text-2xl font-bold text-gray-900 mb-4">The Power of Natural Language</h3>
                <p className="text-gray-600 max-w-4xl mx-auto leading-relaxed">
                  These examples showcase how our MCP integration transforms complex blockchain operations into
                  intuitive conversations. Users don't need to understand smart contracts, XDRs, or transaction
                  signing—they simply express their intent in natural language.
                </p>
                <div className="mt-6 flex flex-wrap justify-center gap-3">
                  <span className="inline-flex items-center px-4 py-2 rounded-full text-sm font-medium bg-blue-50 text-blue-700">
                    No Technical Knowledge Required
                  </span>
                  <span className="inline-flex items-center px-4 py-2 rounded-full text-sm font-medium bg-green-50 text-green-700">
                    Secure by Design
                  </span>
                  <span className="inline-flex items-center px-4 py-2 rounded-full text-sm font-medium bg-purple-50 text-purple-700">
                    Works Everywhere
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Why It Matters Section */}
          <div className="mt-32 bg-gradient-to-r from-orange-50 to-red-50 rounded-2xl p-12">
            <div className="text-center mb-12">
              <h2 className="text-5xl font-bold text-gray-900 mb-6">Why This Matters</h2>
              <p className="text-xl text-gray-600 max-w-4xl mx-auto">
                This isn't just a dev tool. It's infrastructure for the next era of AI-native Web3.
              </p>
            </div>

            <div className="grid md:grid-cols-2 gap-12 items-center">
              <div>
                <div className="space-y-6">
                  <div className="flex items-start space-x-4">
                    <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                      <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                    <div>
                      <h4 className="font-bold text-gray-900 mb-2">Natural Language Access</h4>
                      <p className="text-gray-600">Enable natural-language access to any deployed contract</p>
                    </div>
                  </div>

                  <div className="flex items-start space-x-4">
                    <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                      <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                    <div>
                      <h4 className="font-bold text-gray-900 mb-2">Secure Delegation</h4>
                      <p className="text-gray-600">Support transaction signing via delegated keys (passkeys, policies)</p>
                    </div>
                  </div>

                  <div className="flex items-start space-x-4">
                    <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                      <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                    <div>
                      <h4 className="font-bold text-gray-900 mb-2">No Backend Required</h4>
                      <p className="text-gray-600">Abstract away the need for custom backend development</p>
                    </div>
                  </div>

                  <div className="flex items-start space-x-4">
                    <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                      <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                    <div>
                      <h4 className="font-bold text-gray-900 mb-2">Secure Agent Interaction</h4>
                      <p className="text-gray-600">Provide secure read/write interaction for agents—no full account access needed</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl p-8 shadow-lg">
                <h4 className="text-2xl font-bold text-gray-900 mb-6">Before vs. After</h4>

                <div className="space-y-6">
                  <div>
                    <h5 className="font-semibold text-red-600 mb-2">❌ Before MCP</h5>
                    <ul className="text-sm text-gray-600 space-y-1">
                      <li>• Hours wiring up custom APIs</li>
                      <li>• Complex signing logic implementation</li>
                      <li>• Maintaining backend services</li>
                      <li>• Limited to technical users</li>
                    </ul>
                  </div>

                  <div>
                    <h5 className="font-semibold text-green-600 mb-2">✅ With Our Tools</h5>
                    <ul className="text-sm text-gray-600 space-y-1">
                      <li>• Single command deployment</li>
                      <li>• Automatic MCP server generation</li>
                      <li>• Built-in security with policy signers</li>
                      <li>• Natural language for everyone</li>
                    </ul>
                  </div>
                </div>

                <div className="mt-6 p-4 bg-orange-50 rounded-lg">
                  <p className="text-sm text-orange-800 font-medium">
                    "Turning any Soroban smart contract into an AI-ready MCP server takes just seconds."
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* CTA Section */}
          <div className="mt-24 text-center">
            <h2 className="text-4xl font-bold text-gray-900 mb-6">Ready to Make Your Contracts AI-Accessible?</h2>
            <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
              Join the future of AI-native Web3. Test our tools and see how natural language can transform blockchain interaction.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <a href="/home" className="inline-block px-10 py-4 bg-orange-500 text-white font-bold rounded-lg shadow-lg hover:bg-orange-600 transition duration-300 transform hover:scale-105">
                Try the Playground
              </a>
              <a href="https://github.com/stellar/stellar-cli/pull/1985" target="_blank" rel="noopener noreferrer" className="inline-block px-10 py-4 border-2 border-gray-300 text-gray-700 font-bold rounded-lg hover:bg-gray-50 transition duration-300">
                View Pull Request
              </a>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
