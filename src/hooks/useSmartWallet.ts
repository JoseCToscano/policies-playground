import { useState } from "react";
import { account, server } from "~/lib/utils";
import base64url from "base64url";

export const useSmartWallet = () => {
    const [keyId, setKeyId] = useState<string | null>(null);
    const [contractId, setContractId] = useState<string | null>(null);

    const create = async () => {
    try {
            const user = prompt("Give this passkey a name");
    
            if (!user) return;
    
                const {
                    keyId: kid,
                    contractId: cid,
                    signedTx,
                } = await account.createWallet("Super Peach", user);
                
                const res = await server.send(signedTx);
    
                console.log(res);
    
                const b64KeyId = base64url(kid);
                setKeyId(b64KeyId);
                localStorage.setItem("sp:keyId", b64KeyId);
    
                setContractId(cid);
                console.log("register", cid);
    
                // await getWalletSigners();
                // await fundWallet();
    } catch (error) {
        console.error(error);
        alert((error as Error)?.message ?? "Unknown error");
    }
    }
}