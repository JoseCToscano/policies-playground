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
import { env } from '~/env';

export type NetworkType = 'testnet' | 'mainnet';

export interface StellarNetworkConfig {
  rpcUrl: string;
  networkPassphrase: string;
  walletWasmHash: string;
  launchtubeUrl: string;
  launchtubeJwt: string;
  mercuryUrl: string;
  mercuryJwt: string;
  mercuryProjectName: string;
  nativeContractId: string;
  horizonUrl?: string;
}

interface StellarContextType {
  network: NetworkType;
  config: StellarNetworkConfig;
  setNetwork: (network: NetworkType) => void;
}

// Known XLM SAC contract addresses for both networks
const TESTNET_XLM_SAC = 'CDLZFC3SYJYDZT7K67VZ75HPJVIEUVNIXF47ZG2FB2RMQQVU2HHGCYSC';
const MAINNET_XLM_SAC = 'CAS3J7GYLGXMF6TDJBBYYSE3HQ6BBSMLNUQ34T6TZMYMW2EVH34XOWMA';

const NETWORK_CONFIGS: Record<NetworkType, StellarNetworkConfig> = {
  testnet: {
    rpcUrl: env.NEXT_PUBLIC_TESTNET_RPC_URL,
    networkPassphrase: env.NEXT_PUBLIC_TESTNET_NETWORK_PASSPHRASE,
    walletWasmHash: env.NEXT_PUBLIC_TESTNET_WALLET_WASM_HASH,
    launchtubeUrl: env.NEXT_PUBLIC_TESTNET_LAUNCHTUBE_URL,
    launchtubeJwt: env.NEXT_PUBLIC_TESTNET_LAUNCHTUBE_JWT,
    mercuryUrl: env.NEXT_PUBLIC_TESTNET_MERCURY_URL,
    mercuryJwt: env.NEXT_PUBLIC_TESTNET_MERCURY_JWT,
    mercuryProjectName: env.NEXT_PUBLIC_TESTNET_MERCURY_PROJECT_NAME,
    nativeContractId: env.NEXT_PUBLIC_TESTNET_NATIVE_CONTRACT_ID,
    horizonUrl: env.NEXT_PUBLIC_TESTNET_HORIZON_URL,
  },
  mainnet: {
    rpcUrl: env.NEXT_PUBLIC_MAINNET_RPC_URL,
    networkPassphrase: env.NEXT_PUBLIC_MAINNET_NETWORK_PASSPHRASE,
    walletWasmHash: env.NEXT_PUBLIC_MAINNET_WALLET_WASM_HASH,
    launchtubeUrl: env.NEXT_PUBLIC_MAINNET_LAUNCHTUBE_URL,
    launchtubeJwt: env.NEXT_PUBLIC_MAINNET_LAUNCHTUBE_JWT,
    mercuryUrl: env.NEXT_PUBLIC_MAINNET_MERCURY_URL,
    mercuryJwt: env.NEXT_PUBLIC_MAINNET_MERCURY_JWT,
    mercuryProjectName: env.NEXT_PUBLIC_MAINNET_MERCURY_PROJECT_NAME,
    nativeContractId: env.NEXT_PUBLIC_MAINNET_NATIVE_CONTRACT_ID,
    horizonUrl: env.NEXT_PUBLIC_MAINNET_HORIZON_URL,
  },
};

const StellarContext = createContext<StellarContextType | undefined>(undefined);

interface StellarProviderProps {
  children: ReactNode;
  defaultNetwork?: NetworkType;
}

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

export const useStellar = () => {
  const context = useContext(StellarContext);
  if (context === undefined) {
    throw new Error('useStellar must be used within a StellarProvider');
  }
  return context;
};

export const useXlmSac = () => {
  const { network } = useStellar();
  return network === 'testnet' ? TESTNET_XLM_SAC : MAINNET_XLM_SAC;
};