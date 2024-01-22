import { ComboEntityData } from "./interfaces";

export function processEntityData(
  arrayElement: ComboEntityData | undefined,
  thisId: number,
  thisBggId: number,
  thisBggName: string,
): ComboEntityData {
  const thisDesigner = {
    id: thisId,
    bggid: thisBggId,
    name: thisBggName,
  };
  if (arrayElement !== undefined && arrayElement.name !== thisBggName) {
    throw new Error(
      `We have two entities with the same BGG ID! ${arrayElement.name} and ${thisBggName}`,
    );
  }
  return thisDesigner;
}
