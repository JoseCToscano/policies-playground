import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import { PasskeyKit, SACClient, PasskeyServer } from "passkey-kit";
import { Server } from "@stellar/stellar-sdk/minimal/rpc";
import { env } from "~/env";
import { StrKey, Keypair, Account, contract } from "@stellar/stellar-sdk/minimal";
import { basicNodeSigner, Client } from "@stellar/stellar-sdk/minimal/contract";
import toast from "react-hot-toast";
import { TRPCClientErrorLike } from "@trpc/client";
import { AnyClientTypes, TRPCError } from "@trpc/server/unstable-core-do-not-import";
import { Address, Asset, Horizon, Networks } from "@stellar/stellar-sdk";
import { type AxiosError } from "axios";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function copyToClipboard(text?: string, silent?: boolean) {
  if (!text) return;
  navigator.clipboard.writeText(text).then(() => {
    if (!silent) toast.success('Copied to clipboard');
  }).catch(() => {
    if (!silent) toast.error('Failed to copy to clipboard');
  });
}

export function fromStroops(amount: number | string | null, decimals: number = 7): string {
  if (!amount) return '0';
  return (Number(amount) / 10_000_000).toFixed(decimals);
}

export function toStroops(amount: number) {
  return amount * 10_000_000;
}

export function shortAddress(address?: string | null) {
  if (!address) return '';
  return address.slice(0, 4) + '...' + address.slice(-4);
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

export function ClientTRPCErrorHandler<T extends AnyClientTypes>(
  x?: TRPCClientErrorLike<T>,
) {
  if (x?.message) {
    toast.error(x?.message);
  } else if ((x?.data as { code: string })?.code === "INTERNAL_SERVER_ERROR") {
    toast.error("We are facing some issues. Please try again later");
  } else if ((x?.data as { code: string })?.code === "BAD_REQUEST") {
    toast.error("Invalid request. Please try again later");
  } else if ((x?.data as { code: string })?.code === "UNAUTHORIZED") {
    toast.error("Unauthorized request. Please try again later");
  } else if (x?.message) {
    toast.error(x?.message);
  } else {
    toast.error("We are facing some issues! Please try again later");
  }
}

export function handleHorizonServerError(error: unknown) {
  console.log("hi:)", error);
  let message = "Failed to send transaction to blockchain";
  const axiosError = error as AxiosError<Horizon.HorizonApi.ErrorResponseData>;
  if (
    typeof (axiosError?.response as { detail?: string })?.detail === "string"
  ) {
    message = (axiosError?.response as { detail?: string })?.detail ?? message;
  } else if (axiosError?.response?.data) {
    switch (axiosError.response.data.title) {
      case "Rate Limit Exceeded":
        message = "Rate limit exceeded. Please try again in a few seconds";
        break;
      case "Internal Server Error":
        message = "We are facing some issues. Please try again later";
        break;
      case "Transaction Failed":
        message = "Transaction failed";
        const txError = parsedTransactionFailedError(axiosError.response.data);
        if (txError) {
          message = `Transaction failed: ${txError}`;
        }
        break;
      default:
        message = "Failed to send transaction to blockchain";
        break;
    }
  }
  console.log(message);
  throw new TRPCError({
    code: "INTERNAL_SERVER_ERROR",
    message,
  });
}
function parsedTransactionFailedError(
  failedTXError?: Horizon.HorizonApi.ErrorResponseData.TransactionFailed,
) {
  console.log("failedTXError", failedTXError);
  if (!failedTXError) return;
  const { extras } = failedTXError;
  let message = "Unknown error";
  if (!extras) {
    return message;
  }
  if (
    extras.result_codes.transaction ===
    Horizon.HorizonApi.TransactionFailedResultCodes.TX_BAD_AUTH
  ) {
    message = "Invalid transaction signature";
  } else if (
    extras.result_codes.transaction ===
    Horizon.HorizonApi.TransactionFailedResultCodes.TX_TOO_LATE
  ) {
    message = "Transaction expired. Please try again";
  } else if (
    extras.result_codes.transaction ===
    Horizon.HorizonApi.TransactionFailedResultCodes.TX_NO_SOURCE_ACCOUNT
  ) {
    message = "Source account does not exist";
  } else if (
    extras.result_codes.operations?.includes(
      Horizon.HorizonApi.TransactionFailedResultCodes.TX_FAILED,
    )
  ) {
    message = "One of the operations failed (none were applied)";
  } else if (extras.result_codes.operations?.includes("op_no_issuer")) {
    message = "The issuer account does not exist. ¿Has network been restored?";
  } else if (
    extras.result_codes.operations?.includes(
      Horizon.HorizonApi.TransactionFailedResultCodes.TX_TOO_EARLY,
    )
  ) {
    message = "The ledger closeTime was before the minTime";
  } else if (
    extras.result_codes.operations?.includes(
      Horizon.HorizonApi.TransactionFailedResultCodes.TX_TOO_LATE,
    )
  ) {
    message = "The ledger closeTime was after the maxTime";
  } else if (
    extras.result_codes.operations?.includes(
      Horizon.HorizonApi.TransactionFailedResultCodes.TX_MISSING_OPERATION,
    )
  ) {
    message = "No operation was specified";
  } else if (
    extras.result_codes.operations?.includes(
      Horizon.HorizonApi.TransactionFailedResultCodes.TX_BAD_SEQ,
    )
  ) {
    message = "The sequence number does not match source account";
  } else if (
    extras.result_codes.transaction ===
    Horizon.HorizonApi.TransactionFailedResultCodes.TX_BAD_SEQ
  ) {
    message = "The sequence number does not match source account";
  } else if (
    extras.result_codes.operations?.includes(
      Horizon.HorizonApi.TransactionFailedResultCodes.TX_BAD_AUTH,
    )
  ) {
    message =
      "Check if you have the required permissions and signatures for this Network";
  } else if (
    extras.result_codes.operations?.includes(
      Horizon.HorizonApi.TransactionFailedResultCodes.TX_INSUFFICIENT_BALANCE,
    )
  ) {
    message = "You don't have enough balance to perform this operation";
  } else if (
    extras.result_codes.operations?.includes(
      Horizon.HorizonApi.TransactionFailedResultCodes.TX_NO_SOURCE_ACCOUNT,
    )
  ) {
    message = "The source account does not exist";
  } else if (
    extras.result_codes.operations?.includes(
      Horizon.HorizonApi.TransactionFailedResultCodes.TX_BAD_AUTH_EXTRA,
    )
  ) {
    message = "There are unused signatures attached to the transaction";
  } else if (
    extras.result_codes.operations?.includes(
      Horizon.HorizonApi.TransactionFailedResultCodes.TX_INSUFFICIENT_FEE,
    )
  ) {
    message = "The fee is insufficient for the transaction";
  } else if (
    extras.result_codes.operations?.includes(
      Horizon.HorizonApi.TransactionFailedResultCodes.TX_INTERNAL_ERROR,
    )
  ) {
    message = "An unknown error occurred while processing the transaction";
  } else if (
    extras.result_codes.operations?.includes(
      Horizon.HorizonApi.TransactionFailedResultCodes.TX_NOT_SUPPORTED,
    )
  ) {
    message = "The operation is not supported by the network";
  } else if (extras.result_codes.operations?.includes("op_buy_no_trust")) {
    message = "You need to establish trustline first";
  } else if (extras.result_codes.operations?.includes("op_low_reserve")) {
    message = "You don't have enough XLM to create the offer";
  } else if (extras.result_codes.operations?.includes("op_bad_auth")) {
    message =
      "There are missing valid signatures, or the transaction was submitted to the wrong network";
  } else if (extras.result_codes.operations?.includes("op_no_source_account")) {
    message = "There is no source account";
  } else if (extras.result_codes.operations?.includes("op_not_supported")) {
    message = "The operation is not supported by the network";
  } else if (
    extras.result_codes.operations?.includes("op_too_many_subentries")
  ) {
    message = "Max number of subentries (1000) already reached";
  }
  return message;
}

export const createSmartContractClient = async (contractAddress: string): Promise<Client> => {
  if (contractAddress === 'native' || contractAddress === env.NEXT_PUBLIC_NATIVE_CONTRACT_ID) {
    return new SACClient({
      rpcUrl: env.NEXT_PUBLIC_RPC_URL,
      networkPassphrase: env.NEXT_PUBLIC_NETWORK_PASSPHRASE,
    }).getSACClient(env.NEXT_PUBLIC_NATIVE_CONTRACT_ID);
  } else if (contractAddress.includes('-')) {
    const [code, issuer] = contractAddress.split('-');
    if (!code || !issuer) {
      throw new Error("Invalid Asset Contract address format");
    }
    const asset = new Asset(code, issuer);
    const contractId = await asset.contractId(Networks.TESTNET);
    return new SACClient({
      rpcUrl: env.NEXT_PUBLIC_RPC_URL,
      networkPassphrase: env.NEXT_PUBLIC_NETWORK_PASSPHRASE,
    }).getSACClient(contractId);
  }

  const contractClient = await contract.Client.from({
    contractId: contractAddress,
    networkPassphrase: env.NEXT_PUBLIC_NETWORK_PASSPHRASE,
    rpcUrl: env.NEXT_PUBLIC_RPC_URL,
  })

  return new Client(contractClient.spec, {
    contractId: contractAddress,
    networkPassphrase: env.NEXT_PUBLIC_NETWORK_PASSPHRASE,
    rpcUrl: env.NEXT_PUBLIC_RPC_URL,
  });
}

export function bigIntReplacer(_key: string, value: any): any {
  return typeof value === 'bigint' ? value.toString() : value;
}