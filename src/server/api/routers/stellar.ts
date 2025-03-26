import { createTRPCRouter } from "~/server/api/trpc";
import { publicProcedure } from "~/server/api/trpc";
import { z } from "zod";
import { Sep10 } from "~/server/services/Sep10";
import { handleHorizonServerError } from "~/lib/utils";
import { account, server } from "~/lib/utils";
import { Asset, rpc, contract, Address, xdr, Soroban, Transaction, TransactionBuilder, Networks } from "@stellar/stellar-sdk";
import { ContractFunction, ContractFunctionParam } from "~/types/contracts";
import { SAC_FUNCTIONS } from "~/lib/constants/sac";

// Helper function to decode Buffer to string
const decodeBuffer = (buf: Buffer | string): string => {
  if (Buffer.isBuffer(buf)) {
    return buf.toString('utf8');
  }
  return String(buf);
};

const USDC = "USDC-GBBD47IF6LWK7P7MDEVSCWR7DPUWV3NY3DTQEVFL4NAT4AQH3ZLLFLA5";
const EURC = "EURC-GB3Q6QDZYTHWT7E5PVS3W7FUT5GVAFC5KSZFFLPU25GO7VTC3NM2ZTVO";

// Helper to find UDT definitions in the contract spec
function findUdtDefinition(spec: any, typeName: string) {
  return spec.entries.find((entry: ContractEntry) =>
    entry._arm === 'udtStructV0' && decodeBuffer(entry._value.name()) === typeName
  )
}

// Helper to parse UDT fields from its definition
function parseUdtFields(udtDef: any, spec: any) {
  if (!udtDef?._value?.fields) return null;


  const fields = udtDef._value?.fields()?.map((field: any) => {
    return ({
      name: decodeBuffer(field.name()),
      type: parseXdrType(field.type(), spec),
      // Include the documentation if available
      doc: field.doc ? decodeBuffer(field.doc()) : undefined
    })
  });
  return fields;
}

// Modified parseXdrType to include contract spec
function parseXdrType(type: xdr.ScSpecTypeDef, contractSpec?: any): string {
  const typeName = type.switch().name;
  // Handle vector types recursively
  if (typeName === 'scSpecTypeVec') {
    const elementType = type.vec().elementType();
    return `vec<${parseXdrType(elementType, contractSpec)}>`;
  }

  // Handle UDT case
  if (typeName === 'scSpecTypeUdt') {
    const udtName = type.udt().name().toString('utf8');

    if (contractSpec) {
      const udtDef = findUdtDefinition(contractSpec, udtName);
      if (udtDef) {
        const fields = parseUdtFields(udtDef, contractSpec);
        if (fields) {
          const fieldsStr = fields
            .map((f: ParsedField) => {
              return `${f.name}: ${f.type}`;
            })
            .join(', ');
          return `${udtName}{${fieldsStr}}`;
        }
      }
    }

    return udtName;
  }

  // Rest of the type mapping remains the same
  switch (typeName) {
    case 'scSpecTypeU32':
      return 'u32';
    case 'scSpecTypeI32':
      return 'i32';
    case 'scSpecTypeU64':
      return 'u64';
    case 'scSpecTypeI64':
      return 'i64';
    case 'scSpecTypeTimepoint':
      return 'timepoint';
    case 'scSpecTypeU128':
      return 'u128';
    case 'scSpecTypeI128':
      return 'i128';
    case 'scSpecTypeU256':
      return 'u256';
    case 'scSpecTypeI256':
      return 'i256';
    case 'scSpecTypeBytes':
      return 'bytes';
    case 'scSpecTypeString':
      return 'string';
    case 'scSpecTypeBool':
      return 'bool';
    case 'scSpecTypeVoid':
      return 'void';
    case 'scSpecTypeSymbol':
      return 'symbol';
    case 'scSpecTypeAddress':
      return 'address';
    case 'scSpecTypeMap':
      const keyType = parseXdrType(type.map().keyType(), contractSpec);
      const valueType = parseXdrType(type.map().valueType(), contractSpec);
      return `map<${keyType},${valueType}>`;
    case 'scSpecTypeTuple':
      const valueTypes = type.tuple().valueTypes().map((value) => parseXdrType(value, contractSpec));
      return `tuple<${valueTypes.join(',')}>`;
    case 'scSpecTypeResult':
      const okType = type.result().okType() ? parseXdrType(type.result().okType(), contractSpec) : 'void';
      const errorType = type.result().errorType() ? parseXdrType(type.result().errorType(), contractSpec) : 'void';
      return `result<${okType},${errorType}>`;
    default:
      return typeName.replace('scSpecType', '').toLowerCase();
  }
}

