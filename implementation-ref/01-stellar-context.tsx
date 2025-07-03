/**
 * STELLAR CONTEXT PATTERN - REFERENCE IMPLEMENTATION
 * 
 * This file demonstrates the pattern used in Freelii for network switching
 * between Stellar Testnet and Mainnet using React Context.
 * 
 * Key Features:
 * - Network-specific configuration management
 * - localStorage persistence of network preference
 * - Type-safe network switching
 * - Environment variable fallbacks
 * - Predefined contract addresses for both networks
 */

'use client';

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';

// Core types for network management
export type NetworkType = 'testnet' | 'mainnet';

/**
 * Complete configuration interface for Stellar network
 * This should be adapted based on your specific passkey-kit needs
 */
export interface StellarNetworkConfig {
  rpcUrl: string;
  networkPassphrase: string;
  walletWasmHash: string;
  zafegardWasmHash: string;  // Optional - used for advanced wallet features
  launchtubeUrl: string;
  launchtubeJwt: string;
  mercuryUrl: string;
  mercuryJwt: string;
  mercuryProjectName: string;
  nativeContractId: string;
  horizonUrl?: string;
  mainBalance: string;  // Main balance contract (often USDC or native XLM)
}

interface StellarContextType {
  network: NetworkType;
  config: StellarNetworkConfig;
  setNetwork: (network: NetworkType) => void;
}

// Known XLM SAC contract addresses for both networks
const TESTNET_XLM_SAC = 'CDLZFC3SYJYDZT7K67VZ75HPJVIEUVNIXF47ZG2FB2RMQQVU2HHGCYSC';
const MAINNET_XLM_SAC = 'CAS3J7GYLGXMF6TDJBBYYSE3HQ6BBSMLNUQ34T6TZMYMW2EVH34XOWMA';

/**
 * Network-specific configurations with environment variable fallbacks
 * 
 * IMPORTANT: You'll need to set these environment variables in your project:
 * 
 * For Testnet:
 * - NEXT_PUBLIC_TESTNET_RPC_URL
 * - NEXT_PUBLIC_TESTNET_NETWORK_PASSPHRASE
 * - NEXT_PUBLIC_TESTNET_WALLET_WASM_HASH
 * - etc.
 * 
 * For Mainnet:
 * - NEXT_PUBLIC_MAINNET_RPC_URL
 * - NEXT_PUBLIC_MAINNET_NETWORK_PASSPHRASE
 * - NEXT_PUBLIC_MAINNET_WALLET_WASM_HASH
 * - etc.
 */
