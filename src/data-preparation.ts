import fs from 'fs/promises';
import fetch from 'node-fetch';
import convert from 'xml-js';
import { GameDataRead, GameDataSave } from './interfaces';

const bggBaseURL = process.env.BGG_URL ?? 'https://boardgamegeek.com/xmlapi/';

export async function prepareData(username: string): Promise<void> {

  // Fetch the data from BGG.
  const rawResponse: string = await fetchData('collection', username);

  // Save the response.
  const rawResponseFile: string = './data/rawResponse.xml';
  await fs.writeFile(rawResponseFile, rawResponse);
  console.log('I wrote the raw response XML file for the collection data!');

  // Transform the response
  const convertedResponse = convert.xml2json(rawResponse, { compact: true, spaces: 2 });
  const collectionData: GameDataRead = JSON.parse(convertedResponse);
  console.log('I transformed the collection data!');

  // Process the returned list of games
  const parsedDataFile = './data/collectionData.json';
  const parsedData: GameDataSave[] = await parseCollectionData(collectionData);

  // Save the final output. Still need to tigger hydration.
  const writeableParsedData = JSON.stringify(parsedData);
  await fs.writeFile(parsedDataFile, writeableParsedData);
  console.log('I wrote the parsed data file for the collection data!');

}

export async function parseCollectionData(collectionData: GameDataRead): Promise<GameDataSave[]> {

  // An array where each element is parsed data for a single game.
  const parsedCollectionData: GameDataSave[] = [];

  // This cycles through the collection data, one game at a time.
  for (const game of collectionData.items.item) {

    // Will only process games that I own, want, previously owned, or want to sell or trade
    if (game.status._attributes.own === '1' || game.status._attributes.want === '1' || game.status._attributes.prevowned === '1' || game.status._attributes.fortrade === '1') {

      // Extract the data from the transformation colleciton data request..
      let gameID: string = '';
      if (game._attributes.objectid != undefined) {
        gameID = game._attributes.objectid;
      }

      let gameTitle: string = '';
      if (game.name._text != undefined) {
        gameTitle = game.name._text;
      }

      let gameYearPublished: string = '';
      if (game.yearpublished != undefined) {
        gameYearPublished = game.yearpublished._text;
      }

      let gameThumbnail: string = '';
      if (game.thumbnail != undefined) {
        gameThumbnail = game.thumbnail._text;
      }

      let gameOwn: boolean = false;
      if (game.status._attributes.own === '1') {
        gameOwn = true;
      }

      let gameWantToBuy: boolean = false;
      if (game.status._attributes.want === '1') {
        gameWantToBuy = true;
      }

      let gamePrevOwned: boolean = false;
      if (game.status._attributes.prevowned === '1') {
        gamePrevOwned = true;
      }

      let gameForTrade: boolean = false;
      if (game.status._attributes.fortrade === '1') {
        gameForTrade = true;
      }

      // Fetch additional game data.
      const rawResponseGameData = await fetchData('boardgame', gameID);

      const rawResponseGameDataFile: string = `./data/game-data/game-${gameID}.xml`;
      await fs.writeFile(rawResponseGameDataFile, rawResponseGameData);

      // Transform the game data response
      const convertedResponseGameData = convert.xml2json(rawResponseGameData, { compact: true, spaces: 4 });
      const parsedGameData = JSON.parse(convertedResponseGameData);

      // These are the elements that we extract from the additional call.
      let gameDescription: string = '';
      if (parsedGameData.boardgames.boardgame.description._text != undefined) {
        gameDescription = parsedGameData.boardgames.boardgame.description._text;
      }

      // Some games have more than 1 publisher and the data structure for this differs
      // If it is an array, that means there's more than one.
      let gamePublisher: string = '';
      if (parsedGameData.boardgames.boardgame.boardgamepublisher[0] != undefined) {
        const publisherArray = [];
        for (const publisher of parsedGameData.boardgames.boardgame.boardgamepublisher) {
          publisherArray.push(publisher._text);
          gamePublisher = publisherArray.join('xxxxx');
        }
      } else {
        gamePublisher = parsedGameData.boardgames.boardgame.boardgamepublisher._text;
      }

      // If the collection request didn't return a thumbnail,
      // maybe the game request did. (maybe)
      if (gameThumbnail === '' && parsedGameData.boardgames.boardgame.thumbnail != undefined) {
        gameThumbnail = parsedGameData.boardgames.boardgame.thumbnail;
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

export async function fetchData(path: string, paramater: string) {

  const requestUrl = `${bggBaseURL}${path}/${paramater}`;
  const response = await fetch(requestUrl);

  if (response.status === 500 || response.status === 503) {
    throw new Error ('BGG is pitching a fit about request frequency. Try again in 15 minutes');
  } else if (!response.ok) {
    throw new Error(`HTTP error! Status: ${response.status}, ${response.statusText}`);
  }

  const rawResponse = await response.text();
  return rawResponse;

}