// Add these interfaces at the top with the other interfaces
interface EnumVariant {
  name: string;
  value: number;
  doc?: string;
}

interface ContractEnum {
  name: string;
  variants: EnumVariant[];
  doc?: string;
  isErrorEnum: boolean;
}

interface ContractEntry {
  _arm: string;
  _value: {
    name: () => Buffer;
    doc?: () => Buffer;
    fields?: () => any[];
    cases?: () => any[];
  };
}

interface ParsedField {
  name: string;
  type: string;
  doc?: string;
}

// Helper function to parse enums
function parseEnums(spec: any): ContractEnum[] {
  const enums = spec.entries
    .filter((entry: ContractEntry) =>
      // Look for both regular and error enums
      entry._arm === 'udtEnumV0' || entry._arm === 'udtErrorEnumV0'
    )
    .map((entry: ContractEntry) => {
      const name = decodeBuffer(entry._value.name());
      const doc = entry._value.doc ? decodeBuffer(entry._value.doc()) : undefined;

      const variants = entry._value.cases?.().map((variant: any) => ({
        name: decodeBuffer(variant.name()),
        value: variant.value(),
        doc: variant.doc ? decodeBuffer(variant.doc()) : undefined
      })) || [];

      // For the RequestType enum, the values should be 0 through 9
      // matching the Rust enum definition
      return {
        name,
        doc,
        variants,
        isErrorEnum: entry._arm === 'udtErrorEnumV0'  // Add flag to distinguish enum types
      };
    });

  return enums;
}

interface UnionCase {
  name: string;
  type?: string;  // The type this variant holds
  doc?: string;
}

interface ContractUnion {
  name: string;
  cases: UnionCase[];
  doc?: string;
}

// Helper function to parse unions
function parseUnions(spec: any): ContractUnion[] {
  const unions = spec.entries
    .filter((entry: ContractEntry) => entry._arm === 'udtUnionV0')
    .map((entry: ContractEntry) => {
      const name = decodeBuffer(entry._value.name());
      const doc = entry._value.doc ? decodeBuffer(entry._value.doc()) : undefined;


      const cases = entry._value.cases?.().map((unionCase: any) => {
        // Each case is a ChildUnion with _switch.name indicating the type
        const caseType = unionCase._switch.name;
        const caseName = decodeBuffer(unionCase._value._attributes.name);
        let type: string | undefined;

        // Handle different case types
        if (caseType === 'scSpecUdtUnionCaseTupleV0') {
          // For tuple cases, we need to parse the tuple types
          const tupleTypes = unionCase._value._attributes.types?.map((t: any) =>
            parseXdrType(t, spec)
          );
          type = tupleTypes ? `tuple<${tupleTypes.join(',')}>` : undefined;
        }
        // Add other case types as needed (void, value, etc.)

        return {
          name: caseName,
          type,
          doc: unionCase._value._attributes.doc ?
            decodeBuffer(unionCase._value._attributes.doc) :
            undefined
        };
      }) || [];

      return {
        name,
        doc,
        cases
      };
    });

  return unions;
}

// Modify the ContractMetadata interface to include enums and unions
interface ContractMetadata {
  name?: string;
  symbol?: string;
  decimals?: number;
  totalSupply?: string;
  version?: string;
  functions: ContractFunction[];
  enums?: ContractEnum[];
  unions?: ContractUnion[];
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
        console.log('input to getContractMetadata:', input.contractAddress);

        // Check if this is native XLM
        if (input.contractAddress === 'native') {
          // For native XLM, we use the standard SAC interface
          const metadata: ContractMetadata = {
            name: "Native",
            symbol: "XLM",
            decimals: 7,
            totalSupply: "0",
            version: "1",
            functions: SAC_FUNCTIONS
          };
          return metadata;
        }

        // Check if this is an Asset Contract
        const isAssetContract = input.contractAddress.includes('-');
        if (isAssetContract) {
          const [code, issuer] = input.contractAddress.split('-');
          if (!code || !issuer) {
            throw new Error("Invalid Asset Contract address format");
          }
          const asset = new Asset(code, issuer);
          const sorobanServer = new rpc.Server("https://soroban-testnet.stellar.org");
          const passphrase = "Test SDF Network ; September 2015";

          // Get the Stellar Asset Contract ID
          const contractId = await asset.contractId(passphrase);

          // For Asset Contracts, we use the standard interface
          const metadata: ContractMetadata = {
            name: code,
            symbol: code,
            decimals: 7, // Standard for Stellar assets
            totalSupply: "0", // We could fetch this if needed
            version: "1",
            functions: SAC_FUNCTIONS
          };

          return metadata;
        }

