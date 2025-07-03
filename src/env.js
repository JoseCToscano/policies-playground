import { createEnv } from "@t3-oss/env-nextjs";
import { z } from "zod";

export const env = createEnv({
  /**
   * Specify your server-side environment variables schema here. This way you can ensure the app
   * isn't built with invalid env vars.
   */
  server: {
    NODE_ENV: z.enum(["development", "test", "production"]),
    STRIPE_SECRET_KEY: z.string().min(1),
  },

  /**
   * Specify your client-side environment variables schema here. This way you can ensure the app
   * isn't built with invalid env vars. To expose them to the client, prefix them with
   * `NEXT_PUBLIC_`.
   */
  client: {
    // Network-specific environment variables
    // Testnet configuration
    NEXT_PUBLIC_TESTNET_RPC_URL: z.string().min(1),
    NEXT_PUBLIC_TESTNET_NETWORK_PASSPHRASE: z.string().min(1),
    NEXT_PUBLIC_TESTNET_WALLET_WASM_HASH: z.string().min(1),
    NEXT_PUBLIC_TESTNET_LAUNCHTUBE_URL: z.string().min(1),
    NEXT_PUBLIC_TESTNET_LAUNCHTUBE_JWT: z.string().min(1),
    NEXT_PUBLIC_TESTNET_MERCURY_URL: z.string().min(1),
    NEXT_PUBLIC_TESTNET_MERCURY_JWT: z.string().min(1),
    NEXT_PUBLIC_TESTNET_MERCURY_PROJECT_NAME: z.string().min(1),
    NEXT_PUBLIC_TESTNET_NATIVE_CONTRACT_ID: z.string().min(1),
    NEXT_PUBLIC_TESTNET_HORIZON_URL: z.string().min(1),

    // Mainnet configuration
    NEXT_PUBLIC_MAINNET_RPC_URL: z.string().min(1),
    NEXT_PUBLIC_MAINNET_NETWORK_PASSPHRASE: z.string().min(1),
    NEXT_PUBLIC_MAINNET_WALLET_WASM_HASH: z.string().min(1),
    NEXT_PUBLIC_MAINNET_LAUNCHTUBE_URL: z.string().min(1),
    NEXT_PUBLIC_MAINNET_LAUNCHTUBE_JWT: z.string().min(1),
    NEXT_PUBLIC_MAINNET_MERCURY_URL: z.string().min(1),
    NEXT_PUBLIC_MAINNET_MERCURY_JWT: z.string().min(1),
    NEXT_PUBLIC_MAINNET_MERCURY_PROJECT_NAME: z.string().min(1),
    NEXT_PUBLIC_MAINNET_NATIVE_CONTRACT_ID: z.string().min(1),
    NEXT_PUBLIC_MAINNET_HORIZON_URL: z.string().min(1),

    // Other services
    NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: z.string().min(1),
  },

  /**
   * You can't destruct `process.env` as a regular object in the Next.js edge runtimes (e.g.
   * middlewares) or client-side so we need to destruct manually.
   */
  runtimeEnv: {
    NODE_ENV: process.env.NODE_ENV,
    
    // Legacy environment variables (backward compatibility)
    NEXT_PUBLIC_RPC_URL: process.env.NEXT_PUBLIC_RPC_URL,
    NEXT_PUBLIC_LAUNCHTUBE_URL: process.env.NEXT_PUBLIC_LAUNCHTUBE_URL,
    NEXT_PUBLIC_LAUNCHTUBE_JWT: process.env.NEXT_PUBLIC_LAUNCHTUBE_JWT,
    NEXT_PUBLIC_NETWORK_PASSPHRASE: process.env.NEXT_PUBLIC_NETWORK_PASSPHRASE,
    NEXT_PUBLIC_WALLET_WASM_HASH: process.env.NEXT_PUBLIC_WALLET_WASM_HASH,
    NEXT_PUBLIC_MERCURY_PROJECT_NAME: process.env.NEXT_PUBLIC_MERCURY_PROJECT_NAME,
    NEXT_PUBLIC_MERCURY_URL: process.env.NEXT_PUBLIC_MERCURY_URL,
    NEXT_PUBLIC_MERCURY_JWT: process.env.NEXT_PUBLIC_MERCURY_JWT,
    NEXT_PUBLIC_NATIVE_CONTRACT_ID: process.env.NEXT_PUBLIC_NATIVE_CONTRACT_ID,
    NEXT_PUBLIC_ZAFEGARD_WASM_HASH: process.env.NEXT_PUBLIC_ZAFEGARD_WASM_HASH,

    // Network-specific environment variables
    // Testnet configuration
    NEXT_PUBLIC_TESTNET_RPC_URL: process.env.NEXT_PUBLIC_TESTNET_RPC_URL,
    NEXT_PUBLIC_TESTNET_NETWORK_PASSPHRASE: process.env.NEXT_PUBLIC_TESTNET_NETWORK_PASSPHRASE,
    NEXT_PUBLIC_TESTNET_WALLET_WASM_HASH: process.env.NEXT_PUBLIC_TESTNET_WALLET_WASM_HASH,
    NEXT_PUBLIC_TESTNET_LAUNCHTUBE_URL: process.env.NEXT_PUBLIC_TESTNET_LAUNCHTUBE_URL,
    NEXT_PUBLIC_TESTNET_LAUNCHTUBE_JWT: process.env.NEXT_PUBLIC_TESTNET_LAUNCHTUBE_JWT,
    NEXT_PUBLIC_TESTNET_MERCURY_URL: process.env.NEXT_PUBLIC_TESTNET_MERCURY_URL,
    NEXT_PUBLIC_TESTNET_MERCURY_JWT: process.env.NEXT_PUBLIC_TESTNET_MERCURY_JWT,
    NEXT_PUBLIC_TESTNET_MERCURY_PROJECT_NAME: process.env.NEXT_PUBLIC_TESTNET_MERCURY_PROJECT_NAME,
    NEXT_PUBLIC_TESTNET_NATIVE_CONTRACT_ID: process.env.NEXT_PUBLIC_TESTNET_NATIVE_CONTRACT_ID,
    NEXT_PUBLIC_TESTNET_HORIZON_URL: process.env.NEXT_PUBLIC_TESTNET_HORIZON_URL,

    // Mainnet configuration
    NEXT_PUBLIC_MAINNET_RPC_URL: process.env.NEXT_PUBLIC_MAINNET_RPC_URL,
    NEXT_PUBLIC_MAINNET_NETWORK_PASSPHRASE: process.env.NEXT_PUBLIC_MAINNET_NETWORK_PASSPHRASE,
    NEXT_PUBLIC_MAINNET_WALLET_WASM_HASH: process.env.NEXT_PUBLIC_MAINNET_WALLET_WASM_HASH,
    NEXT_PUBLIC_MAINNET_LAUNCHTUBE_URL: process.env.NEXT_PUBLIC_MAINNET_LAUNCHTUBE_URL,
    NEXT_PUBLIC_MAINNET_LAUNCHTUBE_JWT: process.env.NEXT_PUBLIC_MAINNET_LAUNCHTUBE_JWT,
    NEXT_PUBLIC_MAINNET_MERCURY_URL: process.env.NEXT_PUBLIC_MAINNET_MERCURY_URL,
    NEXT_PUBLIC_MAINNET_MERCURY_JWT: process.env.NEXT_PUBLIC_MAINNET_MERCURY_JWT,
    NEXT_PUBLIC_MAINNET_MERCURY_PROJECT_NAME: process.env.NEXT_PUBLIC_MAINNET_MERCURY_PROJECT_NAME,
    NEXT_PUBLIC_MAINNET_NATIVE_CONTRACT_ID: process.env.NEXT_PUBLIC_MAINNET_NATIVE_CONTRACT_ID,
    NEXT_PUBLIC_MAINNET_HORIZON_URL: process.env.NEXT_PUBLIC_MAINNET_HORIZON_URL,

    // Other services
    NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY,
    STRIPE_SECRET_KEY: process.env.STRIPE_SECRET_KEY,
  },
  /**
   * Run `build` or `dev` with `SKIP_ENV_VALIDATION` to skip env validation. This is especially
   * useful for Docker builds.
   */
  skipValidation: !!process.env.SKIP_ENV_VALIDATION,
  /**
   * Makes it so that empty strings are treated as undefined. `SOME_VAR: z.string()` and
   * `SOME_VAR=''` will throw an error.
   */
  emptyStringAsUndefined: true,
});
