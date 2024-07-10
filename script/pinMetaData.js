require("dotenv").config();
const fs = require("fs");
const pinataSDK = require("@pinata/sdk");
const { clear } = require("console");
const { program } = require("commander");

const pinata = new pinataSDK(
  process.env.PINATA_API_KEY,
  process.env.PINATA_SECRET_API_KEY
);

program
  .description("Pin metadata to IPFS")
  .option("-t, --type <type>", "Type of data to pin: 'image' or 'folder'")
  .option("-n, --name <name>", "Name of the collection")
  .option(
    "-i, --imagename <imagename>",
    "Name of the image file (without extension)"
  )
  .option("-f, --folderpath <path>", "Path of the folder to pin")
  .option("-m, --metadataname <name>", "Name of the metadata")
  .parse(process.argv);

async function uploadMetadataToIPFS(filePath, metadataName, isFolder = false) {
  try {
    clear();
    let res;
    if (isFolder) {
      res = await pinata.pinFromFS(filePath, {
        // pinFromFS is used to pin a folder and its contents to IPFS (can be used recursively)
        pinataMetadata: { name: metadataName }, // name for the pinned folder
      });
    } else {
      const readableStreamForFile = fs.createReadStream(filePath);
      const options = {
        pinataMetadata: { name: metadataName }, // name for the pinned file
        pinataOptions: { cidVersion: 1 }, // version 1 is the latest version
      };
      res = await pinata.pinFileToIPFS(readableStreamForFile, options); // pinFileToIPFS is used to pin a file
    }
    console.log("Upload successful:", res);
    return true;
  } catch (error) {
    console.error("Error uploading to IPFS:", error.message);
    return false;
  }
}

async function findImageFilePath(name, imageName) {
  const extensions = ["jpg", "jpeg", "png"]; // allow for multiple image formats
  for (const ext of extensions) {
    const filePath = `images/${name}/${imageName}.${ext}`; // path to the image file
    if (fs.existsSync(filePath)) {
      return filePath;
    }
  }
  return null; // return null if no valid image file is found
}

async function pinImage(name, imageName, metadataName) {
  try {
    clear();
    const filePath = await findImageFilePath(name, imageName); // find the image file
    if (!filePath) {
      console.log(`File does not exist for the given image name in ${name}.`);
      return false;
    }

    const success = await uploadMetadataToIPFS(filePath, metadataName); // upload the image to IPFS
    if (success) {
      console.log("Metadata pinned successfully.");
    } else {
      console.log("Failed to pin metadata.");
    }
    return success;
  } catch (error) {
    console.error("Error during image pinning:", error.message);
    return false;
  }
}

async function pinFolder(folderPath, metadataName) {
  try {
    clear();
    if (!fs.existsSync(folderPath) || !fs.lstatSync(folderPath).isDirectory()) {
      // check if the folder exists and is a valid directory
      console.log(
        `Folder does not exist or is not a valid directory: ${folderPath}`
      );
      return false;
    }

    const success = await uploadMetadataToIPFS(folderPath, metadataName, true); // upload the folder to IPFS (true for folder)
    if (success) {
      console.log("Metadata pinned successfully.");
    } else {
      console.log("Failed to pin metadata.");
    }
    return success;
  } catch (error) {
    console.error("Error during folder pinning:", error.message);
    return false;
  }
}

async function pinMetadata(options) {
  try {
    clear();
    if (!options.type) {
      throw new Error(
        "Pin type (--type or -t) is required. Use 'image' or 'folder'."
      );
    }

    if (options.type === "image") {
      if (!options.name) {
        throw new Error("Collection name (--name or -n) is required.");
      }

      if (!options.imagename) {
        throw new Error("Image name (--imagename or -i) is required.");
      }

      if (!options.metadataname) {
        throw new Error("Metadata name (--metadataname or -m) is required.");
      }

      await pinImage(options.name, options.imagename, options.metadataname); // pin the image
    } else if (options.type === "folder") {
      if (!options.folderpath) {
        throw new Error("Folder path (--folderpath or -f) is required.");
      }
      if (!options.metadataname) {
        throw new Error("Metadata name (--metadataname or -m) is required.");
      }
      await pinFolder(options.folderpath, options.metadataname); // pin the folder
    } else {
      throw new Error(
        "Invalid pin type (--type or -t). Use 'image' or 'folder'."
      );
    }
  } catch (error) {
    console.error("Error during script execution:", error.message);
  }
}

// Check if the script is run with the "pin" argument
const args = process.argv.slice(2);
if (args.length > 0 && args[0] === "pin") {
  pinMetadata(program.opts());
} else {
  program.help();
}
