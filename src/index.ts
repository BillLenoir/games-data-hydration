import dotenv from "dotenv";
import { hydrateData } from "./data-hydration";
import { prepareData } from "./data-preparation";

dotenv.config();

// Environmental variables
if (typeof process.env.BGG_USER === "undefined") {
  throw new Error(
    "Did not specify the BGG user. See BGG_USER in the .env file",
  );
}

if (typeof process.env.SAVED_DATA_FORMAT === "undefined") {
  throw new Error(
    "Did not specify how to save the data. See SAVED_DATA_FORMAT in the .env file",
  );
}

if (typeof process.env.NEED_TO_FETCH === "undefined") {
  throw new Error(
    "Did not specify whether or not to fetch new data. See NEED_TO_FETCH in the .env file",
  );
}

if (typeof process.env.WHERE_TO_SAVE === "undefined") {
  throw new Error(
    "Did not specify where to save the data. See WHERE_TO_SAVE in the .env file",
  );
}

const gameDataPromise = await prepareData(process.env.BGG_USER);

const gameData = JSON.stringify(gameDataPromise);

if (process.env.WHERE_TO_SAVE !== "locally") {
  void hydrateData(gameData).then(() => void 0);
}
