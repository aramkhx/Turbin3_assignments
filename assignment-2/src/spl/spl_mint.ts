import wallet from "../../devnet-wallet.json"
import { address, appendTransactionMessageInstructions, assertIsTransactionWithBlockhashLifetime, createKeyPairSignerFromBytes, createSolanaRpc, createSolanaRpcSubscriptions, createTransactionMessage, getSignatureFromTransaction, sendAndConfirmTransactionFactory, setTransactionMessageFeePayerSigner, setTransactionMessageLifetimeUsingBlockhash, signTransactionMessageWithSigners } from "@solana/kit";
import { findAssociatedTokenPda, getCreateAssociatedTokenInstructionAsync, getMintToInstruction, TOKEN_PROGRAM_ADDRESS } from "@solana-program/token";

const rpc = createSolanaRpc("https://api.devnet.solana.com");

const rpcSubscriptions = createSolanaRpcSubscriptions("wss://api.devnet.solana.com");

const token_decimals = 1_000_000n;

const mint = address("3c84aduJeed8ABaX4zLSPN4hSHLRc7En8Ci2BYb4tmsn");

(async () => {
    try {
        const signer = await createKeyPairSignerFromBytes(
            new Uint8Array(wallet)
        );

        const [ata] = await findAssociatedTokenPda({
            mint,
            owner: signer.address,
            tokenProgram: TOKEN_PROGRAM_ADDRESS 
        })
        console.log(`Your ata is ${ata}`)

        const createAtaIx = await getCreateAssociatedTokenInstructionAsync({
            payer: signer,
            mint,
            owner: signer.address
        });

        const mintToIx = getMintToInstruction({
            mint,
            token: ata,
            mintAuthority: signer,
            amount: 10n * token_decimals
        })

        const {value: latestBlockhash} = await rpc.getLatestBlockhash().send();

        const msg = createTransactionMessage({ version: 0 });
        
        const msgWithPayer = setTransactionMessageFeePayerSigner(signer, msg);
        
        const msgWithLifeTime = setTransactionMessageLifetimeUsingBlockhash(
            latestBlockhash,
            msgWithPayer
        );

        const txMessage = appendTransactionMessageInstructions(
            [createAtaIx, mintToIx],
            msgWithLifeTime
        )

        const signedTx = await signTransactionMessageWithSigners(txMessage);

        assertIsTransactionWithBlockhashLifetime(signedTx);

        const signature = getSignatureFromTransaction(signedTx);

        const sendAndConfirm = sendAndConfirmTransactionFactory({
            rpc, rpcSubscriptions
        });
        
        await sendAndConfirm(signedTx, {commitment: "confirmed"});
        
        console.log(`mint txid: ${signature}`);
    } catch (error) {
        console.log(error)
    }
})()

// Your ata is 5cmNK4pQgq98Pj221uN9Ag8f4i9eyevR9smCwnhv6dPv
// mint txid: 3Bn9WdfUSx53LCHv6ePHjx23a1Z17mK56KKoRSvx4kPF4mSskaxXc8aM9Goeqw9qkVm5Wgb9ojJK61CZoExdf7Fv