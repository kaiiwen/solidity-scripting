require("dotenv").config();
const readline = require("readline");
const fs = require("fs");
const pinataSDK = require("@pinata/sdk");
const { clear } = require("console");

const pinata = new pinataSDK(
  process.env.PINATA_API_KEY,
  process.env.PINATA_SECRET_API_KEY
);
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

// Utility function to ask a question in the console
function askQuestion(query) {
  return new Promise((resolve) => rl.question(query, resolve));
}

// Upload metadata to IPFS
async function uploadMetadataToIPFS(filePath, metadataName, isFolder = false) {
  try {
    let res;
    if (isFolder) {
      res = await pinata.pinFromFS(filePath, {
        pinataMetadata: { name: metadataName },
      });
    } else {
      const readableStreamForFile = fs.createReadStream(filePath);
      const options = {
        pinataMetadata: { name: metadataName },
        pinataOptions: { cidVersion: 1 },
      };
      res = await pinata.pinFileToIPFS(readableStreamForFile, options);
    }
    console.log("Upload successful:", res);
    return true;
  } catch (error) {
    console.error("Error uploading to IPFS:", error.message);
    return false;
  }
}

// Find the file path for an image with various possible extensions
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

// Validate user input
function isValidType(input) {
  return ["token", "contract"].includes(input.toLowerCase());
}

// Pin image metadata to IPFS
async function pinImage() {
  try {
    clear();
    const type = (await askQuestion("Pin token or contract image: "))
      .trim()
      .toLowerCase();
    if (!isValidType(type)) {
      console.log("Invalid type. Please enter 'token' or 'contract'.");
      return;
    }

    clear();
    const imageName = (
      await askQuestion("Enter the image file name (without extension): ")
    ).trim();
    clear();

    const filePath = await findImageFilePath(type, imageName);
    if (!filePath) {
      console.log(`File does not exist for the given image name in ${type}.`);
      return;
    }

    const metadataName = (
      await askQuestion("Enter the metadata name: ")
    ).trim();
    const success = await uploadMetadataToIPFS(filePath, metadataName);

    if (success) {
      console.log("Metadata pinned successfully.");
    } else {
      console.log("Failed to pin metadata.");
    }
  } catch (error) {
    console.error("Error during image pinning:", error.message);
  }
}

// Pin folder metadata to IPFS
async function pinFolder() {
  try {
    clear();
    const folderPath = (
      await askQuestion("Enter the folder path to pin: ")
    ).trim();

    if (!fs.existsSync(folderPath) || !fs.lstatSync(folderPath).isDirectory()) {
      console.log(
        `Folder does not exist or is not a valid directory: ${folderPath}`
      );
      return;
    }

    const metadataName = (
      await askQuestion("Enter the metadata name: ")
    ).trim();
    const success = await uploadMetadataToIPFS(folderPath, metadataName, true);

    if (success) {
      console.log("Metadata pinned successfully.");
    } else {
      console.log("Failed to pin metadata.");
    }
  } catch (error) {
    console.error("Error during folder pinning:", error.message);
  }
}

// Main function to manage pinning process
async function pinMetadata() {
  try {
    clear();
    let continuePinning = true;

    while (continuePinning) {
      const pinType = (
        await askQuestion("Pin image or folder? (image/folder): ")
      )
        .trim()
        .toLowerCase();

      if (pinType === "image") {
        await pinImage();
      } else if (pinType === "folder") {
        await pinFolder();
      } else {
        console.log("Invalid input. Please enter 'image' or 'folder'.");
      }

      const answer = (
        await askQuestion("Do you want to pin another image or folder? (y/n): ")
      )
        .trim()
        .toLowerCase();

      continuePinning = answer === "y";
    }
  } catch (error) {
    console.error("Error during script execution:", error.message);
  } finally {
    rl.close();
  }
}

// Script execution entry point
const args = process.argv.slice(2);
if (args.length > 0 && args[0] === "pin") {
  pinMetadata();
} else {
  console.log("Usage: node script/pinMetaData.js pin");
}
