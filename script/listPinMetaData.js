require("dotenv").config();
const pinataSDK = require("@pinata/sdk");
const { program } = require("commander");

const pinata = new pinataSDK(
  process.env.PINATA_API_KEY,
  process.env.PINATA_SECRET_API_KEY
);

program
  .description("List pinned items on IPFS")
  .option("-h, --hashContains <hash>", "String that desired hashes must contain")
  .option("-ps, --pinStart <date>", "Earliest date content is allowed to have been pinned (ISO_8601 format)")
  .option("-pe, --pinEnd <date>", "Latest date content is allowed to have been pinned (ISO_8601 format)")
  .option("-us, --unpinStart <date>", "Earliest date content is allowed to have been unpinned (ISO_8601 format)")
  .option("-ue, --unpinEnd <date>", "Latest date content is allowed to have been unpinned (ISO_8601 format)")
  .option("-pmin, --pinSizeMin <size>", "Minimum byte size that pin record can have")
  .option("-pmax, --pinSizeMax <size>", "Maximum byte size that pin record can have")
  .option("-s, --status <status>", "Filter pins using 'all', 'pinned', or 'unpinned'")
  .option("-pl, --pageLimit <number>", "Limit the amount of results returned per page (default 10, max 1000)")
  .option("-po, --pageOffset <number>", "Record offset for pagination")
  .option("-mn, --metadataName <name>", "Metadata name filter")
  .option("-mk, --metadataKey <key>", "Metadata key filter")
  .option("-mv, --metadataValue <value>", "Metadata value filter")
  .option("-mo, --metadataOp <operation>", "Metadata operation filter (gt, gte, lt, lte, ne, eq, between, notBetween, like, notLike, iLike, notILike, regexp, iRegexp)")
  .option("-msv, --metadataSecondValue <value>", "Second value for 'between' and 'notBetween' operations")
  .parse(process.argv);

function isValidISODate(dateString) {
  return /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}.\d{3}Z$/.test(dateString);
}

async function listPinnedItems(options) {
  try {
    const filters = {};

    if (options.hashContains) filters.hashContains = options.hashContains;
    if (options.pinStart) {
      if (isValidISODate(options.pinStart)) {
        filters.pinStart = options.pinStart;
      } else {
        throw new Error("pinStart must be in valid ISO_8601 format.");
      }
    }
    if (options.pinEnd) {
      if (isValidISODate(options.pinEnd)) {
        filters.pinEnd = options.pinEnd;
      } else {
        throw new Error("pinEnd must be in valid ISO_8601 format.");
      }
    }
    if (options.unpinStart) {
      if (isValidISODate(options.unpinStart)) {
        filters.unpinStart = options.unpinStart;
      } else {
        throw new Error("unpinStart must be in valid ISO_8601 format.");
      }
    }
    if (options.unpinEnd) {
      if (isValidISODate(options.unpinEnd)) {
        filters.unpinEnd = options.unpinEnd;
      } else {
        throw new Error("unpinEnd must be in valid ISO_8601 format.");
      }
    }
    if (options.pinSizeMin) filters.pinSizeMin = options.pinSizeMin;
    if (options.pinSizeMax) filters.pinSizeMax = options.pinSizeMax;
    if (options.status) filters.status = options.status;
    if (options.pageLimit) filters.pageLimit = parseInt(options.pageLimit);
    if (options.pageOffset) filters.pageOffset = parseInt(options.pageOffset);

    if (options.metadataName || options.metadataKey || options.metadataValue || options.metadataOp) {
      filters.metadata = {};
      if (options.metadataName) filters.metadata.name = options.metadataName;
      if (options.metadataKey && options.metadataValue && options.metadataOp) {
        filters.metadata.keyvalues = {
          [options.metadataKey]: {
            value: options.metadataValue,
            op: options.metadataOp,
          },
        };
        if (options.metadataOp === 'between' || options.metadataOp === 'notBetween') {
          if (options.metadataSecondValue) {
            filters.metadata.keyvalues[options.metadataKey].secondValue = options.metadataSecondValue;
          } else {
            throw new Error("Second value is required for 'between' or 'notBetween' operations.");
          }
        }
      } else if (options.metadataKey || options.metadataValue || options.metadataOp) {
        throw new Error("Metadata key, value, and operation are all required together.");
      }
    }

    const result = await pinata.pinList(filters);
    result.rows.forEach((item) => {
      console.log(item);
    });
  } catch (error) {
    console.error("Error listing pinned items:", error.message);
  }
}

// Check if the script is run with the "list" argument
const args = process.argv.slice(2);
if (args.length > 0 && args[0] === "list") {
  listPinnedItems(program.opts());
} else {
  program.help();
}
