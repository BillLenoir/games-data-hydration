import * as fs from 'fs/promises';
import fetch from 'node-fetch';
import * as convert from 'xml-js';

const bggBaseURL = 'https://boardgamegeek.com/xmlapi/';

interface GameDataSave {
  id: string;
  title: string;
  yearpublished: string;
  thumbnail: string;
  publisher: string;
  description: string;
  gameown: boolean;
  gamewanttobuy: boolean;
  gameprevowned: boolean;
  gamefortrade: boolean;

}

// This types what is returned from BGG for a game in my collection
interface GameDataRead {
  _declaration: {
    _attributes: {
      version: string;
      encoding: string;
      standalone: string;
    };
  };
  items: {
    _attributes: {
      totalitems: string;
      termsofuse: string;
      pubdate: string;
    };
    item: {
      _attributes: {
        objecttype: string;
        objectid: string;
        subtype: string;
        collid: string;
      };
      name: {
        _attributes: Attributes;
        _text: string;
      };
      yearpublished: Attributes;
      image: Attributes;
      thumbnail: Attributes;
      stats: {
        _attributes: {
          minplayers: string;
          maxplayers: string;
          minplaytime: string;
          maxplaytime: string;
          playingtime: string;
          numowned: string;
        };
        rating: {
          _attributes: Attributes;
          usersrated: {
            _attributes: Attributes;
          };
          average: {
            _attributes: Attributes;
          };
          bayesaverage: {
            _attributes: Attributes;
          };
          stddev: {
            _attributes: Attributes;
          };
          median: {
            _attributes: Attributes;
          };
        };
      };
      status: {
        _attributes: {
          own: string;
          prevowned: string;
          fortrade: string;
          want: string;
          wanttoplay: string;
          wanttobuy: string;
          wishlist: string;
          preordered: string;
          lastmodified: string;
        };
      };
      numplays: Attributes;
    };
  }[];
}

interface Attributes {
  _text: string;
}

// This is the main function. It triggers all of the work needed
// to request, transform, process, and save the collection data.
async function fetchAndProcessCollectionData(username: string): Promise<void> {
  // Fetch the data from BGG.
  const collectionData: GameDataRead[] = await fetchCollectionDataFromBGG(username);
  const rawDataFile = './data/rawData.json';
  let message = 'Raw Data File';

  // Write the transformed response from BGG to disk.
  await writeDataToFile(rawDataFile, collectionData, message);

  // Process the returned list of games
  const parsedData: GameDataSave[] = await parseData(collectionData);

  const parsedDataFile = './data/collectionData.json';
  message = 'Parsed Data File';

  await writeDataToFile(parsedDataFile, parsedData, message);
}

// Requests the data from BGG, which returns XML.
// Transform the XML into JSON and return it.
async function fetchCollectionDataFromBGG(username: string) {
  const collectionDataURL: string = `${bggBaseURL}collection/${username}`;
  const response = await fetch(collectionDataURL);

  console.log(response.status);

  if (!response.ok) {
    throw new Error(`HTTP error! Status: ${response.status}`);
  }

  const xmlData = await response.text();
  const responseData = convert.xml2json(xmlData, { compact: true, spaces: 2 });
  const returnData = JSON.parse(responseData);
  return returnData;
}

// Handles all writing to disk.
async function writeDataToFile(file: string, data: (GameDataRead | GameDataSave)[], message: string): Promise<void> {
  await fs.writeFile(file, JSON.stringify(data));
  console.log(`${message} successfully written`);
}

// Once the collection request has been returned and transformed,
// extract each game's games data and request additional data from BGG.
async function parseData(collectionData: GameDataRead[]) {
  const parsedCollectionData: GameDataSave[] = [];

  for (const game of collectionData.items.item) {
    // Data from the collection request.
    // There's no guarantee that the response
    // will contain all of the needed elements.

    const gameID: string = game._attributes.objectid;

    const gameTitle: string = game.name._text;

    let gameYearPublished: string = '';
    if (game.yearpublished != null) {
      gameYearPublished = game.yearpublished._text;
    }

    let gameThumbnail: string = '';
    if (game.thumbnail != null) {
      gameThumbnail = game.thumbnail._text;
    }

    const gameData = await fetchGameDataFromBGG(gameID);

    // Data from the game request

    let gameDescription: string = '';
    if (gameData.boardgames.boardgame.description._text != null) {
      gameDescription = gameData.boardgames.boardgame.description._text;
    }

    // Some games have more than 1 publisher and the data structure for this differs
    // If it is an array, that means there's more than one. We extract just the publisher
    // name, adding it to an array which is then joined and saved as gamePublisher.
    let gamePublisher: string = '';
    if (gameData.boardgames.boardgame.boardgamepublisher[0] != null) {
      const publisherArray = [];
      for (const publisher of gameData.boardgames.boardgame.boardgamepublisher) {
        publisherArray.push(publisher._text);
        gamePublisher = publisherArray.join('xxxxx');
      }
    } else {
      gamePublisher = gameData.boardgames.boardgame.boardgamepublisher._text;
    }

    // If the collection request didn't return a thumbnail,
    // maybe the game request did. (maybe)
    if (gameThumbnail === null && gameData.boardgames.boardgame.thumbnail != null) {
      gameThumbnail = gameData.boardgames.boardgame.thumbnail;
    }

    // The games relationship to my collection
    let gameOwn: boolean = false;
    let gameWantToBuy: boolean = false;
    let gamePrevOwned: boolean = false;
    let gameForTrade: boolean = false;

    if (game.status._attributes.own === '1') {
      gameOwn = true;
    }

    if (game.status._attributes.want === '1') {
      gameWantToBuy = true;
    }

    if (game.status._attributes.prevowned === '1') {
      gamePrevOwned = true;
    }

    if (game.status._attributes.fortrade === '1') {
      gameForTrade = true;
    }

    // This is the JSON extracted for each game.
    const gameJSON: GameDataSave = {
      id: gameID,
      title: gameTitle,
      yearpublished: gameYearPublished,
      thumbnail: gameThumbnail,
      publisher: gamePublisher,
      description: gameDescription,
      gameown: gameOwn,
      gamewanttobuy: gameWantToBuy,
      gameprevowned: gamePrevOwned,
      gamefortrade: gameForTrade,
    };

    // Only record the data for the games I care about.
    if (gameOwn === true || gameWantToBuy === true || gamePrevOwned === true || gameForTrade === true) {
      parsedCollectionData.push(gameJSON);
    } else {
      console.log(`-- This game doesn't count: ${gameTitle}`);
    }
  }

  return parsedCollectionData;
}

// Not all of the data needed for the website is included in the collection request.
// When parsing the data, make a request for each game. (There's a bunch.)
async function fetchGameDataFromBGG(gameID: string) {
  const gameDataUrl = `${bggBaseURL}boardgame/${gameID}`;
  const response = await fetch(gameDataUrl);

  if (!response.ok) {
    throw new Error(`HTTP error! Status: ${response.status}`);
  }

  // As with the collection response, need to tranform the XML into JSON
  const xmlData = await response.text();
  const responseData = convert.xml2json(xmlData, { compact: true, spaces: 4 });
  const returnData = JSON.parse(responseData);
  return returnData;
}

// The BGG user ID is an optional paramater when running the system.
// If not present, set to my user name.
let user: string;
if (process.argv[2] != null) {
  user = process.argv[2];
} else {
  user = 'BillLenoir';
}

void fetchAndProcessCollectionData(user);