# Smart Wallet with Policies

A Next.js application that implements a smart wallet with biometric authentication and policy management on the Stellar network.

## Features

- 🔐 **Biometric Authentication**: Secure wallet access using biometric verification
- 💼 **Multi-Signature Support**: Add and manage multiple signers for enhanced security
- 📜 **Policy Management**: Create and attach policies to control transaction limits
- 💰 **Asset Management**: Support for multiple assets including XLM, USDC, and EURC
- 🔄 **Contract Interactions**: Direct interaction with Stellar smart contracts
- 🎨 **Modern UI**: Clean and intuitive interface built with Tailwind CSS

## Getting Started

1. Clone the repository

```bash
git clone [your-repo-url]
cd [your-repo-name]
```

2. Install dependencies

```bash
npm install
```

3. Run the development server

```bash
npm run dev
```

## Tech Stack

- **Framework**: [Next.js](https://nextjs.org)
- **Smart Contracts**: Stellar Network
- **Styling**: [Tailwind CSS](https://tailwindcss.com)
- **Authentication**: Biometric (WebAuthn)
- **State Management**: React Hooks + Context
- **API Integration**: tRPC

## Project Structure

- `/src/app` - Next.js application routes and pages
- `/src/components` - Reusable UI components
- `/src/hooks` - Custom React hooks for wallet and authentication
- `/src/lib` - Utility functions and helpers
- `/src/trpc` - tRPC API routes and configurations

## Features in Detail

### Smart Wallet

- Create and manage wallets with biometric authentication
- View balances across multiple assets
- Fund wallets with test assets

### Signers Management

- Add multiple signers with custom names and purposes
- Manage signer permissions and policies
- Remove signers when needed

### Policy System

- Create custom transaction policies
- Set spending limits per asset
- Attach policies to specific signers

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

[Your License] - See LICENSE file for details
