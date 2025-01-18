import { createTRPCRouter } from "~/server/api/trpc";
import { publicProcedure } from "~/server/api/trpc";
import { z } from "zod";
import { Sep10 } from "~/server/services/Sep10";
import { handleHorizonServerError } from "~/lib/utils";
import { account, server } from "~/lib/utils";

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
  });