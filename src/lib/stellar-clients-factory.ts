import type { StellarNetworkConfig } from '~/contexts/stellar-context';
import { Account, Keypair, StrKey } from '@stellar/stellar-sdk/minimal';
import { basicNodeSigner } from '@stellar/stellar-sdk/minimal/contract';
import { Server } from '@stellar/stellar-sdk/minimal/rpc';
import { PasskeyKit, PasskeyServer, SACClient } from 'passkey-kit';

export const createStellarClients = (config: StellarNetworkConfig) => {
  // Create RPC client for Soroban interactions
  const rpc = new Server(config.rpcUrl);

  // Create PasskeyKit client for smart wallet operations
  const account = new PasskeyKit({
    rpcUrl: config.rpcUrl,
    networkPassphrase: config.networkPassphrase,
    walletWasmHash: config.walletWasmHash,
    timeoutInSeconds: 30
  });

  // Create PasskeyServer for transaction submission and Mercury integration
  const server = new PasskeyServer({
    rpcUrl: config.rpcUrl,
    launchtubeUrl: config.launchtubeUrl,
    launchtubeJwt: config.launchtubeJwt,
    mercuryProjectName: config.mercuryProjectName,
    mercuryUrl: config.mercuryUrl,
    mercuryJwt: config.mercuryJwt,
  });

  // Mock account for transactions that don't require a real source account
  const mockPubkey = StrKey.encodeEd25519PublicKey(Buffer.alloc(32));
  const mockSource = new Account(mockPubkey, '0');

  /**
   * Funding utilities for testnet development
   * These create deterministic keypairs based on the current hour
   * IMPORTANT: Only use these for testnet! Never use deterministic keypairs in production.
   */
  const fundKeypair = new Promise<Keypair>(async (resolve) => {
    const now = new Date();
    now.setMinutes(0, 0, 0); // Round to current hour

    const nowData = new TextEncoder().encode(now.getTime().toString());
    const hashBuffer = await crypto.subtle.digest('SHA-256', nowData);
    const keypair = Keypair.fromRawEd25519Seed(Buffer.from(hashBuffer));
    const publicKey = keypair.publicKey();

    // Try to fund the keypair if it doesn't exist (testnet only)
    rpc.getAccount(publicKey)
      .catch(() => rpc.requestAirdrop(publicKey))
      .catch(() => { }); // Ignore airdrop failures

    resolve(keypair);
  });

  const getFundPubkey = async () => (await fundKeypair).publicKey();
  const getFundSigner = async () => basicNodeSigner(await fundKeypair, config.networkPassphrase);

  // Create SAC (Stellar Asset Contract) client for token operations
  const sac = new SACClient({
    rpcUrl: config.rpcUrl,
    networkPassphrase: config.networkPassphrase,
  });

  // Get SAC client for native XLM operations
  const native = sac.getSACClient(config.nativeContractId);

  return {
    // Core clients
    rpc,
    account,
    server,
    
    // Utilities
    mockPubkey,
    mockSource,
    
    // Funding utilities (testnet only)
    fundKeypair,
    getFundPubkey,
    getFundSigner,
    
    // Token clients
    native,
    sac,
  };
};

export type StellarClients = ReturnType<typeof createStellarClients>;