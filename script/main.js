const { S3Client } = require("@aws-sdk/client-s3");
const fs = require("fs");
const path = require("path");
const { program } = require("commander");
const { exec } = require("child_process");
require("dotenv").config();
const { Upload } = require("@aws-sdk/lib-storage");

const accessKeyId = process.env.AWS_ACCESS_KEY_ID;
const secretAccessKey = process.env.AWS_SECRET_ACCESS_KEY;
const region = process.env.AWS_REGION;
const bucket = process.env.AWS_BUCKET;

const CONTENT_TYPE = {
  jpeg: "image/jpeg",
  json: "application/json",
};

const s3Client = new S3Client({
  region: region,
  credentials: {
    accessKeyId: accessKeyId,
    secretAccessKey: secretAccessKey,
  },
});

program
  .description("Deploy metadata for collection")
  .option("-cn, --collection-name <collection-name>", "Name of the collection")
  .parse(process.argv);

function getInitials(collectionName) {
  return collectionName
    .match(/(\b\S)?/g)
    .join("")
    .match(/(^\S|\S$)?/g)
    .join("")
    .toUpperCase();
}

const uploadToS3 = async (filePath) => {
  try {
    const extType = path.extname(filePath).slice(1);
    const params = {
      Bucket: bucket,
      Key: filePath,
      Body: fs.readFileSync(filePath),
      ContentType: CONTENT_TYPE[extType],
      ContentDisposition: `inline; filename="${filePath}"`,
    };
    const command = new Upload({ client: s3Client, params: params });
    const response = await command.done();
    console.log("File uploaded successfully:", response.Location);
  } catch (error) {
    console.error("Error uploading file", error);
  }
};

const uploadFolderToS3 = async (dir) => {
  const files = fs.readdirSync(dir, { recursive: true });
  for (const file of files) {
    try {
      const filePath = path.join(dir, file);
      const extType = path.extname(filePath).slice(1);
      const params = {
        Bucket: bucket,
        Key: filePath,
        Body: fs.readFileSync(filePath),
        ContentType: CONTENT_TYPE[extType],
        ContentDisposition: `inline; filename="${filePath}"`,
      };
      const command = new Upload({ client: s3Client, params: params });
      const response = await command.done();
      console.log("File uploaded successfully:", response.Location);
    } catch (error) {
      console.error("Error uploading file", error);
    }
  }
};

function createContractMetadata(collectionName) {
  const filePath = `deployment-artifacts/${collectionName}/metadata/contract/metadata.json`;
  const basePath = `https://${bucket}.s3.${region}.amazonaws.com/deployment-artifacts/${collectionName}/images/contract`;
  try {
    const metadata = JSON.parse(fs.readFileSync(filePath).toString());
    metadata.name = collectionName;
    metadata.image = `${basePath}/image.jpeg`;
    metadata.banner_image = `${basePath}/banner_image.jpeg`;
    metadata.featured_image = `${basePath}/featured_image.jpeg`;
    fs.writeFileSync(filePath, JSON.stringify(metadata));
    return filePath;
  } catch (error) {
    console.error("Error creating contract metadata", error);
  }
}

function createTokenMetadata(collectionName) {
  const basePath = `https://${bucket}.s3.${region}.amazonaws.com/deployment-artifacts/${collectionName}/images/tokens`;
  const tokenMetadataPath = `./deployment-artifacts/${collectionName}/metadata/tokens`;
  try {
    const tokenMetadata = fs.readdirSync(tokenMetadataPath, {
      withFileTypes: true,
      recursive: true,
    });
    for (let i = 1; i < tokenMetadata.length + 1; i++) {
      const path = `${tokenMetadataPath}/${i}.json`;
      const metadata = JSON.parse(fs.readFileSync(path).toString());
      metadata.image = `${basePath}/${i}.jpeg`;
      fs.writeFileSync(path, JSON.stringify(metadata));
    }
    return tokenMetadataPath;
  } catch (error) {
    console.log("Error creating token metadata", error);
  }
}

async function deployCollection(collectionName, metadataUrl, tokenUrl) {
  const SEPOLIA_RPC_URL = process.env.SEPOLIA_RPC_URL; // from sourcing .env file
  if (!SEPOLIA_RPC_URL) {
    console.error("SEPOLIA_RPC_URL not found");
    return;
  }
  const symbol = getInitials(collectionName);
  const command = `forge script --chain sepolia --rpc-url ${SEPOLIA_RPC_URL} --broadcast --verify -vvvv script/MultiToken.s.sol:MultiTokenScript  --sig "deploy(string memory _baseURI, string memory _contractMetedataURI, string memory _name, string memory _symbol)" ${tokenUrl} ${metadataUrl} ${collectionName} ${symbol}`;
  exec(command, (error, stdout, stderr) => {
    if (error) {
      console.error(`error: ${error.message}`);
      return;
    }
    if (stderr) {
      console.error(`stderr: ${stderr}`);
      return;
    }
    console.log(`stdout: ${stdout}`);
  });
}

async function main(options) {
  try {
    await uploadFolderToS3(
      `./deployment-artifacts/${options.collectionName}/images`
    );
    const imagesUrl = `https://${bucket}.s3.${region}.amazonaws.com/deployment-artifacts/${options.collectionName}/images`;

    const metadataPath = createContractMetadata(
      options.collectionName,
      imagesUrl
    );

    await uploadToS3(metadataPath);

    const tokenPath = createTokenMetadata(options.collectionName, imagesUrl);

    await uploadFolderToS3(tokenPath);

    const tokenUrl = `https://${bucket}.s3.${region}.amazonaws.com/deployment-artifacts/${options.collectionName}/metadata/tokens`;
    const metadataUrl = `https://${bucket}.s3.${region}.amazonaws.com/deployment-artifacts/${options.collectionName}/metadata/contract/metadata.json`;

    await deployCollection(options.collectionName, metadataUrl, tokenUrl); // comment this out if just want to update metdata
  } catch (error) {
    console.error("Error during script execution:", error.message);
  }
}

const args = process.argv.slice(2);
if (args.length > 0 && args[0] === "deploy") {
  main(program.opts()).catch((error) => {
    console.error("Error during script execution:", error.message);
  });
} else {
  program.help();
}
