
import { PollyClient, SynthesizeSpeechCommand } from "@aws-sdk/client-polly";

// Load credentials from environment variables
const accessKeyId = process.env.AWS_ACCESS_KEY_ID || "";
const secretAccessKey = process.env.AWS_SECRET_ACCESS_KEY || "";
const region = process.env.AWS_REGION || "us-east-1";

async function testPolly() {
    console.log("Testing Polly credentials...");

    if (!accessKeyId || !secretAccessKey) {
        console.error("ERROR: AWS credentials not found in environment variables.");
        console.error("Please set AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY");
        process.exit(1);
    }

    console.log("Key:", accessKeyId.substring(0, 4) + "..." + accessKeyId.slice(-4));

    // Explicitly unsetting session token in case it leaks from env
    delete process.env.AWS_SESSION_TOKEN;
    delete process.env.AWS_SECURITY_TOKEN;

    const client = new PollyClient({
        region: region,
        credentials: {
            accessKeyId: accessKeyId,
            secretAccessKey: secretAccessKey,
            sessionToken: undefined
        }
    });

    try {
        const command = new SynthesizeSpeechCommand({
            Text: "Hello, this is a test.",
            OutputFormat: "mp3",
            VoiceId: "Ivy",
            Engine: "neural",
        });

        console.log("Sending request...");
        const response = await client.send(command);
        console.log("Success! Audio stream received.");
    } catch (error) {
        console.error("FAILED:");
        console.error(error);
    }
}

testPolly();
