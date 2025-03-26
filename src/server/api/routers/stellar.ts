import { createTRPCRouter } from "~/server/api/trpc";
import { publicProcedure } from "~/server/api/trpc";
import { z } from "zod";
import { Sep10 } from "~/server/services/Sep10";
import { handleHorizonServerError } from "~/lib/utils";
import { account, server } from "~/lib/utils";
import { Asset, rpc, contract, Address, xdr, Soroban } from "@stellar/stellar-sdk";

const USDC = "USDC-GBBD47IF6LWK7P7MDEVSCWR7DPUWV3NY3DTQEVFL4NAT4AQH3ZLLFLA5";
const EURC = "EURC-GB3Q6QDZYTHWT7E5PVS3W7FUT5GVAFC5KSZFFLPU25GO7VTC3NM2ZTVO";

// Contract function parameter type
interface ContractFunctionParam {
  name: string;
  type: string;
}

// Contract function type
interface ContractFunction {
  name: string;
  parameters: ContractFunctionParam[];
}

// Contract metadata type
interface ContractMetadata {
  name?: string;
  symbol?: string;
  decimals?: number;
  totalSupply?: string;
  version?: string;
  functions: ContractFunction[];
}

export const stellarRouter = createTRPCRouter({
  getAuthChallenge: publicProcedure
    .input(
      z.object({
        publicKey: z.string(),
      }),
    )
    .mutation(async ({ input }) => {
      const sep10 = new Sep10("testanchor.stellar.org");
      // TODO
      console.log(`Generating challenge transaction for ${input.publicKey}`);
      return sep10.getChallengeTransaction(input.publicKey);
    }),
  getAuthToken: publicProcedure
    .input(
      z.object({
        xdr: z.string(),
      }),
    )
    .mutation(async ({ input }) => {
      console.log('input to getAuthToken:', input.xdr);
      const sep10 = new Sep10("testanchor.stellar.org");
      console.log('before submitChallengeTransaction');
      const token = await sep10.submitChallengeTransaction(input.xdr);
      console.log('token:', token);
      return token;
    }),
  submitXDR: publicProcedure
    .input(z.object({ xdr: z.string() }))
    .mutation(async ({ input }) => {
      try {
        const result = (await server.send(input.xdr)) as never;
        return {
          success: true,
          result,
        };
      } catch (e) {
        // This will throw a TRPCError with the appropriate message
        handleHorizonServerError(e);
      }
    }),
  getContractMetadata: publicProcedure
    .input(z.object({
      contractAddress: z.string(),
    }))
    .query(async ({ input }) => {
      try {
        const sorobanServer = new rpc.Server("https://soroban-testnet.stellar.org", { allowHttp: true });

        // Get contract spec/interface
        const contractClient = await contract.Client.from({
          contractId: input.contractAddress,
          networkPassphrase: 'Test SDF Network ; September 2015',
          rpcUrl: 'https://soroban-testnet.stellar.org'
        });
        // Parse contract functions from spec
        const functions = contractClient.spec.funcs().map((fn: xdr.ScSpecFunctionV0) => ({
          name: fn.name(),
          parameters: fn.inputs().map((param: xdr.ScSpecFunctionInputV0) => ({
            name: param.name(),
            type: param.type()
          }))
        }));

        console.log('functions:', functions);
        console.log('contractClient:', contractClient);
        console.log('contractClient.spec:', contractClient.spec);

        const metadata: ContractMetadata = {
          name: "test",
          symbol: "test",
          decimals: 0,
          totalSupply: "0",
          version: "0",
          functions: []
        };
        return metadata;
      } catch (e) {
        console.error("Error fetching contract metadata:", e);
        throw new Error("Failed to fetch contract metadata");
      }
    }),
  getContractBalance: publicProcedure
    .input(z.object({ contractAddress: z.string() }))
    .query(async ({ input }) => {
      console.log('input to getContractBalance:', input.contractAddress);
      const sorobanServer = new rpc.Server("https://soroban-testnet.stellar.org");
      const passphrase = "Test SDF Network ; September 2015";
      const indexedSAC = [
        new Asset("USDC", "GBBD47IF6LWK7P7MDEVSCWR7DPUWV3NY3DTQEVFL4NAT4AQH3ZLLFLA5"),
        new Asset("EURC", "GB3Q6QDZYTHWT7E5PVS3W7FUT5GVAFC5KSZFFLPU25GO7VTC3NM2ZTVO")
      ];

      const balancePromises = indexedSAC.map(async sac => {
        const balance = await sorobanServer.getSACBalance(input.contractAddress, sac, passphrase);
        return {
          key: `${sac.code}-${sac.issuer}`,
          balance: balance?.balanceEntry?.amount || "0"
        };
      });

      const balances = await Promise.all(balancePromises);
      console.log('balances:', balances);
      return Object.fromEntries(balances.map(({ key, balance }) => [key, balance]));
    }),
});
