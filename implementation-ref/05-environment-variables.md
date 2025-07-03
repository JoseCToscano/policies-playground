# Environment Variables Reference

This document outlines the environment variables needed to implement network switching between Stellar Testnet and Mainnet in your passkey-kit project.

## Overview

The network switching implementation uses environment variables with a naming convention that includes the network type (`TESTNET` or `MAINNET`) in the variable name. This allows the application to dynamically load the correct configuration based on the selected network.

## Environment Variable Naming Convention

All environment variables follow this pattern:
```
NEXT_PUBLIC_{NETWORK}_{SERVICE}_{PROPERTY}
```

Where:
- `{NETWORK}` is either `TESTNET` or `MAINNET`
- `{SERVICE}` identifies the service (e.g., `RPC`, `LAUNCHTUBE`, `MERCURY`)
- `{PROPERTY}` specifies the configuration property (e.g., `URL`, `JWT`, `HASH`)

## Required Environment Variables

### Testnet Configuration

```bash
# Core Stellar Network Configuration
NEXT_PUBLIC_TESTNET_RPC_URL="https://soroban-testnet.stellar.org"
NEXT_PUBLIC_TESTNET_NETWORK_PASSPHRASE="Test SDF Network ; September 2015"
NEXT_PUBLIC_TESTNET_HORIZON_URL="https://horizon-testnet.stellar.org"

# Smart Contract WASM Hashes
NEXT_PUBLIC_TESTNET_WALLET_WASM_HASH="your_testnet_wallet_wasm_hash"
NEXT_PUBLIC_TESTNET_ZAFEGARD_WASM_HASH="your_testnet_zafegard_wasm_hash"

# Launchtube Service (Transaction Submission)
NEXT_PUBLIC_TESTNET_LAUNCHTUBE_URL="https://testnet.launchtube.xyz"
NEXT_PUBLIC_TESTNET_LAUNCHTUBE_JWT="your_testnet_launchtube_jwt"

# Mercury Data Service (Indexing/Analytics)
NEXT_PUBLIC_TESTNET_MERCURY_URL="https://api.mercurydata.app"
NEXT_PUBLIC_TESTNET_MERCURY_JWT="your_testnet_mercury_jwt"
NEXT_PUBLIC_TESTNET_MERCURY_PROJECT_NAME="your_testnet_project_name"

# Contract Addresses
NEXT_PUBLIC_TESTNET_MAIN_BALANCE_CONTRACT_ID="CDLZFC3SYJYDZT7K67VZ75HPJVIEUVNIXF47ZG2FB2RMQQVU2HHGCYSC"
```

### Mainnet Configuration

```bash
# Core Stellar Network Configuration
NEXT_PUBLIC_MAINNET_RPC_URL="https://mainnet.sorobanrpc.com"
NEXT_PUBLIC_MAINNET_NETWORK_PASSPHRASE="Public Global Stellar Network ; September 2015"
NEXT_PUBLIC_MAINNET_HORIZON_URL="https://horizon.stellar.org"

# Smart Contract WASM Hashes
NEXT_PUBLIC_MAINNET_WALLET_WASM_HASH="your_mainnet_wallet_wasm_hash"
NEXT_PUBLIC_MAINNET_ZAFEGARD_WASM_HASH="your_mainnet_zafegard_wasm_hash"

# Launchtube Service (Transaction Submission)
NEXT_PUBLIC_MAINNET_LAUNCHTUBE_URL="https://mainnet.launchtube.xyz"
NEXT_PUBLIC_MAINNET_LAUNCHTUBE_JWT="your_mainnet_launchtube_jwt"

# Mercury Data Service (Indexing/Analytics)
NEXT_PUBLIC_MAINNET_MERCURY_URL="https://api.mercurydata.app"
NEXT_PUBLIC_MAINNET_MERCURY_JWT="your_mainnet_mercury_jwt"
NEXT_PUBLIC_MAINNET_MERCURY_PROJECT_NAME="your_mainnet_project_name"

# Contract Addresses
NEXT_PUBLIC_MAINNET_MAIN_BALANCE_CONTRACT_ID="CAS3J7GYLGXMF6TDJBBYYSE3HQ6BBSMLNUQ34T6TZMYMW2EVH34XOWMA"
```

## Backward Compatibility (Optional)

For backward compatibility with existing single-network setups, you can also include these fallback variables:

```bash
# Legacy Environment Variables (used as fallbacks)
NEXT_PUBLIC_RPC_URL="https://soroban-testnet.stellar.org"
NEXT_PUBLIC_NETWORK_PASSPHRASE="Test SDF Network ; September 2015"
NEXT_PUBLIC_WALLET_WASM_HASH="your_wallet_wasm_hash"
NEXT_PUBLIC_ZAFEGARD_WASM_HASH="your_zafegard_wasm_hash"
NEXT_PUBLIC_LAUNCHTUBE_URL="https://testnet.launchtube.xyz"
NEXT_PUBLIC_LAUNCHTUBE_JWT="your_launchtube_jwt"
NEXT_PUBLIC_MERCURY_URL="https://api.mercurydata.app"
NEXT_PUBLIC_MERCURY_JWT="your_mercury_jwt"
NEXT_PUBLIC_MERCURY_PROJECT_NAME="your_project_name"
NEXT_PUBLIC_MAIN_BALANCE_CONTRACT_ID="your_main_balance_contract_id"
NEXT_PUBLIC_HORIZON_URL="https://horizon-testnet.stellar.org"
```

