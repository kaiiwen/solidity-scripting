const readline = require("readline");
const fs = require("fs");
const path = require("path");
const { clear } = require("console");

// Utility function to ask a question in the console
function askQuestion(query) {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  return new Promise((resolve) =>
    rl.question(query, (answer) => {
      rl.close();
      resolve(answer);
    })
  );
}

// Utility function to get valid input with optional validation
async function getValidInput(promptText, validationFn = null) {
  let userInput;
  do {
    userInput = await askQuestion(promptText);
    if (validationFn && !validationFn(userInput)) {
      console.log("Input is not in the correct format. Please try again.");
    } else if (userInput.trim() === "") {
      console.log("Input cannot be empty. Please try again.");
    } else {
      return userInput;
    }
  } while (true);
}

// Utility function to get the next file index in a directory
function getNextFileIndex(directory) {
  if (!fs.existsSync(directory)) {
    fs.mkdirSync(directory, { recursive: true });
    return 1;
  }

  const files = fs.readdirSync(directory);
  const indices = files
    .map((file) => parseInt(path.basename(file, ".json")))
    .filter((num) => !isNaN(num));
  return indices.length > 0 ? Math.max(...indices) + 1 : 1;
}

// Function to create or update contract metadata
async function createContractMetadata(folderPath, name) {
  const filePath = path.join(folderPath, `${name}.json`);
  let existingData = {};

  if (fs.existsSync(filePath)) {
    const update = await askQuestion(
      "File already exists. Do you want to update the metadata? (y/n): "
    );
    if (update.trim().toLowerCase() !== "y") {
      console.log("Exiting without updating metadata.");
      return;
    }
    existingData = JSON.parse(fs.readFileSync(filePath, "utf8"));
  }

  clear();
  const description = await getValidInput("Enter description: ");
  const imageCID = await getValidInput("Enter image CID: ");
  const bannerImageCID = await getValidInput("Enter banner image CID: ");
  const featuredImageCID = await getValidInput("Enter featured image CID: ");
  const externalLink = await getValidInput("Enter external link: ");
  const collaborators = ["0x0000000000000000000000000000000000000000"];

  const data = {
    name,
    description: description || existingData.description || "",
    image: imageCID ? `ipfs://${imageCID}` : existingData.image || "",
    banner_image: bannerImageCID
      ? `ipfs://${bannerImageCID}`
      : existingData.banner_image || "",
    featured_image: featuredImageCID
      ? `ipfs://${featuredImageCID}`
      : existingData.featured_image || "",
    external_link: externalLink || existingData.external_link || "",
    collaborators: existingData.collaborators || collaborators,
  };

  if (!fs.existsSync(folderPath)) {
    fs.mkdirSync(folderPath, { recursive: true });
  }

  fs.writeFile(filePath, JSON.stringify(data, null, 4), (err) => {
    if (err) {
      console.error("Error writing to file", err);
    } else {
      console.log(`File ${filePath} created/updated successfully.`);
    }
  });
}

// Function to create or update token metadata
async function createTokenMetadata(folderPath, name) {
  if (!fs.existsSync(folderPath)) {
    console.log(
      "Contract metadata does not exist. Please create contract metadata first."
    );
    return;
  }

  let update = false;
  let filePath = "";

  const files = fs
    .readdirSync(folderPath)
    .filter((file) => file !== `${name}.json`);
  if (files.length > 0) {
    console.log("Existing token metadata files:");
    files.forEach((file) => console.log(file));

    const updateAnswer = await askQuestion(
      "Do you want to update an existing token metadata file? (y/n): "
    );
    update = updateAnswer.trim().toLowerCase() === "y";

    if (update) {
      const fileName = await askQuestion(
        "Enter the file name you want to update (e.g., 1.json): "
      );
      filePath = path.join(folderPath, fileName.trim());

      if (!fs.existsSync(filePath)) {
        console.log("File does not exist. Exiting.");
        return;
      }
    }
  }

  if (!update) {
    const fileIndex = getNextFileIndex(folderPath);
    filePath = path.join(folderPath, `${fileIndex}.json`);
  }

  let existingData = {};
  if (update) {
    existingData = JSON.parse(fs.readFileSync(filePath, "utf8"));
  }

  clear();
  const description = await getValidInput("Enter description: ");
  const externalUrl = await getValidInput("Enter external URL: ");
  const tokenImageCID = await getValidInput("Enter image CID: ");

  const tokenName = await getValidInput("Enter token name: ");
  const attributes = await getValidInput(
    "Enter attributes (JSON array format): ",
    (input) => {
      try {
        JSON.parse(input);
        return true;
      } catch {
        return false;
      }
    }
  );

  const data = {
    description: description || existingData.description || "",
    external_url: externalUrl || existingData.external_url || "",
    image: tokenImageCID
      ? `ipfs://${tokenImageCID}`
      : existingData.tokenImageCID || "",
    name: tokenName || existingData.name || "",
    attributes: JSON.parse(attributes) || existingData.attributes || [],
  };

  fs.writeFile(filePath, JSON.stringify(data, null, 4), (err) => {
    if (err) {
      console.error("Error writing to file", err);
    } else {
      console.log(`File ${filePath} created/updated successfully.`);
    }
  });
}

// Main function to create metadata
async function createMetadata() {
  clear();
  const metadataType = await getValidInput(
    "Are you creating contract or token metadata? (contract/token): ",
    (input) => ["contract", "token"].includes(input.toLowerCase())
  );

  clear();
  const name = await getValidInput(
    "Enter contract collection name: ",
    (input) => input.trim() !== ""
  );

  const folderPath = `metadata/${name}`;

  if (metadataType.toLowerCase() === "contract") {
    await createContractMetadata(folderPath, name);
  } else if (metadataType.toLowerCase() === "token") {
    await createTokenMetadata(folderPath, name);
  }
}

// Script execution entry point
const args = process.argv.slice(2);
if (args.length > 0 && args[0] === "create") {
  createMetadata();
} else {
  console.log("Usage: node script/storeMetaData.js create");
}
