import dotenv from "dotenv";
import { hydrateData } from "./data-hydration";
import { prepareData } from "./data-preparation";

dotenv.config();

// Environmental variables
const user: string | undefined = process.env.BGG_USER;
if (typeof user === "undefined") {
  throw new Error("Did not specify the BGG user");
}

const whereToSave: string | undefined = process.env.WHERE_TO_SAVE;
if (typeof whereToSave === "undefined") {
  throw new Error("Did not specify where to save the data");
}

// Start the clock ticking to record how long this takes
const startTime = performance.now();

const gameDataPromise = await prepareData(user);

const gameData = JSON.stringify(gameDataPromise);

if (whereToSave !== "locally") {
  void hydrateData(gameData).then(() => void 0);
}

const endTime = performance.now();

console.log(
  "\x1b[47m%s\x1b[0m",
  `Processing took ${endTime - startTime} miliseconds`,
);
