import { hydrateData } from './data-hydration';
import { prepareData } from './data-preparation';

// The BGG user ID is an optional paramater when running the system.
// If not present, set to my user name.
let user: string;
if (process.argv[2] != null) {
  user = process.argv[2];
} else {
  user = 'BillLenoir';
}

const gameDataPromise = await prepareData(user);
const gameData = JSON.stringify(gameDataPromise);

void hydrateData(gameData).then(() => void 0);
