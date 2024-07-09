const readline = require("readline");
const fs = require("fs");

function clearConsole() {
  process.stdout.write("\x1B[2J\x1B[0f");
}

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

async function getValidInput(promptText, validationFn = null) {
  let userInput;
  do {
    userInput = await askQuestion(promptText);
    if (userInput.trim().toLowerCase() !== "empty" && userInput.trim() !== "") {
      if (validationFn && !validationFn(userInput)) {
        console.log("Input is not in the correct format. Please try again.");
      } else {
        return userInput;
      }
    } else {
      return ""; // Allow empty input to keep existing content
    }
  } while (true);
}

function isIpfsFormat(input) {
  return input.startsWith("ipfs://");
}

async function main() {
  clearConsole();
  const name = await getValidInput("Enter contract collection name: ");
  const filePath = `metadata/contract-${name}.json`;

  let existingData = {};
  if (fs.existsSync(filePath)) {
    const update = await askQuestion(
      "File already exists. Do you want to update the metadata? (y/n): "
    );
    if (update.trim().toLowerCase() !== "y") {
      console.log("Exiting without updating metadata.");
      return;
    }

    // Read existing data
    existingData = JSON.parse(fs.readFileSync(filePath, "utf8"));
  }

  clearConsole();
  const description = await getValidInput("Enter description: ");
  clearConsole();
  const image = await getValidInput("Enter image (must start with ipfs://): ", isIpfsFormat);
  clearConsole();
  const bannerImage = await getValidInput("Enter banner image (must start with ipfs://): ", isIpfsFormat);
  clearConsole();
  const featuredImage = await getValidInput("Enter featured image (must start with ipfs://): ", isIpfsFormat);
  clearConsole();
  const externalLink = await getValidInput("Enter external link: ");
  clearConsole();
  const collaborators = ["0x0000000000000000000000000000000000000000"];

  const data = {
    name,
    description: description || existingData.description || "",
    image: image || existingData.image || "",
    banner_image: bannerImage || existingData.banner_image || "",
    featured_image: featuredImage || existingData.featured_image || "",
    external_link: externalLink || existingData.external_link || "",
    collaborators: existingData.collaborators || collaborators,
  };

  if (!fs.existsSync("metadata")) {
    fs.mkdirSync("metadata");
  }

  fs.writeFile(filePath, JSON.stringify(data, null, 4), (err) => {
    if (err) {
      console.error("Error writing to file", err);
    } else {
      console.log(`File ${filePath} created/updated successfully.`);
    }
  });
}

main();
