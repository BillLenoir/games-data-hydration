import { ComboRelationshipData } from "./interfaces";

export function processRelationshipData(
  data: string,
  currentIdCount: number,
): ComboRelationshipData {
  const thisData = JSON.parse(data);
  if (thisData[0] === undefined) {
    const thisBggId = thisData._attributes.objectid;
    const thisBggName = thisData._text;
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
      relationshiptype: "Designer",
    };
    parsedRelationshipData.push(thisRelationship);
  } else {
    // for (const designer of gameData.boardgames.boardgame.boardgamedesigner) {
    //   const thisBggId = designer._attributes.objectid;
    //   const thisBggName = designer._text;
    //   if (parsedEntityData[thisBggId] === undefined) {
    //     parsedEntityData[thisBggId] = processEntityData(
    //       parsedEntityData[thisBggId],
    //       idCount,
    //       thisBggId,
    //       thisBggName,
    //     );
    //   }
    //   const thisRelationship = {
    //     gameid: thisGameId,
    //     entityid: parsedEntityData[thisBggId].id,
    //     relationshiptype: "Designer",
    //   };
    //   parsedRelationshipData.push(thisRelationship);
    // }
  }
  return true;
}
