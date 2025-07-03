'use client';
import React, { useState, useEffect } from 'react';
import { Menu, X, ChevronDown } from 'lucide-react';
import Link from 'next/link';
import { NetworkSwitcher } from './network-switcher';

const Navbar = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [isScrolled, setIsScrolled] = useState(false);

    useEffect(() => {
        const handleScroll = () => {
            setIsScrolled(window.scrollY > 10);
        };

        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    return (
        <div className="fixed w-full z-50 px-4 sm:px-6 lg:px-8 pt-6">
            <nav
                className={`max-w-7xl mx-auto rounded-full transition-all duration-500 ${isScrolled
                    ? 'opacity-95 bg-white/90 backdrop-blur-sm shadow-lg border border-gray-200/50'
                    : 'bg-white/95 backdrop-blur-sm border border-gray-200/30'
                    }`}
            >
                <div className="px-4 sm:px-6">
                    <div className="flex items-center justify-between h-14">
                        <div className="flex items-center">
                            <Link
                                href="/"
                                className="flex items-center space-x-2 transform hover:scale-110 transition-transform duration-300"
                            >
                                <div className="w-8 h-8 bg-gradient-to-br from-amber-500 via-yellow-500 to-amber-600 rounded-lg flex items-center justify-center shadow-lg">
                                    <svg
                                        width="20"
                                        height="20"
                                        viewBox="0 0 24 24"
                                        fill="none"
                                        xmlns="http://www.w3.org/2000/svg"
                                    >
                                        {/* Wallet icon */}
                                        <path
                                            d="M21 8V6a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2h14a2 2 0 002-2v-2"
                                            stroke="white"
                                            strokeWidth="1.5"
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            fill="none"
                                        />
                                        <path
                                            d="M16 12h2a2 2 0 002-2V8a2 2 0 00-2-2h-2v6z"
                                            fill="white"
                                        />
                                        <circle cx="16" cy="12" r="1" fill="#f59e0b" />
                                    </svg>
                                </div>
                                <span className="font-bold text-gray-900 hidden sm:block text-lg">Smart Wallets</span>
                            </Link>
                            <div className="hidden md:block ml-10">
                                <div className="flex items-center space-x-8">
                                    <div className="relative group">
                                        <button
                                            aria-haspopup="true"
                                            aria-expanded="false"
                                            className="text-gray-600 hover:text-gray-900 flex items-center space-x-1 text-sm transition-colors duration-300"
                                        >
                                            <span>Features</span>
                                            <ChevronDown className="h-4 w-4 transform group-hover:rotate-180 transition-transform duration-300" />
                                        </button>
                                        <div className="absolute left-0 mt-2 w-56 bg-white rounded-lg shadow-lg py-2 z-20 invisible group-hover:visible transition-all duration-300 opacity-0 group-hover:opacity-100 border border-gray-100">
                                            <Link
                                                href="#mcp-generator"
                                                className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                                            >
                                                MCP Server Generator
                                            </Link>
                                            <Link
                                                href="#stellar-mcp"
                                                className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                                            >
                                                Stellar MCP Server
                                            </Link>
                                            <Link
                                                href="#policy-signers"
                                                className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                                            >
                                                Policy Signers
                                            </Link>
                                            <Link
                                                href="#use-cases"
                                                className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                                            >
                                                Use Cases
                                            </Link>
                                        </div>
                                    </div>
                                    <Link
                                        href="https://www.youtube.com/watch?v=8u84duwxC-4"
                                        className="text-gray-600 hover:text-gray-900 text-sm transition-colors duration-300"
                                    >
                                        Demo
                                    </Link>
                                    <Link
                                        href="https://github.com/stellar/stellar-cli/pull/1985"
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-gray-600 hover:text-gray-900 text-sm transition-colors duration-300"
                                    >
                                        From Soroban to MCP Server
                                    </Link>
                                    <Link
                                        href="https://github.com/JoseCToscano/stellar-cli/pull/1"
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-gray-600 hover:text-gray-900 text-sm transition-colors duration-300"
                                    >
                                        Policies Generator
                                    </Link>
                                </div>
                            </div>
                        </div>
                        <div className="hidden md:flex items-center space-x-4">
                            <NetworkSwitcher />
                            <Link
                                href="/home"
                                className="text-gray-600 hover:text-gray-900 text-sm transition-colors duration-300"
                            >
                                Try Playground
                            </Link>
                            <Link
                                href="/home"
                                className="bg-gradient-to-r from-amber-500 to-yellow-600 text-white px-4 py-2 rounded-full text-sm font-medium hover:from-amber-600 hover:to-yellow-700 transition-all duration-300 hover:scale-105 transform shadow-lg"
                            >
                                Create Smart Wallet
                            </Link>
                        </div>
                        <div className="md:hidden flex items-center">
                            <button
                                onClick={() => setIsOpen(!isOpen)}
                                className="text-gray-600 hover:text-gray-900 p-2 transition-colors duration-300"
                            >
                                {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
                            </button>
                        </div>
                    </div>
                </div>
            </nav>

            {/* Mobile menu */}
            <div
                className={`md:hidden mt-4 bg-white/95 backdrop-blur-sm rounded-2xl transition-all duration-300 transform border border-gray-200/50 ${isOpen ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-4 pointer-events-none'
                    }`}
            >
                <div className="px-2 pt-2 pb-3 space-y-1">
                    <div className="px-3 py-2">
                        <NetworkSwitcher />
                    </div>
                    <Link
                        href="#mcp-generator"
                        className="text-gray-600 hover:text-gray-900 block px-3 py-2 text-base transition-colors duration-300"
                        onClick={() => setIsOpen(false)}
                    >
                        MCP Generator
                    </Link>
                    <Link
                        href="#stellar-mcp"
                        className="text-gray-600 hover:text-gray-900 block px-3 py-2 text-base transition-colors duration-300"
                        onClick={() => setIsOpen(false)}
                    >
                        Stellar MCP
                    </Link>
                    <Link
                        href="#policy-signers"
                        className="text-gray-600 hover:text-gray-900 block px-3 py-2 text-base transition-colors duration-300"
                        onClick={() => setIsOpen(false)}
                    >
                        Policy Signers
                    </Link>
                    <Link
                        href="#use-cases"
                        className="text-gray-600 hover:text-gray-900 block px-3 py-2 text-base transition-colors duration-300"
                        onClick={() => setIsOpen(false)}
                    >
                        Use Cases
                    </Link>
                    <Link
                        href="#demo"
                        className="text-gray-600 hover:text-gray-900 block px-3 py-2 text-base transition-colors duration-300"
                        onClick={() => setIsOpen(false)}
                    >
                        Demo
                    </Link>
                    <Link
                        href="https://github.com/stellar/stellar-cli/pull/1985"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-gray-600 hover:text-gray-900 block px-3 py-2 text-base transition-colors duration-300"
                        onClick={() => setIsOpen(false)}
                    >
                        GitHub
                    </Link>
                    <Link
                        href="/home"
                        className="text-gray-600 hover:text-gray-900 block px-3 py-2 text-base transition-colors duration-300"
                        onClick={() => setIsOpen(false)}
                    >
                        Try Playground
                    </Link>
                    <Link
                        href="/home"
                        className="bg-gradient-to-r from-amber-500 to-yellow-600 text-white block px-3 py-2 rounded-lg text-base text-center font-medium mt-4 hover:from-amber-600 hover:to-yellow-700 transition-all duration-300 hover:scale-105 transform shadow-lg"
                        onClick={() => setIsOpen(false)}
                    >
                        Create Smart Wallet
                    </Link>
                </div>
            </div>
        </div>
    );
};

export default Navbar;
