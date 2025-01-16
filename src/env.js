import { createEnv } from "@t3-oss/env-nextjs";
import { z } from "zod";

export const env = createEnv({
  /**
   * Specify your server-side environment variables schema here. This way you can ensure the app
   * isn't built with invalid env vars.
   */
  server: {
    NODE_ENV: z.enum(["development", "test", "production"]),
  },

  /**
   * Specify your client-side environment variables schema here. This way you can ensure the app
   * isn't built with invalid env vars. To expose them to the client, prefix them with
   * `NEXT_PUBLIC_`.
   */
  client: {
    // NEXT_PUBLIC_CLIENTVAR: z.string(),
    NEXT_PUBLIC_RPC_URL: z.string(),
    NEXT_PUBLIC_LAUNCHTUBE_URL: z.string(),
    NEXT_PUBLIC_LAUNCHTUBE_JWT: z.string(),
    NEXT_PUBLIC_NETWORK_PASSPHRASE: z.string(),
    NEXT_PUBLIC_WALLET_WASM_HASH: z.string(),
    NEXT_PUBLIC_MERCURY_PROJECT_NAME: z.string(),
    NEXT_PUBLIC_MERCURY_URL: z.string(),
    NEXT_PUBLIC_MERCURY_JWT: z.string(),
    NEXT_PUBLIC_NATIVE_CONTRACT_ID: z.string(),
    NEXT_PUBLIC_ZAFEGARD_WASM_HASH: z.string(),
  },

  /**
   * You can't destruct `process.env` as a regular object in the Next.js edge runtimes (e.g.
   * middlewares) or client-side so we need to destruct manually.
   */
  runtimeEnv: {
    NODE_ENV: process.env.NODE_ENV,
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