const NETWORK_CONFIGS: Record<NetworkType, StellarNetworkConfig> = {
  testnet: {
    rpcUrl: process.env.NEXT_PUBLIC_TESTNET_RPC_URL ?? 'https://soroban-testnet.stellar.org',
    networkPassphrase: process.env.NEXT_PUBLIC_TESTNET_NETWORK_PASSPHRASE ?? 'Test SDF Network ; September 2015',
    walletWasmHash: process.env.NEXT_PUBLIC_TESTNET_WALLET_WASM_HASH ?? 'ecd990f0b45ca6817149b6175f79b32efb442f35731985a084131e8265c4cd90',
    zafegardWasmHash: process.env.NEXT_PUBLIC_TESTNET_ZAFEGARD_WASM_HASH ?? 'eb5c4860b3b6c8e09cde9e81d01fd5bef3dcecbed3c5776a6715067c690ad2cf',
    launchtubeUrl: process.env.NEXT_PUBLIC_TESTNET_LAUNCHTUBE_URL ?? 'https://testnet.launchtube.xyz',
    launchtubeJwt: process.env.NEXT_PUBLIC_TESTNET_LAUNCHTUBE_JWT ?? '',
    mercuryUrl: process.env.NEXT_PUBLIC_TESTNET_MERCURY_URL ?? 'https://api.mercurydata.app',
    mercuryJwt: process.env.NEXT_PUBLIC_TESTNET_MERCURY_JWT ?? '',
    mercuryProjectName: process.env.NEXT_PUBLIC_TESTNET_MERCURY_PROJECT_NAME ?? 'your-testnet-project',
    nativeContractId: TESTNET_XLM_SAC,
    horizonUrl: process.env.NEXT_PUBLIC_TESTNET_HORIZON_URL ?? 'https://horizon-testnet.stellar.org',
    mainBalance: process.env.NEXT_PUBLIC_TESTNET_MAIN_BALANCE_CONTRACT_ID ?? TESTNET_XLM_SAC,
  },
  mainnet: {
    rpcUrl: process.env.NEXT_PUBLIC_MAINNET_RPC_URL ?? 'https://mainnet.sorobanrpc.com',
    networkPassphrase: process.env.NEXT_PUBLIC_MAINNET_NETWORK_PASSPHRASE ?? 'Public Global Stellar Network ; September 2015',
    walletWasmHash: process.env.NEXT_PUBLIC_MAINNET_WALLET_WASM_HASH ?? '',
    zafegardWasmHash: process.env.NEXT_PUBLIC_MAINNET_ZAFEGARD_WASM_HASH ?? '',
    launchtubeUrl: process.env.NEXT_PUBLIC_MAINNET_LAUNCHTUBE_URL ?? 'https://mainnet.launchtube.xyz',
    launchtubeJwt: process.env.NEXT_PUBLIC_MAINNET_LAUNCHTUBE_JWT ?? '',
    mercuryUrl: process.env.NEXT_PUBLIC_MAINNET_MERCURY_URL ?? 'https://api.mercurydata.app',
    mercuryJwt: process.env.NEXT_PUBLIC_MAINNET_MERCURY_JWT ?? '',
    mercuryProjectName: process.env.NEXT_PUBLIC_MAINNET_MERCURY_PROJECT_NAME ?? '',
    nativeContractId: MAINNET_XLM_SAC,
    horizonUrl: process.env.NEXT_PUBLIC_MAINNET_HORIZON_URL ?? 'https://horizon.stellar.org',
    mainBalance: process.env.NEXT_PUBLIC_MAINNET_MAIN_BALANCE_CONTRACT_ID!,
  },
};

// Create the context
const StellarContext = createContext<StellarContextType | undefined>(undefined);

interface StellarProviderProps {
  children: ReactNode;
  defaultNetwork?: NetworkType;
}

/**
 * StellarProvider component that manages network state and configuration
 * 
 * Usage:
 * ```tsx
 * <StellarProvider defaultNetwork="testnet">
 *   <App />
 * </StellarProvider>
 * ```
 */
export const StellarProvider: React.FC<StellarProviderProps> = ({
  children,
  defaultNetwork = 'testnet', // Default to testnet for safety
}) => {
  const [network, setNetwork] = useState<NetworkType>(defaultNetwork);

  // Load network preference from localStorage on mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedNetwork = localStorage.getItem('stellar-network') as NetworkType;
      if (savedNetwork && (savedNetwork === 'testnet' || savedNetwork === 'mainnet')) {
        setNetwork(savedNetwork);
      }
    }
  }, []);

  // Save network preference to localStorage when changed
  const handleSetNetwork = useCallback((newNetwork: NetworkType) => {
    setNetwork(newNetwork);
    if (typeof window !== 'undefined') {
      localStorage.setItem('stellar-network', newNetwork);
    }
  }, []);

  // Memoize config to prevent unnecessary re-renders
  const config = useMemo(() => NETWORK_CONFIGS[network], [network]);

  const value: StellarContextType = {
    network,
    config,
    setNetwork: handleSetNetwork,
  };

  return (
    <StellarContext.Provider value={value}>
      {children}
    </StellarContext.Provider>
  );
};

/**
 * Hook to access Stellar context
 * 
 * Usage:
 * ```tsx
 * const { network, config, setNetwork } = useStellar();
 * ```
 */
export const useStellar = () => {
  const context = useContext(StellarContext);
  if (context === undefined) {
    throw new Error('useStellar must be used within a StellarProvider');
  }
  return context;
};

/**
 * Utility hook to get XLM SAC address for current network
 * 
 * Usage:
 * ```tsx
 * const xlmSacAddress = useXlmSac();
 * ```
 */
export const useXlmSac = () => {
  const { network } = useStellar();
  return network === 'testnet' ? TESTNET_XLM_SAC : MAINNET_XLM_SAC;
};