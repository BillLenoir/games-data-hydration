import * as fs from 'fs/promises';
import fetch from 'node-fetch';
import * as convert from 'xml-js';
import { GameDataRead, GameDataSave } from './interfaces';

const bggBaseURL = process.env.BGG_URL ?? 'https://boardgamegeek.com/xmlapi/';

async function prepareData(username: string): Promise<void> {

  // Fetch the data from BGG.
  const rawResponseFile: string = './data/rawResponse.xml';
  const rawResponse: string = await fetchCollectionData(username);

  // Save the response.
  await fs.writeFile(rawResponseFile, rawResponse);
  console.log('Raw Response XML File successfully written!');

  // Transform the response
  const convertedResponse = convert.xml2json(rawResponse, { compact: true, spaces: 2 });
  const collectionData: GameDataRead = JSON.parse(convertedResponse);
  console.log('I transformed the data!');

  // Process the returned list of games
  const parsedDataFile = './data/collectionData.json';
  const parsedData: GameDataSave[] = await parseData(collectionData);

  // Save the final output. Still need to tigger hydration.
  const writeableParsedData = JSON.stringify(parsedData);
  await fs.writeFile(parsedDataFile, writeableParsedData);
  console.log('Parsed Data File successfully written!');

}

async function fetchCollectionData(username:string) {

  const requestURL: string = `${bggBaseURL}collection/${username}`;
  const response = await fetch(requestURL);

  if (!response.ok) {
    throw new Error(`HTTP error! Status: ${response.status}`);
  }

  const rawResponseText = await response.text();
  console.log('I fetched the data!');
  return rawResponseText;

}

// Once the collection request has been returned and transformed,
// extract each game's games data and request additional data from BGG.
async function parseData(collectionData: GameDataRead) {
  const parsedCollectionData: GameDataSave[] = [];

  for (const game of collectionData.items.item) {

    // Only care about games that I own, want, previously owned, or want to sell or trade
    if (game.status._attributes.own === '1' || game.status._attributes.want === '1' || game.status._attributes.prevowned === '1' || game.status._attributes.fortrade === '1') {

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

      parsedCollectionData.push(gameJSON);

    } else {
      console.log(`-- This game doesn't count: ${game.name._text}`);
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

void prepareData(user);