        // If not an Asset Contract, proceed with normal contract metadata fetching
        const contractClient = await contract.Client.from({
          contractId: input.contractAddress,
          networkPassphrase: 'Test SDF Network ; September 2015',
          rpcUrl: 'https://soroban-testnet.stellar.org'
        }).catch((e) => {
          console.error("Error fetching contract metadata:", e);
          throw new Error("Failed to fetch contract metadata");
        });

        contractClient.spec.entries.forEach((entry: ContractEntry) => {
          if (true || entry._arm === 'udtStructV0') {
            console.log('struct:', decodeBuffer(entry._value.name()))
          }
        })

        // Parse contract functions from spec
        const functions = contractClient.spec.funcs().map((fn: xdr.ScSpecFunctionV0) => {
          // Get function name
          const name = decodeBuffer(fn.name());

          // Parse parameters
          const parameters = fn.inputs().map((param: xdr.ScSpecFunctionInputV0, i) => {
            return ({
              name: decodeBuffer(param.name()),
              type: parseXdrType(param.type(), contractClient.spec)
            })
          });



          console.log(`Function: ${name}`);
          console.log('Parameters:', parameters);
          console.log('---');

          return {
            name,
            parameters,
          };
        });

        // Parse enums from spec
        const enums = parseEnums(contractClient.spec);
        console.log('Contract enums:', enums);

        // Parse unions from spec
        const unions = parseUnions(contractClient.spec);
        console.log('Contract unions:', unions);

        // Sort functions alphabetically
        functions.sort((a, b) => a.name.localeCompare(b.name));

        const metadata: ContractMetadata = {
          functions,
          enums,
          unions
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
      return Object.fromEntries(balances.map(({ key, balance }) => [key, balance]));
    }),
  prepareContractCall: publicProcedure
    .input(
      z.object({
        contractAddress: z.string(),
        method: z.string(),
        args: z.array(z.any()),
        isReadOnly: z.boolean().optional(),
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

        // If this is a native asset (XLM) or a Stellar Asset Contract (token)
        if (input.contractAddress === 'native' || input.contractAddress.includes('-')) {
          // For native XLM or Stellar Asset Contract, handle with special case
          // (This is just placeholder - you would implement actual XLM/SAC handling)
          if (input.contractAddress === 'native') {
            console.log('Preparing native XLM transaction');
            // Handle native XLM (special case)
          } else {
            console.log('Preparing Stellar Asset Contract transaction');
            const [code, issuer] = input.contractAddress.split('-');
            // Handle Stellar Asset Contract
          }
        }

        // For regular smart contracts
        const contractId = input.contractAddress;
        const method = input.method;
        const args = input.args;

        // Create a transaction for the contract call
        const source = account;
        let transaction: Transaction;

        const sorobanServer = new rpc.Server("https://soroban-testnet.stellar.org");
        const networkPassphrase = Networks.TESTNET;

        if (input.isReadOnly) {
          // For read-only functions, we can just simulate
          // This generates a transaction that won't be submitted
          const contract = new contract.Contract(contractId);
          transaction = new TransactionBuilder(source, {
            fee: "100",
            networkPassphrase,
          })
            .addOperation(contract.call(method, ...args))
            .setTimeout(30)
            .build();
        } else {
          // For write functions, prepare a real transaction
          const contract = new contract.Contract(contractId);
          transaction = new TransactionBuilder(source, {
            fee: "100",
            networkPassphrase,
          })
            .addOperation(contract.call(method, ...args))
            .setTimeout(30)
            .build();

          // Get transaction simulation to ensure the operation is valid
          // and also to obtain the proper fee
          const simulation = await sorobanServer.simulateTransaction(transaction);

          if (simulation.status === "ERROR") {
            throw new Error(`Simulation error: ${simulation.error}`);
          }

          // Apply the recommended fee and create the final transaction
          const estimatedFee = parseInt(simulation.minResourceFee) + 100;
          transaction = new TransactionBuilder(source, {
            fee: estimatedFee.toString(),
            networkPassphrase,
          })
            .addOperation(contract.call(method, ...args))
            .setTimeout(30)
            .build();
        }

        // Return the XDR for the transaction
        return {
          xdr: transaction.toXDR(),
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
