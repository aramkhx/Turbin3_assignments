import { umi } from "./umi";

(async () => {
    try {
        const image = "https://gateway.irys.xyz/CSifufG1aMQstvBNC2AqLRFaJs8s4trMN5xX7DtUTvXG";

        const metadata = {
            name : "Patrick Chill Star",
            description : "Chillin like a villain",
            image,
            attributes: [{ trait_type: "Mood", value: "Chill" }],

            properties: {
                files: [
                    {
                        type: "image/jpg",
                        uri: image
                    }
                ],
                category: "image",
            }
        }

        const myUri = await umi.uploader.uploadJson(metadata);
        console.log(`Metadata uri: ${myUri}`);
    } catch (error) {
        console.log(error)
    }
})()