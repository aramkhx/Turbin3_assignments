import { createSignerFromKeypair, publicKey, signerIdentity } from "@metaplex-foundation/umi"
import wallet from "../../devnet-wallet.json"
import { createUmi } from "@metaplex-foundation/umi-bundle-defaults";
import { createMetadataAccountV3, CreateMetadataAccountV3InstructionAccounts, CreateMetadataAccountV3InstructionArgs, DataV2Args } from "@metaplex-foundation/mpl-token-metadata";
import bs58 from "bs58"

const mint = publicKey("3c84aduJeed8ABaX4zLSPN4hSHLRc7En8Ci2BYb4tmsn");

const umi = createUmi("https://api.devnet.solana.com");

const keypair = umi.eddsa.createKeypairFromSecretKey(new Uint8Array(wallet));
const signer = createSignerFromKeypair(umi, keypair);

umi.use(signerIdentity(signer));

(async () => {
    try {
        const accounts : CreateMetadataAccountV3InstructionAccounts = {
            mint,
            mintAuthority: signer,
        }
        
        const data: DataV2Args = {
            name: "Chill Patrick",
            symbol: "PATRICK",
            uri: "",
            sellerFeeBasisPoints: 1,
            creators: null,
            collection: null,
            uses: null
        }

        const args: CreateMetadataAccountV3InstructionArgs = {
            data,
            isMutable: true,
            collectionDetails: null
        }
        const tx = createMetadataAccountV3(umi, {
            ...accounts,
            ...args
        })

        const result = await tx.sendAndConfirm(umi);

        console.log(bs58.encode(Buffer.from(result.signature)))
    } catch (error) {
        console.log("error", error);
    }
})()

// 2KoQ2bL28S4p1WEd2wxLzEeFXHSYmGjxUXgHiR8DA8qcJn65JkrRBJKJSydM414koRXJ1SLoGqujhLopbtJEXsmf