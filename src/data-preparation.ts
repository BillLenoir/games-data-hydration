import fs from "fs/promises";
import fetch from "node-fetch";
import convert from "xml-js";
import { GameDataRead, GameDataSave } from "./interfaces";

const bggBaseURL = process.env.BGG_URL ?? "https://boardgamegeek.com/xmlapi/";

export async function prepareData(username: string) {
  // Fetch the data from BGG.
  const rawResponse = await fetchData("collection", username);

  if (typeof rawResponse === "undefined") {
    throw new Error("There was no response from BGG");
  }

  if (
    rawResponse.includes(
      "Your request for this collection has been accepted and will be processed",
    ) === true
  ) {
    throw new Error(
      "Your request for this collection has been accepted and will be processed.  Please try again later for access.",
    );
  }

  // Save the response.
  const rawResponseFile: string = "./data/rawResponse.xml";
  if (typeof rawResponse != "undefined") {
    await fs.writeFile(rawResponseFile, rawResponse);
  } else {
    throw new Error("The raw response is undefined");
  }
  console.log(
    "\x1b[32m%s\x1b[0m",
    "I wrote the raw response XML file for the collection data!",
  );

  // Transform the response
  console.log(rawResponse);
  const convertedResponse = convert.xml2json(rawResponse, {
    compact: true,
    spaces: 2,
  });
  const collectionData: GameDataRead = JSON.parse(convertedResponse);
  console.log("\x1b[32m%s\x1b[0m", "I transformed the collection data!");

  // Process the returned list of games
  const parsedDataFile = "./data/collectionData.json";
  const parsedData: GameDataSave[] = await parseCollectionData(collectionData);

  // Save the final output. Still need to tigger hydration.
  const writeableParsedData = JSON.stringify(parsedData);
  await fs.writeFile(parsedDataFile, writeableParsedData);
  console.log(
    "\x1b[32m%s\x1b[0m",
    "I wrote the parsed data file for the collection data!",
  );

  return parsedData;
}

export async function parseCollectionData(
  collectionData: GameDataRead,
): Promise<GameDataSave[]> {
  console.log("\x1b[32m%s\x1b[0m", "Begin processing each game...");
  // An array where each element is parsed data for a single game.
  const parsedCollectionData: GameDataSave[] = [];

  // This cycles through the collection data, one game at a time.
  for (const game of collectionData.items.item) {
    // Will only process games that I own, want, previously owned, or want to sell or trade
    if (
      game.status._attributes.own === "1" ||
      game.status._attributes.want === "1" ||
      game.status._attributes.prevowned === "1" ||
      game.status._attributes.fortrade === "1"
    ) {
      // Extract the data from the transformation colleciton data request..
      let gameID: string = "";
      if (game._attributes.objectid != undefined) {
        gameID = game._attributes.objectid;
      }

      let gameTitle: string = "";
      if (game.name._text != undefined) {
        gameTitle = game.name._text;
      }

      let gameYearPublished: string = "";
      if (game.yearpublished != undefined) {
        gameYearPublished = game.yearpublished._text;
      }

      let gameThumbnail: string = "";
      if (game.thumbnail != undefined) {
        gameThumbnail = game.thumbnail._text;
      }

      let gameOwn: boolean = false;
      if (game.status._attributes.own === "1") {
        gameOwn = true;
      }

      let gameWantToBuy: boolean = false;
      if (game.status._attributes.want === "1") {
        gameWantToBuy = true;
      }

      let gamePrevOwned: boolean = false;
      if (game.status._attributes.prevowned === "1") {
        gamePrevOwned = true;
      }

      let gameForTrade: boolean = false;
      if (game.status._attributes.fortrade === "1") {
        gameForTrade = true;
      }

      // Fetch additional game data.
      let retryFetch = true;
      let rawResponseGameData = await fetchData("boardgame", gameID);

      const rawResponseGameDataFile: string = `./data/game-data/game-${gameID}.xml`;
      if (typeof rawResponseGameData != "undefined") {
        await fs.writeFile(rawResponseGameDataFile, rawResponseGameData);
        // Transform the game data response
        const convertedResponseGameData = convert.xml2json(
          rawResponseGameData,
          {
            compact: true,
            spaces: 4,
          },
        );
        const parsedGameData = JSON.parse(convertedResponseGameData);

        // These are the elements that we extract from the additional call.
        let gameDescription: string = "";
        if (
          parsedGameData.boardgames.boardgame.description._text != undefined
        ) {
          gameDescription =
            parsedGameData.boardgames.boardgame.description._text;
        }

        // Some games have more than 1 publisher and the data structure for this differs
        // If it is an array, that means there's more than one.
        let gamePublisher: string[] = [];
        if (
          parsedGameData.boardgames.boardgame.boardgamepublisher[0] != undefined
        ) {
          for (const publisher of parsedGameData.boardgames.boardgame
            .boardgamepublisher) {
            gamePublisher.push(publisher._text);
          }
        } else {
          gamePublisher[0] =
            parsedGameData.boardgames.boardgame.boardgamepublisher._text;
        }

        // If the collection request didn't return a thumbnail,
        // maybe the game request did. (maybe)
        if (
          gameThumbnail === "" &&
          parsedGameData.boardgames.boardgame.thumbnail != undefined
        ) {
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
        if (retryFetch === true) {
          console.log(`Retrying the fetch of ${gameID}'s data`);
          rawResponseGameData = await fetchData("boardgame", gameID);
          retryFetch = false;
        } else {
          retryFetch = true;
          console.error(
            "\x1b[31m%s\x1b[0m",
            `!!!! Tried twice to fetch ${gameID}'s data, but it failed each time, so data is not saved for this game`,
          );
        }
      }
    } else {
      console.log(`-- This game doesn't count: ${game.name._text}`);
    }
  }
  console.log("\x1b[32m%s\x1b[0m", "... done processing the games");

  return parsedCollectionData;
}

export async function fetchData(path: string, paramater: string) {
  const requestUrl = `${bggBaseURL}${path}/${paramater}`;
  //  const response = await fetch(requestUrl);
  let response;
  try {
    response = await fetch(requestUrl);
  } catch (error) {
    console.error(
      "\x1b[31m%s\x1b[0m",
      `An error occurred during the fetch: ${error}`,
    );
    // Handle the error as needed
  }

  if (typeof response != "undefined") {
    //    console.log(`Done fetching ${paramater}, => ${response.body}`);
    let rawResponse;
    try {
      rawResponse = await response.text();
    } catch (error) {
      console.error(
        "\x1b[31m%s\x1b[0m",
        `An error occurred with the response: ${error}`,
      );
    }
    return rawResponse;
  }
}
