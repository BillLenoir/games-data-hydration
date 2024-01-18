import fs from "fs/promises";
import fetch from "node-fetch";
import convert from "xml-js";
import { fetchData } from "./fetch-data";
import {
  BggGameData,
  EntityGameDataSave,
  ComboEntityData,
  ComboGameData,
  ComboRelationshipData,
  EntityData,
} from "./interfaces";
import { processEntityData } from "./process-entity-data";

export async function prepareEntityGameData(
  collectionData: BggGameData,
): Promise<EntityGameDataSave> {
  console.log("\x1b[32m%s\x1b[0m", "Begin processing each game...");
  // An array where each element is parsed data for a single game.
  let parsedEntityData: ComboEntityData[] = [];
  const parsedGameData: ComboGameData[] = [];
  const parsedRelationshipData: ComboRelationshipData[] = [];

  // This cycles through the collection data, one game at a time.
  let idCount = 1;
  for (const game of collectionData.items.item) {
    // Will only process games that I own, want, previously owned, or want to sell or trade
    if (
      game.status._attributes.own === "1" ||
      game.status._attributes.want === "1" ||
      game.status._attributes.prevowned === "1" ||
      game.status._attributes.fortrade === "1"
    ) {
      // Extract the data from the transformation colleciton data request..
      const thisGameId = idCount++;
      let bggGameID: number;
      if (game._attributes.objectid === undefined) {
        throw new Error(
          "BGG claims there is no ID for this game. Something is WRONG!",
        );
      } else {
        bggGameID = game._attributes.objectid;
      }

      let gameTitle: string = "";
      if (game.name._text !== undefined) {
        gameTitle = game.name._text;
      }

      let gameYearPublished: number | null = null;
      if (game.yearpublished !== undefined) {
        gameYearPublished = game.yearpublished._text;
      }

      let gameThumbnail: string = "";
      if (game.thumbnail !== undefined) {
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
      let rawResponseGameData = await fetchData("boardgame", bggGameID);

      const rawResponseGameDataFile: string = `./data/game-data/game-${bggGameID}.xml`;
      if (typeof rawResponseGameData !== "undefined") {
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
        const gameData = JSON.parse(convertedResponseGameData);

        // These are the elements that we extract from the additional call.
        let gameDescription: string = "";
        if (gameData.boardgames.boardgame.description._text !== undefined) {
          gameDescription = gameData.boardgames.boardgame.description._text;
        }

        // If the collection request didn't return a thumbnail,
        // maybe the game request did. (maybe)
        if (
          gameThumbnail === "" &&
          gameData.boardgames.boardgame.thumbnail !== undefined
        ) {
          gameThumbnail = gameData.boardgames.boardgame.thumbnail;
        }

        // This is the JSON extracted for each game.
        const gameJSON: ComboGameData = {
          id: thisGameId,
          bggid: bggGameID,
          title: gameTitle,
          yearpublished: gameYearPublished,
          thumbnail: gameThumbnail,
          description: gameDescription,
          gameown: gameOwn,
          gamewanttobuy: gameWantToBuy,
          gameprevowned: gamePrevOwned,
          gamefortrade: gameForTrade,
        };

        parsedGameData.push(gameJSON);

        // Processing entities.
        // Designers
        console.log(
          gameData.boardgames.boardgame.boardgamedesigner._attributes.objectid,
        );
        if (gameData.boardgames.boardgame.boardgamedesigner !== undefined) {
          processRelationshipData(
            gameData.boardgames.boardgame.boardgamedesigner,
            idCount,
            thisGameId,
            "Designer",
          );
        }

        // Publishers
        if (gameData.boardgames.boardgame.boardgamepublisher !== undefined) {
          if (
            gameData.boardgames.boardgame.boardgamepublisher[0] === undefined
          ) {
            const thisBggId =
              gameData.boardgames.boardgame.boardgamepublisher._attributes
                .objectid;
            const thisBggName =
              gameData.boardgames.boardgame.boardgamepublisher._text;
            if (parsedEntityData[thisBggId] === undefined) {
              parsedEntityData[thisBggId] = processEntityData(
                parsedEntityData[thisBggId],
                idCount,
                thisBggId,
                thisBggName,
              );
            }
            const thisRelationship = {
              gameid: thisGameId,
              entityid: parsedEntityData[thisBggId].id,
              relationshiptype: "Publisher",
            };
            parsedRelationshipData.push(thisRelationship);
          } else {
            for (const publisher of gameData.boardgames.boardgame
              .boardgamepublisher) {
              const thisBggId = publisher._attributes.objectid;
              const thisBggName = publisher._text;
              if (parsedEntityData[thisBggId] === undefined) {
                parsedEntityData[thisBggId] = processEntityData(
                  parsedEntityData[thisBggId],
                  idCount,
                  thisBggId,
                  thisBggName,
                );
              }
              const thisRelationship = {
                gameid: thisGameId,
                entityid: parsedEntityData[thisBggId].id,
                relationshiptype: "Publisher",
              };
              parsedRelationshipData.push(thisRelationship);
            }
          }
        }

        // Game Family
        if (gameData.boardgames.boardgame.boardgamefamily !== undefined) {
          if (gameData.boardgames.boardgame.boardgamefamily[0] === undefined) {
            const thisBggId =
              gameData.boardgames.boardgame.boardgamefamily._attributes
                .objectid;
            const thisBggName =
              gameData.boardgames.boardgame.boardgamefamily._text;
            if (parsedEntityData[thisBggId] === undefined) {
              parsedEntityData[thisBggId] = processEntityData(
                parsedEntityData[thisBggId],
                idCount,
                thisBggId,
                thisBggName,
              );
            }
            const thisRelationship = {
              gameid: thisGameId,
              entityid: parsedEntityData[thisBggId].id,
              relationshiptype: "Game Family",
            };
            parsedRelationshipData.push(thisRelationship);
          } else {
            for (const gamefamily of gameData.boardgames.boardgame
              .boardgamefamily) {
              const thisBggId = gamefamily._attributes.objectid;
              const thisBggName = gamefamily._text;
              if (parsedEntityData[thisBggId] === undefined) {
                parsedEntityData[thisBggId] = processEntityData(
                  parsedEntityData[thisBggId],
                  idCount,
                  thisBggId,
                  thisBggName,
                );
              }
              const thisRelationship = {
                gameid: thisGameId,
                entityid: parsedEntityData[thisBggId].id,
                relationshiptype: "Game Family",
              };
              parsedRelationshipData.push(thisRelationship);
            }
          }
        }
      } else {
        if (retryFetch === true) {
          console.log(`Retrying the fetch of ${bggGameID}'s data`);
          rawResponseGameData = await fetchData("boardgame", bggGameID);
          retryFetch = false;
        } else {
          retryFetch = true;
          console.error(
            "\x1b[31m%s\x1b[0m",
            `!!!! Tried twice to fetch ${bggGameID}'s data, but it failed each time, so data is not saved for this game`,
          );
        }
      }
    } else {
      console.log(`-- This game doesn't count: ${game.name._text}`);
    }
  }
  console.log("\x1b[32m%s\x1b[0m", "... done processing the games");

  parsedEntityData = parsedEntityData.filter((entity) => entity !== undefined);

  const parsedEntityGameData: EntityGameDataSave = {
    entitydata: parsedEntityData,
    gamedata: parsedGameData,
    relationshipdata: parsedRelationshipData,
  };
  console.log(`Entities processed: ${parsedEntityData.length}`);
  console.log(`Games processed: ${parsedGameData.length}`);
  console.log(`Relationships processed: ${parsedRelationshipData.length}`);

  function processRelationshipData(
    data: EntityData | EntityData[],
    currentIdCount: number,
    thisGameId: number,
    thisRelationship: string,
  ): void {
    let thisDesigner;
    if (data[0] === undefined) {
      const thisBggId = data._attributes.objectid;
      const thisBggName = data._text;
      if (parsedEntityData[thisBggId] === undefined) {
        console.log("this is undefined");
        thisDesigner = {
          id: idCount++,
          bggid: thisBggId,
          name: thisBggName,
        };
        if (
          parsedEntityData[thisBggId] !== undefined &&
          parsedEntityData[thisBggId].name !== thisBggName
        ) {
          throw new Error(
            `We have two entities with the same BGG ID! ${parsedEntityData[thisBggId].name} and ${thisBggName}`,
          );
        }
      }
      parsedEntityData.push
      console.log(thisDesigner);
      const newRelationship = {
        gameid: thisGameId,
        entityid: parsedEntityData[thisBggId].id,
        relationshiptype: thisRelationship,
      };
      parsedRelationshipData.push(newRelationship);
    } else {
      for (const entity of data) {
        const parsedEntity = JSON.parse(entity);
        const thisBggId = parsedEntity._attributes.objectid;
        const thisBggName = parsedEntity._text;
        if (parsedEntityData[thisBggId] === undefined) {
          parsedEntityData[thisBggId] = processEntityData(
            parsedEntityData[thisBggId],
            idCount,
            thisBggId,
            thisBggName,
          );
        }
        const newRelationship = {
          gameid: thisGameId,
          entityid: parsedEntityData[thisBggId].id,
          relationshiptype: thisRelationship,
        };
        parsedRelationshipData.push(newRelationship);
      }
    }
  }

  return parsedEntityGameData;
}
