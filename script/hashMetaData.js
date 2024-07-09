require("dotenv").config();
const readline = require("readline");
const fs = require("fs");
const pinataSDK = require("@pinata/sdk");

const pinata = new pinataSDK(
  process.env.PINATA_API_KEY,
  process.env.PINATA_SECRET_API_KEY
);

function clearConsole() {
  process.stdout.write("\x1B[2J\x1B[0f");
}

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

function askQuestion(query) {
  return new Promise((resolve) => rl.question(query, resolve));
}

async function hashMetaData(filePath, metadataName) {
  const readableStreamForFile = fs.createReadStream(filePath);
  const options = {
    pinataMetadata: {
      name: metadataName,
    },
    pinataOptions: {
      cidVersion: 1,
    },
  };

  try {
    const res = await pinata.pinFileToIPFS(readableStreamForFile, options);
    console.log("Upload successful:", res);
  } catch (error) {
    console.error("Error uploading to IPFS:", error);
  }
}

async function findImageFilePath(type, imageName) {
  const extensions = ["jpg", "jpeg", "png"];
  for (const ext of extensions) {
    const filePath = `images/${type}/${imageName}.${ext}`;
    if (fs.existsSync(filePath)) {
      return filePath;
    }
  }
  return null;
}

async function start() {
  try {
    clearConsole();
    const type = (await askQuestion("Hash token or contract image: "))
      .trim()
      .toLowerCase();
    clearConsole();
    const imageName = (
      await askQuestion("Enter the image file name (without extension): ")
    ).trim();
    clearConsole();
    const metadataName = (
      await askQuestion("Enter the metadata name: ")
    ).trim();

    // Check for valid input
    if (!["token", "contract"].includes(type)) {
      console.log("Invalid type. Please enter 'token' or 'contract'.");
      return;
    }

    const filePath = await findImageFilePath(type, imageName);

    // Check if the file exists
    if (!filePath) {
      console.log(`File does not exist for the given image name in ${type}.`);
      return;
    }

    await hashMetaData(filePath, metadataName);
  } finally {
    rl.close();
  }
}

(async () => {
  await start();
})();
