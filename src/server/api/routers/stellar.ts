import { createTRPCRouter } from "~/server/api/trpc";
import { publicProcedure } from "~/server/api/trpc";
import { z } from "zod";
import { Sep10 } from "~/server/services/Sep10";
import { createSmartContractClient, handleHorizonServerError } from "~/lib/utils";
import { account, server } from "~/lib/utils";
import { Asset, rpc, contract, Address, xdr, Soroban, Transaction, TransactionBuilder, Networks, nativeToScVal, scValToNative, Contract, Account } from "@stellar/stellar-sdk";

import { SAC_FUNCTIONS } from "~/lib/constants/sac";
import { ContractMetadata, decodeBuffer, getContractMetadata } from "~/lib/getContractMetadat";
import { env } from "~/env";
import { addressToScVal, u32ToScVal, u128ToScVal, boolToScVal, numberToU64, numberToI128, stringToSymbol, } from "~/lib/scHelper";
import { Client } from "@stellar/stellar-sdk/minimal/contract";

const USDC = "USDC-GBBD47IF6LWK7P7MDEVSCWR7DPUWV3NY3DTQEVFL4NAT4AQH3ZLLFLA5";
const EURC = "EURC-GB3Q6QDZYTHWT7E5PVS3W7FUT5GVAFC5KSZFFLPU25GO7VTC3NM2ZTVO";



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
        console.log('input to submitXDR:', input.xdr);

        // SImulate
        const sorobanServer = new rpc.Server("https://soroban-testnet.stellar.org");
        const sim = await sorobanServer.simulateTransaction(TransactionBuilder.fromXDR(input.xdr, Networks.TESTNET));
        console.log('sim:', sim);
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
        console.log('input to getContractMetadata:', input.contractAddress);



        const wasmContractMetadata = await getContractMetadata(input.contractAddress);
        return wasmContractMetadata;
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
      return Object.fromEntries(balances.map(({ key, balance }) => [key, balance]));
    }),
  prepareContractCall: publicProcedure
    .input(
      z.object({
        contractAddress: z.string(),
        method: z.string(),
        args: z.array(z.any()),
        isReadOnly: z.boolean().optional(),
        walletContractId: z.string(),
      }),
    )
    .mutation(async ({ input }) => {
      try {
        console.log('input to prepareContractCall:', {
          contractAddress: input.contractAddress,
          method: input.method,
          argsCount: input.args.length,
          isReadOnly: input.isReadOnly
        });


        // For regular smart contracts
        const method = input.method;
        const args = input.args;

        // Map the args to ScVal
        const { functions, contractAddress } = await getContractMetadata(input.contractAddress);
        console.log('functions:', functions);
        const fn = functions.find(f => f.name === method);
        if (!fn) {
          throw new Error(`Function ${method} not found in contract`);
        }
        console.log('contractAddress:', contractAddress);
        console.log('args:', args);
        const scValArgs = fn.parameters.map((param, index) => {
          const arg = args[index];
          console.log('arg:', arg, param.type);
          switch (param.type) {
            case 'address':
            case 'optional<address>':
              if (arg) {
                return addressToScVal(arg);
              }
              break;
            case 'optional<u32>':
            case 'u32':
              if (arg) {
                return u32ToScVal(arg);
              }
              break;
            case 'optional<u128>':
            case 'u128':
              if (arg) {
                return u128ToScVal(arg);
              }
              break;
            case 'optional<bool>':
            case 'bool':
              if (arg) {
                return boolToScVal(arg);
              }
              break;
            case 'optional<u64>':
            case 'u64':
              if (arg) {
                return numberToU64(arg);
              }
              break;
            case 'optional<i128>':
            case 'i128':
              if (arg) {
                return numberToI128(arg);
              }
              break;
            case 'optional<symbol>':
            case 'symbol':
              if (arg) {
                return stringToSymbol(arg);
              }
              break;
            default:
              if (arg) {
                return nativeToScVal(arg, { type: param.type });
              }
              break;
          }
          return undefined;
        });
        const functionMetadata = functions.find(f => f.name === method);
        if (!functionMetadata) {
          throw new Error(`Function ${method} not found in contract`);
        }
        const params: Record<string, xdr.ScVal> = {};
        functionMetadata.parameters.forEach((p, i) => {
          params[p.name] = scValArgs[i] as xdr.ScVal;
        });
        const contractClient = await createSmartContractClient(input.contractAddress);



        const functionToCall = contractClient[method as keyof Client];
        // @ts-ignore 
        const result = await functionToCall(params);
        const txXdr = result.toXDR();

        // const sorobanServer = new rpc.Server("https://soroban-testnet.stellar.org");
        // const preparedTx = await sorobanServer.prepareTransaction(TransactionBuilder.fromXDR(txXdr, Networks.TESTNET));
        return {
          xdr: txXdr,
          simulation: 'success'
        };

        // const networkPassphrase = Networks.TESTNET;
        // const account = await sorobanServer.getAccount('GAIH3ULLFQ4DGSECF2AR555KZ4KNDGEKN4AFI4SU2M7B43MGK3QJZNSR')
        // if (input.isReadOnly) {
        // For read-only functions, we can just simulate
        // This generates a transaction that won't be submitted

        // const transaction = new TransactionBuilder(account, {
        //   fee: "100",
        //   networkPassphrase,
        // })
        //   .addOperation(contractInstance.call(method, ...args))
        //   .setTimeout(30)
        //   .build();

        // // Get transaction simulation to ensure the operation is valid
        // // and also to obtain the proper fee
        // const prepareTx = await sorobanServer.prepareTransaction(transaction);
        // txXdr = prepareTx.toXDR();
        // } else {
        // console.log('method:', method);
        // console.log('contractAddress:', contractAddress);
        // console.log('scValArgs:', scValArgs);

        // transaction = new TransactionBuilder(account, {
        //   fee: "100",
        //   networkPassphrase,
        // })
        //   .addOperation(contractInstance.call(method, ...scValArgs))
        //   .setTimeout(30)
        //   .build();
        // console.log('transaction:', transaction);
        // const transaction = await contractClient.(method, ...scValArgs);

        // // Get transaction simulation to ensure the operation is valid
        // // and also to obtain the proper fee
        // const prepareTx = await sorobanServer.prepareTransaction(transaction);
        // txXdr = prepareTx.toXDR();
        // }

        // Return the XDR for the transaction
        return {
          xdr: txXdr,
          simulation: "success", // Placeholder for actual simulation result
        };
      } catch (e) {
        console.error("Error preparing contract call:", e);
        handleHorizonServerError(e);
      }
    }),

  queryContract: publicProcedure
    .input(
      z.object({
        contractAddress: z.string(),
        method: z.string(),
        args: z.record(z.string(), z.any()).optional(),
      }),
    )
    .mutation(async ({ input }) => {
      try {
        console.log('input to queryContract:', {
          contractAddress: input.contractAddress,
          method: input.method,
        });

        // For SAC tokens, special handling
        if (input.contractAddress === 'native' || input.contractAddress.includes('-')) {
          // Mock responses for standard token methods
          if (input.method === 'balance') {
            return { value: "1000000000" };
          } else if (input.method === 'allowance') {
            return { value: "500000000" };
          } else if (input.method === 'decimals') {
            return { value: 7 };
          } else if (input.method === 'name') {
            return { value: input.contractAddress === 'native' ? "Native XLM" : input.contractAddress.split('-')[0] };
          } else if (input.method === 'symbol') {
            return { value: input.contractAddress === 'native' ? "XLM" : input.contractAddress.split('-')[0] };
          }
        }

        // For regular contracts, invoke the contract method
        const sorobanServer = new rpc.Server("https://soroban-testnet.stellar.org");
        const networkPassphrase = Networks.TESTNET;
        const contractClient = await contract.Client.from({
          contractId: input.contractAddress,
          networkPassphrase,
          rpcUrl: 'https://soroban-testnet.stellar.org'
        });

        // Convert the args object to an array of scvs in the order defined by the function
        const scValArgs: xdr.ScVal[] = [];

        // Find the function's parameter definitions
        const fn = contractClient.spec.funcs().find(
          (f: xdr.ScSpecFunctionV0) => decodeBuffer(f.name()) === input.method
        );

        if (!fn) {
          throw new Error(`Function ${input.method} not found in contract`);
        }

        // Add args in the correct order based on function definition
        if (input.args && fn.inputs().length > 0) {
          for (const param of fn.inputs()) {
            const paramName = decodeBuffer(param.name());
            if (input.args[paramName] !== undefined) {
              // Convert value to appropriate ScVal based on type
              const value = input.args[paramName];
              // Note: here we would normally convert to ScVal based on type
              // For simplicity, we'll use a placeholder
              scValArgs.push(xdr.ScVal.scvString(value.toString()));
            }
          }
        }

        // Simulate the contract call to get the result
        // @ts-ignore 
        const result = await contractClient.simulate(input.method, ...scValArgs);

        // Process the ScVal result to a more user-friendly format
        // This is a simple example, you would want to handle different types properly
        let processedResult: any;

        if (result.result) {
          const resultType = result.result.switch().name;

          if (resultType === 'scvString') {
            processedResult = { value: result.result.str().toString() };
          } else if (resultType === 'scvU32') {
            processedResult = { value: result.result.u32() };
          } else if (resultType === 'scvI32') {
            processedResult = { value: result.result.i32() };
          } else if (resultType === 'scvU64' || resultType === 'scvI64') {
            processedResult = { value: result.result.i64().toString() };
          } else if (resultType === 'scvU128' || resultType === 'scvI128') {
            processedResult = { value: result.result.i128().toString() };
          } else if (resultType === 'scvBool') {
            processedResult = { value: result.result.b() };
          } else {
            // For other types, return a string representation
            processedResult = { value: result.result.toXDR('base64') };
          }
        } else {
          processedResult = { value: null };
        }

        return processedResult;
      } catch (e) {
        console.error("Error querying contract:", e);
        handleHorizonServerError(e);
      }
    }),
});
