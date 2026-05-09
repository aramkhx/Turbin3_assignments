import wallet from "../../devnet-wallet.json"
import { address, appendTransactionMessageInstructions, assertIsTransactionWithBlockhashLifetime, createKeyPairSignerFromBytes, createSolanaRpc, createSolanaRpcSubscriptions, createTransactionMessage, getSignatureFromTransaction, sendAndConfirmTransactionFactory, setTransactionMessageFeePayerSigner, setTransactionMessageLifetimeUsingBlockhash, signTransactionMessageWithSigners } from "@solana/kit";
import { findAssociatedTokenPda, getCreateAssociatedTokenInstructionAsync, getTransferCheckedInstruction, TOKEN_PROGRAM_ADDRESS } from "@solana-program/token";

const rpc = createSolanaRpc("https://api.devnet.solana.com");

const rpcSubscriptions = createSolanaRpcSubscriptions("wss://api.devnet.solana.com");

const mint = address("3c84aduJeed8ABaX4zLSPN4hSHLRc7En8Ci2BYb4tmsn");

const to = address("DCKqjB93sUEcF1rvwojGgWoGWJKS76gnkaLNGtxRDEuB");

(async () => {
    try {
        const signer = await createKeyPairSignerFromBytes(
        new Uint8Array(wallet)
    );
    const sendAndConfirm = sendAndConfirmTransactionFactory({
        rpc, rpcSubscriptions
    });

    const [fromAta] = await findAssociatedTokenPda({
        mint,
        owner: signer.address,
        tokenProgram: TOKEN_PROGRAM_ADDRESS 
    })
    console.log(`Your fromAta is: ${fromAta}`)

    const [toAta] = await findAssociatedTokenPda({
        mint,
        owner: to,
        tokenProgram: TOKEN_PROGRAM_ADDRESS 
    })
    console.log(`Your toAta is ${toAta}`)

    const createAtaIx = await getCreateAssociatedTokenInstructionAsync({
                payer: signer,
                mint,
                owner: to
    });

    const transferTx = getTransferCheckedInstruction({
        source: fromAta,
        mint,
        destination: toAta,
        authority: signer,
        amount: 2_000_000n,
        decimals: 6
    })

    const {value: latestBlockhash} = await rpc.getLatestBlockhash().send();

    const msg = createTransactionMessage({ version: 0 });
            
    const msgWithPayer = setTransactionMessageFeePayerSigner(signer, msg);
            
    const msgWithLifeTime = setTransactionMessageLifetimeUsingBlockhash(
        latestBlockhash,
        msgWithPayer
    );
    
    const txMessage = appendTransactionMessageInstructions(
        [createAtaIx, transferTx],
        msgWithLifeTime
    )
    
    const signedTx = await signTransactionMessageWithSigners(txMessage);
    
    assertIsTransactionWithBlockhashLifetime(signedTx);
    
    const signature = getSignatureFromTransaction(signedTx);
            
    await sendAndConfirm(signedTx, {commitment: "confirmed"});
            
    console.log(`mint txid: ${signature}`);
            
    } catch (error) {
        console.log(error);
    }
})()

// Your fromAta is: 5cmNK4pQgq98Pj221uN9Ag8f4i9eyevR9smCwnhv6dPv
// Your toAta is CDSfZHUpna5xQudjqtHqcydAYHFXTk2PsBkJPWrwkqtH
// mint txid: uvC1eTKThDfpakzysDAmcNCsg8Cc5BHiQXRVXKmriRziW9ahHysAsds6q9mhcQv6HgzQxk5c9ishLsi2jM5qySx