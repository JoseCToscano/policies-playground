/**
 * Server-side Stellar clients factory
 * Since server components can't use React Context, this provides
 * network-aware client creation for server-side operations
 */

import { type StellarNetworkConfig } from '~/contexts/stellar-context';
import { Account, Keypair, StrKey, Asset, Networks } from '@stellar/stellar-sdk';
import { basicNodeSigner } from '@stellar/stellar-sdk/minimal/contract';
import { Server } from '@stellar/stellar-sdk/minimal/rpc';
import { PasskeyKit, PasskeyServer, SACClient } from 'passkey-kit';
import { env } from '~/env';

// Known XLM SAC contract addresses for both networks
const TESTNET_XLM_SAC = 'CDLZFC3SYJYDZT7K67VZ75HPJVIEUVNIXF47ZG2FB2RMQQVU2HHGCYSC';
const MAINNET_XLM_SAC = 'CAS3J7GYLGXMF6TDJBBYYSE3HQ6BBSMLNUQ34T6TZMYMW2EVH34XOWMA';

/**
 * Get network configuration for server-side use
 */
export function getServerNetworkConfig(network: 'testnet' | 'mainnet'): StellarNetworkConfig {
  if (network === 'mainnet') {
    return {
      rpcUrl: env.NEXT_PUBLIC_MAINNET_RPC_URL ?? 'https://mainnet.sorobanrpc.com',
      networkPassphrase: env.NEXT_PUBLIC_MAINNET_NETWORK_PASSPHRASE ?? 'Public Global Stellar Network ; September 2015',
      walletWasmHash: env.NEXT_PUBLIC_MAINNET_WALLET_WASM_HASH ?? '',
      launchtubeUrl: env.NEXT_PUBLIC_MAINNET_LAUNCHTUBE_URL ?? 'https://mainnet.launchtube.xyz',
      launchtubeJwt: env.NEXT_PUBLIC_MAINNET_LAUNCHTUBE_JWT ?? '',
      mercuryUrl: env.NEXT_PUBLIC_MAINNET_MERCURY_URL ?? 'https://api.mercurydata.app',
      mercuryJwt: env.NEXT_PUBLIC_MAINNET_MERCURY_JWT ?? '',
      mercuryProjectName: env.NEXT_PUBLIC_MAINNET_MERCURY_PROJECT_NAME ?? '',
      nativeContractId: env.NEXT_PUBLIC_MAINNET_NATIVE_CONTRACT_ID ?? MAINNET_XLM_SAC,
      horizonUrl: env.NEXT_PUBLIC_MAINNET_HORIZON_URL ?? 'https://horizon.stellar.org',
    };
  } else {
    return {
      rpcUrl: env.NEXT_PUBLIC_TESTNET_RPC_URL ?? 'https://soroban-testnet.stellar.org',
      networkPassphrase: env.NEXT_PUBLIC_TESTNET_NETWORK_PASSPHRASE ?? 'Test SDF Network ; September 2015',
      walletWasmHash: env.NEXT_PUBLIC_TESTNET_WALLET_WASM_HASH ?? '',
      launchtubeUrl: env.NEXT_PUBLIC_TESTNET_LAUNCHTUBE_URL ?? 'https://testnet.launchtube.xyz',
      launchtubeJwt: env.NEXT_PUBLIC_TESTNET_LAUNCHTUBE_JWT ?? '',
      mercuryUrl: env.NEXT_PUBLIC_TESTNET_MERCURY_URL ?? 'https://api.mercurydata.app',
      mercuryJwt: env.NEXT_PUBLIC_TESTNET_MERCURY_JWT ?? '',
      mercuryProjectName: env.NEXT_PUBLIC_TESTNET_MERCURY_PROJECT_NAME ?? 'your-testnet-project',
      nativeContractId: env.NEXT_PUBLIC_TESTNET_NATIVE_CONTRACT_ID ?? TESTNET_XLM_SAC,
      horizonUrl: env.NEXT_PUBLIC_TESTNET_HORIZON_URL ?? 'https://horizon-testnet.stellar.org',
    };
  }
}

/**
 * Create server-side Stellar clients
 */
export function createServerStellarClients(network: 'testnet' | 'mainnet' = 'testnet') {
  const config = getServerNetworkConfig(network);

  // Create RPC client for Soroban interactions
  const rpc = new Server(config.rpcUrl);

  // Create PasskeyServer for transaction submission
  const server = new PasskeyServer({
    rpcUrl: config.rpcUrl,
    launchtubeUrl: config.launchtubeUrl,
    launchtubeJwt: config.launchtubeJwt,
    mercuryProjectName: config.mercuryProjectName,
    mercuryUrl: config.mercuryUrl,
    mercuryJwt: config.mercuryJwt,
  });

  // Create SAC client for token operations
  const sac = new SACClient({
    rpcUrl: config.rpcUrl,
    networkPassphrase: config.networkPassphrase,
  });

  return {
    rpc,
    server,
    sac,
    config,
    network,
  };
}

/**
 * Get the Stellar Network enum for SDK operations
 */
export function getStellarNetwork(network: 'testnet' | 'mainnet') {
  return network === 'mainnet' ? Networks.PUBLIC : Networks.TESTNET;
}

/**
 * Get network-specific asset contracts
 */
export function getNetworkAssets(network: 'testnet' | 'mainnet') {
  if (network === 'mainnet') {
    return [
      new Asset("USDC", "GA5ZSEJYB37JRC5AVCIA5MOP4RHTM335X2KGX3IHOJAPP5RE34K4KZVN"), // Mainnet USDC
      new Asset("EURC", "GA4VW5D3GMOAG2DBVWGF5P3T6R64XRCFHQVYMU4SIWP7RBVH2RYHSYEP")  // Mainnet EURC (example)
    ];
  } else {
    return [
      new Asset("USDC", "GBBD47IF6LWK7P7MDEVSCWR7DPUWV3NY3DTQEVFL4NAT4AQH3ZLLFLA5"), // Testnet USDC
      new Asset("EURC", "GB3Q6QDZYTHWT7E5PVS3W7FUT5GVAFC5KSZFFLPU25GO7VTC3NM2ZTVO")  // Testnet EURC
    ];
  }
}