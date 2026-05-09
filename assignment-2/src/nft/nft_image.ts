import { umi } from "./umi";
import { createGenericFile } from "@metaplex-foundation/umi";
import { readFile } from "fs/promises";

(async () => {
try {
    const image = await readFile("./chill-image.jpg");

    const file = createGenericFile(image, "chill-image.jpg", {
        contentType: "image/jpg"
    });
    
    const [myUri] = await umi.uploader.upload([file]);
    console.log("Your image URI:", myUri);
} catch (error) {
    console.log(error)
}
})()
