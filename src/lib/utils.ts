import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import { PasskeyKit, SACClient, PasskeyServer} from "passkey-kit";
import { Server } from "@stellar/stellar-sdk/minimal/rpc";
import { env } from "~/env";
import { StrKey, Keypair, Account } from "@stellar/stellar-sdk/minimal";
import { basicNodeSigner } from "@stellar/stellar-sdk/minimal/contract";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export const rpc = new Server(env.NEXT_PUBLIC_RPC_URL);

export const account = new PasskeyKit({
  rpcUrl: env.NEXT_PUBLIC_RPC_URL,
  networkPassphrase: env.NEXT_PUBLIC_NETWORK_PASSPHRASE,
  walletWasmHash: env.NEXT_PUBLIC_WALLET_WASM_HASH,
});

export const server = new PasskeyServer({
  rpcUrl: env.NEXT_PUBLIC_RPC_URL,
  launchtubeUrl: env.NEXT_PUBLIC_LAUNCHTUBE_URL,
  launchtubeJwt: env.NEXT_PUBLIC_LAUNCHTUBE_JWT,
  mercuryProjectName: env.NEXT_PUBLIC_MERCURY_PROJECT_NAME,
  mercuryUrl: env.NEXT_PUBLIC_MERCURY_URL,
  mercuryJwt: env.NEXT_PUBLIC_MERCURY_JWT,
});

export const mockPubkey = StrKey.encodeEd25519PublicKey(Buffer.alloc(32))
export const mockSource = new Account(mockPubkey, '0')

export const fundKeypair = new Promise<Keypair>(async (resolve) => {
    const now = new Date();

    now.setMinutes(0, 0, 0);

    const nowData = new TextEncoder().encode(now.getTime().toString());
    const hashBuffer = await crypto.subtle.digest('SHA-256', nowData);
    const keypair = Keypair.fromRawEd25519Seed(Buffer.from(hashBuffer))
    const publicKey = keypair.publicKey()

    rpc.getAccount(publicKey)
        .catch(() => rpc.requestAirdrop(publicKey))
        .catch(() => { })

    resolve(keypair)
})
export const fundPubkey = (await fundKeypair).publicKey()
export const fundSigner = basicNodeSigner(await fundKeypair, env.NEXT_PUBLIC_NETWORK_PASSPHRASE)


export const sac = new SACClient({
    rpcUrl: env.NEXT_PUBLIC_RPC_URL,
    networkPassphrase: env.NEXT_PUBLIC_NETWORK_PASSPHRASE,
});
export const native = sac.getSACClient(env.NEXT_PUBLIC_NATIVE_CONTRACT_ID)
