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
  .option("-t, --type <type>", "Type of data to pin: 'file' or 'folder'")
  .option("-cn, --contract-name <contract-name>", "Name of the contract")
  .option(
    "-fn, --file-name <file-name>",
    "Name of the file (without extension)"
  )
  .option("-fp, --folder-path <path>", "Path of the folder to pin")
  .option(
    "-mn, --metadata-name <metadata-name>",
    "Name for the metadata file being pinned"
  )
  .option("--is-image", "Indicates if the file is an image")
  .parse(process.argv);

async function uploadMetadataToIPFS(filePath, metadataName, isFolder = false) {
  try {
    clear();
    let res;
    if (isFolder) {
      res = await pinata.pinFromFS(filePath, {
        pinataMetadata: {
          name: metadataName,
          keyvalues: { collection: metadataName },
        },
      });
    } else {
      const readableStreamForFile = fs.createReadStream(filePath);
      const options = {
        pinataMetadata: {
          name: metadataName,
          keyvalues: { collection: metadataName },
        },
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

async function findFilePath(contractName, fileName, isImage) {
  if (isImage) {
    const extensions = ["jpg", "jpeg", "png"];
    for (const ext of extensions) {
      const filePath = `images/${contractName}/${fileName}.${ext}`;
      if (fs.existsSync(filePath)) {
        return filePath;
      }
    }
    return null;
  } else {
    const genericFilePath = `metadata/${metadataName}/${fileName}.json}`;
    if (fs.existsSync(genericFilePath)) {
      return genericFilePath;
    }
  }
  return null;
}

async function pinFile(contractName, fileName, metadataName) {
  try {
    clear();
    const filePath = await findFilePath(contractName, fileName);
    if (!filePath) {
      console.log(
        `File does not exist for the given file name in ${contractName}.`
      );
      return false;
    }

    const success = await uploadMetadataToIPFS(filePath, metadataName);
    if (success) {
      console.log("Metadata pinned successfully.");
    } else {
      console.log("Failed to pin metadata.");
    }
    return success;
  } catch (error) {
    console.error("Error during file pinning:", error.message);
    return false;
  }
}

async function pinFolder(folderPath, metadataName) {
  try {
    clear();
    if (!fs.existsSync(folderPath) || !fs.lstatSync(folderPath).isDirectory()) {
      console.log(
        `Folder does not exist or is not a valid directory: ${folderPath}`
      );
      return false;
    }

    const success = await uploadMetadataToIPFS(folderPath, metadataName, true);
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
    const requiredOptions = [];

    if (!options.type) {
      requiredOptions.push("--type or -t");
    }

    if (options.type === "file") {
      if (!options.contractName) {
        requiredOptions.push("--contract-name or -cn");
      }
      if (!options.fileName) {
        requiredOptions.push("--file-name or -fn");
      }
      if (!options.metadataName) {
        requiredOptions.push("--metadata-name or -mn");
      }
    } else if (options.type === "folder") {
      if (!options.folderpath) {
        requiredOptions.push("--folderpath or -fp");
      }
      if (!options.metadataName) {
        requiredOptions.push("--metadata-name or -mn");
      }
    } else {
      throw new Error(
        "Invalid pin type (--type or -t). Use 'file' or 'folder'."
      );
    }

    if (requiredOptions.length > 0) {
      throw new Error(
        `The following options are required: ${requiredOptions.join(", ")}`
      );
    }

    if (options.type === "file") {
      await pinFile(
        options.contractName,
        options.fileName,
        options.metadataName
      );
    } else if (options.type === "folder") {
      await pinFolder(options.folderpath, options.metadataName);
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
