import fs from "fs/promises";
import fetch from "node-fetch";
import convert from "xml-js";
import { fetchData } from "./fetch-data";
import { BggGameData, GameOnlyData } from "./interfaces";

export async function prepareGameOnlyData(
  collectionData: BggGameData,
): Promise<GameOnlyData[]> {
  console.log("\x1b[32m%s\x1b[0m", "Begin processing each game...");
  // An array where each element is parsed data for a single game.
  const parsedCollectionData: GameOnlyData[] = [];

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
        // const parsedGameDataFile: string = `./data/game-data/game-${gameID}.json`;
        // await fs.writeFile(parsedGameDataFile, convertedResponseGameData);
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

        // Ditto for game designers, though there may not be any designer listed.
        let gameDesigner: string[] = [];
        if (
          parsedGameData.boardgames.boardgame.boardgamedesigner === undefined
        ) {
          gameDesigner.push("No designer listed");
        } else if (
          parsedGameData.boardgames.boardgame.boardgamedesigner[0] != undefined
        ) {
          for (const designer of parsedGameData.boardgames.boardgame
            .boardgamedesigner) {
            gameDesigner.push(designer._text);
          }
        } else {
          gameDesigner[0] =
            parsedGameData.boardgames.boardgame.boardgamedesigner._text;
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
        const gameJSON: GameOnlyData = {
          id: gameID,
          title: gameTitle,
          yearpublished: gameYearPublished,
          thumbnail: gameThumbnail,
          publisher: gamePublisher,
          designer: gameDesigner,
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
