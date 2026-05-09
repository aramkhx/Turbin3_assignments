import { umi } from "./umi";
import { mplCore, create } from "@metaplex-foundation/mpl-core";
import { generateSigner } from "@metaplex-foundation/umi";
import { base58 } from "@metaplex-foundation/umi/serializers";

umi.use(mplCore());

(async () => {
try {
    const metadataUri = "https://gateway.irys.xyz/3nXX1RmaTPoKmnV6Nd6UFzFym2Bz5wPbzWXd5iZLhxCX";

    const asset = generateSigner(umi);

    const tx = await create(umi, {
        asset,
        name: "Patrick Star",
        uri: metadataUri,
        plugins: [
            {
                type: "Royalties",
                basisPoints: 500,
                ruleSet: {
                    type: "None"
                },
                creators: [
                    {
                        address: umi.identity.publicKey,
                        percentage: 100
                    }
                ]
            }
        ]
    }).sendAndConfirm(umi);

    const signature = base58.deserialize(tx.signature)[0];

    console.log(`signature ${signature} , asset ${asset.publicKey}`);

} catch (error) {
    console.log(error);
}
})()

// signature 5D3DGHrW9k2uvxXHCgNkWuYG2avX8JKYHyHW1ptAXkEdUxhT68DRXURVNYvkrrivHE27x9V6BdvqpNH8E8b8Vu7H , asset p59m6cy8Gs9ZpdM6yocqWtUa4KiejF4wtuubWGc4nUQ