import { ClientTRPCErrorHandler } from "~/lib/utils";
import { api } from "~/trpc/react";

export const useSep10 = () => {
    
    // tRPC Procedures
    const { mutateAsync : getAuthChallenge } = api.stellar.getAuthChallenge.useMutation({ 
        onError: ClientTRPCErrorHandler,
       });
    const { mutateAsync : submitAuthChallenge } = api.stellar.getAuthToken.useMutation({ 
        onError: ClientTRPCErrorHandler,
       });


    
    return {
        getAuthChallenge,
        submitAuthChallenge,
    }
}