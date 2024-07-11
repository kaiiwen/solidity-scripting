const readline = require("readline");
const fs = require("fs");
const path = require("path");
const { clear } = require("console");
const { program } = require("commander");

program
  .description("Create metadata for contract or token")
  .option(
    "-t, --type <type>",
    "Type of metadata to create: 'contract' or 'token'"
  )
  .option("-cn, --contract-name <contract-name>", "Name of the contract")
  .option("-d, --description <description>", "Description of the metadata")
  .option("-ic, --image-cid <image-cid>", "Image CID for the metadata")
  .option(
    "-bc, --banner-image-cid <banner-image-cid>",
    "Banner image CID for the metadata"
  )
  .option(
    "-fc, --featured-image-cid <featured-image-cid>",
    "Featured image CID for the metadata"
  )
  .option(
    "-el, --external-link <external-link>",
    "External link for the metadata"
  )
  .option(
    "-eu, --external-url <external-url>",
    "External URL for the token metadata"
  )
  .option("-tn, --token-name <token-name>", "Token name for the metadata")
  .option("-a, --attributes <attributes>", "Attributes for the token metadata")
  .parse(process.argv);

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

function askQuestion(query) {
  return new Promise((resolve) => rl.question(query, resolve));
}

function getNextFileIndex(folderPath) {
  const files = fs
    .readdirSync(folderPath)
    .filter((file) => file.endsWith(".json"));
  const indices = files
    .map((file) => parseInt(file.replace(".json", ""), 10))
    .filter((num) => !isNaN(num));
  return indices.length ? Math.max(...indices) + 1 : 1;
}

async function createContractMetadata(options) {
  clear();
  const {
    contractName,
    description,
    image,
    bannerImage,
    featuredImage,
    externalLink,
  } = options;

  if (
    !contractName ||
    !description ||
    !image ||
    !bannerImage ||
    !featuredImage ||
    !externalLink
  ) {
    throw new Error(
      "All options (--contract-name or -cn, --description or -d, --image-cid or -ic, --banner-image-cid or -bc, --featured-image-cid or -fc, --external-link or -el) are required for 'contract' metadata creation."
    );
  }

  const folderPath = `metadata/${contractName}`;
  const filePath = path.join(folderPath, `${contractName}.json`);
  const collaborators = ["0x0000000000000000000000000000000000000000"];

  const data = {
    name: contractName,
    description,
    image: `ipfs://${image}`,
    banner_image: `ipfs://${bannerImage}`,
    featured_image: `ipfs://${featuredImage}`,
    external_link: externalLink,
    collaborators,
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

async function createTokenMetadata(options) {
  clear();
  const {
    contractName,
    externalUrl,
    image,
    tokenName,
    attributes,
    description,
  } = options;

  if (!contractName || !externalUrl || !image || !tokenName || !attributes) {
    throw new Error(
      "All options (--contract-name or -cn, --external-url or -eu, --image-cid or -ic, --token-name or -tn, --attributes or -a) are required for 'token' metadata creation."
    );
  }

  const folderPath = `metadata/${contractName}`;

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
    .filter((file) => file !== `${contractName}.json`);

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
        console.log("File does not exist. Creating a new file.");
        update = false;
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

  const data = {
    description: description || existingData.description || "",
    external_url: externalUrl || existingData.external_url || "",
    image: `ipfs://${image}` || existingData.image || "",
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

async function createMetadata(options) {
  clear();
  try {
    if (!options.type) {
      throw new Error(
        "Type (--type or -t) is required. Use 'contract' or 'token'."
      );
    }

    if (options.type === "contract") {
      await createContractMetadata(options);
    } else if (options.type === "token") {
      await createTokenMetadata(options);
    } else {
      throw new Error(
        "Invalid type (--type or -t). Use 'contract' or 'token'."
      );
    }
  } catch (error) {
    console.error("Error during script execution:", error.message);
  } finally {
    rl.close();
  }
}

const args = process.argv.slice(2);
if (args.length > 0 && args[0] === "create") {
  createMetadata(program.opts()).catch((error) => {
    console.error("Error during script execution:", error.message);
  });
} else {
  program.help();
}
