import { Asset, contract, Networks, xdr } from "@stellar/stellar-sdk/minimal";
import { env } from "~/env";
import { SAC_FUNCTIONS } from "~/lib/constants/sac";
import { ContractFunction, ContractFunctionParam } from "~/types/contracts";

// Modify the ContractMetadata interface to include enums and unions
export interface ContractMetadata {
    contractAddress?: string;
    name?: string;
    symbol?: string;
    decimals?: number;
    totalSupply?: string;
    version?: string;
    functions: ContractFunction[];
    enums?: ContractEnum[];
    unions?: ContractUnion[];
}

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

    // Handle optional types recursively
    if (typeName === 'scSpecTypeOption') {
        const elementType = type.option().valueType();
        return `optional<${parseXdrType(elementType, contractSpec)}>`;
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

// Helper function to decode Buffer to string
export const decodeBuffer = (buf: Buffer | string): string => {
    if (Buffer.isBuffer(buf)) {
        return buf.toString('utf8');
    }
    return String(buf);
};

export async function getContractMetadata(contractAddress: string): Promise<ContractMetadata> {
    // Check if this is native XLM
    if (contractAddress === 'native' || contractAddress === env.NEXT_PUBLIC_NATIVE_CONTRACT_ID) {
        // For native XLM, we use the standard SAC interface
        const metadata: ContractMetadata = {
            contractAddress: 'CDLZFC3SYJYDZT7K67VZ75HPJVIEUVNIXF47ZG2FB2RMQQVU2HHGCYSC',
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
    const isAssetContract = contractAddress.includes('-');
    if (isAssetContract) {
        const [code, issuer] = contractAddress.split('-');
        if (!code || !issuer) {
            throw new Error("Invalid Asset Contract address format");
        }
        const asset = new Asset(code, issuer);
        const contractId = await asset.contractId(Networks.TESTNET);
        console.log('contractId for asset contract:', contractAddress, contractId);
        // For Asset Contracts, we use the standard interface
        const metadata: ContractMetadata = {
            contractAddress: contractId,
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
        contractId: contractAddress,
        networkPassphrase: 'Test SDF Network ; September 2015',
        rpcUrl: 'https://soroban-testnet.stellar.org'
    }).catch((e) => {
        console.error("Error fetching contract metadata:", e);
        throw new Error("Failed to fetch contract metadata");
    });
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


        return {
            name,
            parameters,
        };
    });

    // Parse enums from spec
    const enums = parseEnums(contractClient.spec);

    // Parse unions from spec
    const unions = parseUnions(contractClient.spec);

    // Sort functions alphabetically
    functions.sort((a, b) => a.name.localeCompare(b.name));

    const metadata: ContractMetadata = {
        contractAddress,
        functions,
        enums,
        unions
    };
    return metadata;
}