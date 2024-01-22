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
  EntityDataZ,
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
      const thisGameId = idCount++;

      // Extract the data from the transformation colleciton data request..
      // BGG Game ID
      let bggGameID = 0;
      if (game._attributes.objectid === undefined) {
        console.error(`BGG claims there is no ID for this game: ${game}`);
      } else {
        bggGameID = game._attributes.objectid;
      }

      // Game Title
      let gameTitle = "Not Title for this game";
      if (game.name._text !== undefined) {
        gameTitle = game.name._text;
      }

      let gameYearPublished = "No year indicated";
      if (game.yearpublished !== undefined) {
        gameYearPublished = game.yearpublished._text;
      }

      let gameThumbnail = null;
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

      const rawResponseGameDataFile = `./data/game-data/game-${bggGameID}.xml`;
      if (rawResponseGameData !== undefined) {
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
        const fullGameData = JSON.parse(convertedResponseGameData);
        const gameData = fullGameData.boardgames.boardgame;

        // These are the elements that we extract from the additional call.
        let gameDescription = "";
        if (gameData.description._text !== undefined) {
          gameDescription = gameData.description._text;
        }

        // If the collection request didn't return a thumbnail,
        // maybe the game request did. (maybe)
        if (gameThumbnail === "" && gameData.thumbnail !== undefined) {
          gameThumbnail = gameData.thumbnail;
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

        // Start processing entities and relationships
        const entityArray: EntityData[] = [];
        // const entitiesToProcess = [];
        // if (boardgame.boardgamedesigner !== undefined) {
        //   entitiesToProcess.push({
        //     data: boardgame.boardgamedesigner,
        //     relationshiptype: "Designer",
        //   });
        // }
        // if (gameData.boardgames.boardgame.boardgamepublisher !== undefined) {
        //   const entityData = EntityDataZ.parse(
        //     gameData.boardgames?.boardgame.boardgamepublisher,
        //   );
        //   entitiesToProcess.push({
        //     data: entityData,
        //     relationshiptype: "Publisher",
        //   });
        // }
        // for (const entityType of entitiesToProcess) {
        //   const newEntities: EntityData[] = buildEntityArray(
        //     entityType.data,
        //     entityType.relationshiptype,
        //   );
        //   processEntitiesAndRelationships(newEntities, thisGameId);
        // }

        // Processing entities.
        // Designers
        if (gameData.boardgamedesigner !== undefined) {
          let gameDesigner = Array.isArray(gameData.boardgamedesigner)
            ? gameData.boardgamedesigner
            : [gameData.boardgamedesigner];
          for (const entity of gameDesigner) {
            entity.relationshiptype = "Designer";
            entityArray.push(entity);
          }
        }

        // Publishers
        if (gameData.boardgamepublisher !== undefined) {
          if (Array.isArray(gameData.boardgamepublisher)) {
            for (const entity of gameData.boardgamepublisher) {
              entity.relationshiptype = "Publisher";
              entityArray.push(entity);
            }
          } else {
            gameData.boardgamepublisher.relationshiptype = "Publisher";
            entityArray.push(gameData.boardgamepublisher);
          }
        }

        if (entityArray.length > 0) {
          processEntitiesAndRelationships(entityArray, thisGameId);
        }

        // Game Family
        // if (gameData.boardgames.boardgame.boardgamefamily !== undefined) {
        //   if (gameData.boardgames.boardgame.boardgamefamily[0] === undefined) {
        //     const thisBggId =
        //       gameData.boardgames.boardgame.boardgamefamily._attributes
        //         .objectid;
        //     const thisBggName =
        //       gameData.boardgames.boardgame.boardgamefamily._text;
        //     if (parsedEntityData[thisBggId] === undefined) {
        //       parsedEntityData[thisBggId] = processEntityData(
        //         parsedEntityData[thisBggId],
        //         idCount,
        //         thisBggId,
        //         thisBggName,
        //       );
        //     }
        //     const thisRelationship = {
        //       gameid: thisGameId,
        //       entityid: parsedEntityData[thisBggId].id,
        //       relationshiptype: "Game Family",
        //     };
        //     parsedRelationshipData.push(thisRelationship);
        //   } else {
        //     for (const gamefamily of gameData.boardgames.boardgame
        //       .boardgamefamily) {
        //       const thisBggId = gamefamily._attributes.objectid;
        //       const thisBggName = gamefamily._text;
        //       if (parsedEntityData[thisBggId] === undefined) {
        //         parsedEntityData[thisBggId] = processEntityData(
        //           parsedEntityData[thisBggId],
        //           idCount,
        //           thisBggId,
        //           thisBggName,
        //         );
        //       }
        //       const thisRelationship = {
        //         gameid: thisGameId,
        //         entityid: parsedEntityData[thisBggId].id,
        //         relationshiptype: "Game Family",
        //       };
        //       parsedRelationshipData.push(thisRelationship);
        //     }
        //   }
        // }
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

  // function buildEntityArray(
  //   data: EntityData[],
  //   relationshiptype: string,
  // ): EntityData[] {
  //   const theseEntities = [];
  //   if (Array.isArray(data)) {
  //     for (const entity of data) {
  //       entity.relationshiptype = relationshiptype;
  //       theseEntities.push(entity);
  //     }
  //   } else {
  //     data.relationshiptype = relationshiptype;
  //     theseEntities.push(data);
  //   }
  //   return theseEntities;
  // }

  function processEntitiesAndRelationships(
    entityArray: EntityData[],
    thisGameId: number,
  ) {
    for (const entity of entityArray) {
      if (parsedEntityData[entity._attributes.objectid] === undefined) {
        const newEntity: ComboEntityData = {
          id: idCount++,
          bggid: entity._attributes.objectid,
          name: entity._text,
        };
        parsedEntityData[entity._attributes.objectid] = newEntity;
      } else if (
        parsedEntityData[entity._attributes.objectid].name !== entity._text
      ) {
        throw new Error(
          `We have two entities with the same BGG ID! ${
            parsedEntityData[entity._attributes.objectid].name
          } and ${entity._text}`,
        );
      }
      const newRelationship = {
        gameid: thisGameId,
        entityid: entity._attributes.objectid,
        relationshiptype: entity.relationshiptype,
      };
      parsedRelationshipData.push(newRelationship);
    }
  }

  return parsedEntityGameData;
}