## Important Notes

### Security Considerations

1. **JWT Tokens**: Never commit JWT tokens to version control. Use secure environment variable management.
2. **Network Separation**: Use different tokens and project names for testnet and mainnet.
3. **WASM Hashes**: Ensure you're using the correct contract hashes for each network.

### WASM Hash Requirements

- **Wallet WASM Hash**: The hash of your smart wallet contract deployed on each network
- **Zafegard WASM Hash**: Optional - used for advanced wallet features and permissions

### Contract Addresses

The example addresses shown are for native XLM SAC (Stellar Asset Contract) addresses:
- **Testnet XLM SAC**: `CDLZFC3SYJYDZT7K67VZ75HPJVIEUVNIXF47ZG2FB2RMQQVU2HHGCYSC`
- **Mainnet XLM SAC**: `CAS3J7GYLGXMF6TDJBBYYSE3HQ6BBSMLNUQ34T6TZMYMW2EVH34XOWMA`

You may want to use different contract addresses for your main balance (e.g., USDC contracts).

## Environment Setup Examples

### Development (.env.local)
```bash
# Use testnet by default for development
NEXT_PUBLIC_TESTNET_RPC_URL="https://soroban-testnet.stellar.org"
NEXT_PUBLIC_TESTNET_WALLET_WASM_HASH="your_dev_wallet_hash"
# ... other testnet variables

# Optional: Set mainnet variables for testing network switching
NEXT_PUBLIC_MAINNET_RPC_URL="https://mainnet.sorobanrpc.com"
NEXT_PUBLIC_MAINNET_WALLET_WASM_HASH="your_mainnet_wallet_hash"
# ... other mainnet variables
```

### Production (.env.production)
```bash
# Full configuration for both networks
# Testnet variables...
NEXT_PUBLIC_TESTNET_RPC_URL="https://soroban-testnet.stellar.org"
# ... all testnet variables

# Mainnet variables...
NEXT_PUBLIC_MAINNET_RPC_URL="https://mainnet.sorobanrpc.com"
# ... all mainnet variables
```

### Staging (.env.staging)
```bash
# Maybe use testnet for staging with production-like tokens
NEXT_PUBLIC_TESTNET_RPC_URL="https://soroban-testnet.stellar.org"
NEXT_PUBLIC_TESTNET_MERCURY_PROJECT_NAME="your_staging_project"
# ... other staging-specific variables
```

## Deployment Considerations

### Vercel
Set environment variables in the Vercel dashboard under Settings > Environment Variables.

### Netlify
Set environment variables in the Netlify dashboard under Site settings > Environment variables.

### Docker
Use environment files or pass variables via `docker run -e` flags.

### CI/CD
Store sensitive values (JWTs, API keys) in your CI/CD platform's secrets management.

## Validation

The Stellar context includes fallback values for all environment variables. However, for production use, you should:

1. Validate that all required environment variables are set
2. Implement runtime checks for critical variables
3. Consider using a validation library like `@t3-oss/env-nextjs`

Example validation pattern:
```typescript
// env.mjs or similar
import { createEnv } from "@t3-oss/env-nextjs";
import { z } from "zod";

export const env = createEnv({
  client: {
    NEXT_PUBLIC_TESTNET_RPC_URL: z.string().url(),
    NEXT_PUBLIC_TESTNET_WALLET_WASM_HASH: z.string(),
    NEXT_PUBLIC_MAINNET_RPC_URL: z.string().url(),
    NEXT_PUBLIC_MAINNET_WALLET_WASM_HASH: z.string(),
    // ... other validations
  },
  runtimeEnv: {
    NEXT_PUBLIC_TESTNET_RPC_URL: process.env.NEXT_PUBLIC_TESTNET_RPC_URL,
    NEXT_PUBLIC_TESTNET_WALLET_WASM_HASH: process.env.NEXT_PUBLIC_TESTNET_WALLET_WASM_HASH,
    // ... other variables
  },
});
```

## Troubleshooting

### Common Issues

1. **Missing Variables**: Ensure all variables are prefixed with `NEXT_PUBLIC_`
2. **Wrong Network**: Double-check that testnet and mainnet variables are properly separated
3. **Invalid URLs**: Verify that RPC and service URLs are accessible
4. **WASM Hash Mismatch**: Ensure contract hashes match the deployed contracts on each network

### Debug Helper

Add this to your Stellar context for debugging:
```typescript
useEffect(() => {
  if (process.env.NODE_ENV === 'development') {
    console.log('Current network config:', config);
  }
}, [config]);
```