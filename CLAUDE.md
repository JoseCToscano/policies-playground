# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

### Core Development
- `pnpm dev` - Start Next.js development server with Turbo
- `pnpm build` - Build the application for production
- `pnpm start` - Start production server
- `pnpm preview` - Build and start production server

### Code Quality
- `pnpm lint` - Run ESLint on the codebase
- `pnpm lint:fix` - Run ESLint with auto-fix
- `pnpm typecheck` - Run TypeScript type checking
- `pnpm check` - Run both linting and type checking
- `pnpm format:check` - Check code formatting with Prettier
- `pnpm format:write` - Format code with Prettier

### Smart Contract Development
- `cd contracts && make install` - Build and install Stellar smart contracts
- `cd contracts && make bindings` - Generate TypeScript bindings for contracts

## Architecture Overview

This is a Next.js application implementing a smart wallet system with biometric authentication and policy management on the Stellar blockchain network.

### Core Technologies
- **Frontend**: Next.js 15 with App Router, React 18, TypeScript
- **Styling**: Tailwind CSS with Radix UI components
- **Blockchain**: Stellar SDK for smart contract interactions
- **Authentication**: Passkey Kit for biometric wallet authentication
- **API Layer**: tRPC for type-safe API calls
- **State Management**: React hooks and context
- **Environment**: T3 environment validation with Zod

### Key Architecture Components

#### Smart Wallet System (`src/hooks/useSmartWallet.ts`)
Central hook managing wallet operations including:
- Biometric wallet creation and connection
- Signer management (Ed25519 and Secp256r1)
- Policy attachment/detachment
- Transaction signing and submission
- Balance tracking and funding

#### Stellar Integration (`src/server/api/routers/stellar.ts`)
tRPC router handling:
- Contract metadata retrieval
- Contract method preparation and execution
- Transaction simulation and submission
- SEP-10 authentication challenges

#### Contract Interaction (`src/app/home/_components/contract-call.tsx`)
Main UI for interacting with Stellar smart contracts:
- Dynamic contract method discovery
- Parameter input handling with type conversion
- Transaction preparation and signing
- Support for both SAC tokens and custom contracts

#### Environment Configuration (`src/env.js`)
Validated environment variables for:
- Stellar network configuration (RPC, network passphrase)
- PasskeyKit and Mercury integration
- Launchtube and contract addresses
- Stripe payment integration

### Smart Contract Architecture

#### Rust Contracts (`contracts/`)
- Custom policy contracts built with Stellar Soroban
- Makefile for building and deploying contracts
- TypeScript binding generation for frontend integration

#### Policy System
- Policy assignment tracking in localStorage
- Contract-based policy enforcement
- Multi-signature transaction support with policy constraints

### Data Flow

1. **Wallet Creation**: User creates biometric wallet → PasskeyKit generates keys → Smart contract deployed
2. **Contract Interaction**: User selects contract → Metadata fetched → Parameters input → Transaction prepared → Signed with biometric/Ed25519 → Submitted to network
3. **Policy Management**: Policies created → Attached to signers → Enforced during transactions

### Key Utilities (`src/lib/utils.ts`)

#### Stellar Helpers
- `createSmartContractClient()` - Factory for SAC and custom contract clients
- `fundKeypair` and `fundSigner` - Test network funding utilities
- Error handling for Horizon server responses

#### Type Conversion (`src/lib/scHelper.ts`)
- ScVal conversion utilities for different parameter types
- Address, number, boolean, and bytes conversion helpers

### File Structure Patterns

- `/src/app` - Next.js App Router pages and components
- `/src/components/ui` - Reusable Radix UI components
- `/src/hooks` - Custom React hooks for wallet and blockchain operations
- `/src/lib` - Utility functions and constants
- `/src/server` - tRPC API routes and services
- `/src/types` - TypeScript type definitions
- `/contracts` - Rust smart contracts and build tools

### Testing and Development

Always run `pnpm check` before committing to ensure code quality. The project uses:
- ESLint for code linting
- TypeScript for type safety
- Prettier for code formatting

Use `pnpm dev` for development with hot reloading. The development server includes Turbo for faster builds.

### Network Configuration

The application is configured for Stellar Testnet by default. Environment variables control:
- RPC endpoints
- Network passphrases  
- Contract addresses
- Service integrations (Mercury, Launchtube)

All network-specific constants are centralized in the environment configuration.