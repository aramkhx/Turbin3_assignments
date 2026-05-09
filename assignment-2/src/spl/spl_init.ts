import { appendTransactionMessageInstructions, assertIsTransactionWithBlockhashLifetime, createKeyPairSignerFromBytes, createSolanaRpc, createSolanaRpcSubscriptions, createTransactionMessage, generateKeyPairSigner, getSignatureFromTransaction, sendAndConfirmTransactionFactory, setTransactionMessageFeePayerSigner, setTransactionMessageLifetimeUsingBlockhash, signTransactionMessageWithSigners } from "@solana/kit"
import wallet from "../../devnet-wallet.json"
import { getInitializeMintInstruction, getMintSize, TOKEN_PROGRAM_ADDRESS } from "@solana-program/token";
import { getCreateAccountInstruction } from "@solana-program/system";

const rpc = createSolanaRpc("https://api.devnet.solana.com");

const rpcSubscriptions = createSolanaRpcSubscriptions("wss://api.devnet.solana.com");

(async () => {
    try {
        const signer = await createKeyPairSignerFromBytes(
            new Uint8Array(wallet)
        );

        const mint = await generateKeyPairSigner();

        const space = BigInt(getMintSize());

        const rent = await rpc.getMinimumBalanceForRentExemption(space).send();

        const {value : latestBlockhash} = await rpc.getLatestBlockhash().send();

        const sendAndConfirm = sendAndConfirmTransactionFactory({
            rpc, rpcSubscriptions
        });

        const msg = createTransactionMessage({ version: 0 });

        const msgWithPayer = setTransactionMessageFeePayerSigner(signer, msg);

        const msgWithLifeTime = setTransactionMessageLifetimeUsingBlockhash(
            latestBlockhash,
            msgWithPayer
        );

        const txMessage = appendTransactionMessageInstructions(
            [
                getCreateAccountInstruction({
                    payer: signer,
                    newAccount: mint,
                    lamports: rent,
                    space,
                    programAddress: TOKEN_PROGRAM_ADDRESS
                }),

                getInitializeMintInstruction({
                    mint: mint.address,
                    decimals: 6,
                    mintAuthority: signer.address,
                }),
            ],
            msgWithLifeTime
        )
        const signedTx = await signTransactionMessageWithSigners(txMessage);

        assertIsTransactionWithBlockhashLifetime(signedTx);

        const signature = getSignatureFromTransaction(signedTx);

        await sendAndConfirm(signedTx, {commitment: "confirmed"});

        console.log(`mint address: ${mint.address}. Transaction Signature: ${signature}`);
    } catch (e) {
        console.log("Error", e);
    }
})()

// mint address: 3c84aduJeed8ABaX4zLSPN4hSHLRc7En8Ci2BYb4tmsn. Transaction Signature: 5QUij2rUxg3TMrpohZB5YavbVg1EEGqhCqSwxmsF7gT9ky8CcLg4xfjYUjn79Q1iekeFTkKUwiKAxr9RkSMYK3pX