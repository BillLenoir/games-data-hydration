import { z } from "zod";

export const ComboEntityDataZ = z.object({
  id: z.number(),
  bggid: z.number(),
  name: z.string(),
});
export type ComboEntityData = z.infer<typeof ComboEntityDataZ>;

export const ComboGameDataZ = z.object({
  id: z.number(),
  bggid: z.number(),
  title: z.string(),
  yearpublished: z.string(),
  thumbnail: z.string(),
  description: z.string(),
  gameown: z.boolean(),
  gamewanttobuy: z.boolean(),
  gameprevowned: z.boolean(),
  gamefortrade: z.boolean(),
});
export type ComboGameData = z.infer<typeof ComboGameDataZ>;

export const ComboRelationshipDataZ = z.object({
  gameid: z.number(),
  entityid: z.number(),
  relationshiptype: z.string(),
});
export type ComboRelationshipData = z.infer<typeof ComboRelationshipDataZ>;

export const EntityDataZ = z.object({
  _attributes: z.object({
    objectid: z.number(),
  }),
  _text: z.string(),
  relationshiptype: z.string(),
});
export type EntityData = z.infer<typeof EntityDataZ>;

export const EntityGameDataSaveZ = z.object({
  entitydata: z.array(ComboEntityDataZ),
  gamedata: z.array(ComboGameDataZ),
  relationshipdata: z.array(ComboRelationshipDataZ),
});
export type EntityGameDataSave = z.infer<typeof EntityGameDataSaveZ>;

export const GameOnlyDataZ = z.object({
  id: z.string(),
  title: z.string(),
  yearpublished: z.string(),
  thumbnail: z.string().nullable(),
  publisher: z.array(z.string()),
  designer: z.array(z.string()),
  description: z.string(),
  gameown: z.boolean(),
  gamewanttobuy: z.boolean(),
  gameprevowned: z.boolean(),
  gamefortrade: z.boolean(),
});
export type GameOnlyData = z.infer<typeof GameOnlyDataZ>;

const AttributesZ = z.object({
  _text: z.string(),
});

const ItemZ = z.object({
  _attributes: z.object({
    objecttype: z.string(),
    objectid: z.number(),
    subtype: z.string(),
    collid: z.string(),
  }),
  name: z.object({
    _attributes: AttributesZ,
    _text: z.string(),
  }),
  yearpublished: AttributesZ,
  image: AttributesZ,
  thumbnail: AttributesZ,
  stats: z.object({
    _attributes: z.object({
      minplayers: z.string(),
      maxplayers: z.string(),
      minplaytime: z.string(),
      maxplaytime: z.string(),
      playingtime: z.string(),
      numowned: z.string(),
    }),
    rating: z.object({
      _attributes: AttributesZ,
      usersrated: z.object({
        _attributes: AttributesZ,
      }),
      average: z.object({
        _attributes: AttributesZ,
      }),
      bayesaverage: z.object({
        _attributes: AttributesZ,
      }),
      stddev: z.object({
        _attributes: AttributesZ,
      }),
      median: z.object({
        _attributes: AttributesZ,
      }),
    }),
  }),
  status: z.object({
    _attributes: z.object({
      own: z.string(),
      prevowned: z.string(),
      fortrade: z.string(),
      want: z.string(),
      wanttoplay: z.string(),
      wanttobuy: z.string(),
      wishlist: z.string(),
      preordered: z.string(),
      lastmodified: z.string(),
    }),
  }),
  numplays: AttributesZ,
});

export const BggGameDataZ = z.object({
  _declaration: z.object({
    _attributes: z.object({
      version: z.string(),
      encoding: z.string(),
      standalone: z.string(),
    }),
  }),
  items: z.object({
    _attributes: z.object({
      totalitems: z.string(),
      termsofuse: z.string(),
      pubdate: z.string(),
    }),
    item: z.array(ItemZ),
  }),
});
export type BggGameData = z.infer<typeof BggGameDataZ>;

// export interface EntityGameDataSave {
//   entitydata: ComboEntityData[];
//   gamedata: ComboGameData[];
//   relationshipdata: ComboRelationshipData[];
// }

// export interface ComboEntityData {
//   id: number;
//   bggid: number;
//   name: string;
// }

// export interface ComboGameData {
//   id: number;
//   bggid: number;
//   title: string;
//   yearpublished: string | null;
//   thumbnail: string;
//   description: string;
//   gameown: boolean;
//   gamewanttobuy: boolean;
//   gameprevowned: boolean;
//   gamefortrade: boolean;
// }

// export interface ComboRelationshipData {
//   gameid: number;
//   entityid: number;
//   relationshiptype: string;
// }

// export interface EntityData {
//   _attributes: {
//     objectid: number;
//   };
//   _text: string;
//   relationshiptype: string;
// }

// export interface GameOnlyData {
//   id: string;
//   title: string;
//   yearpublished: string;
//   thumbnail: string;
//   publisher: string[];
//   designer: string[];
//   description: string;
//   gameown: boolean;
//   gamewanttobuy: boolean;
//   gameprevowned: boolean;
//   gamefortrade: boolean;
// }

// This types what is returned from BGG for a game in my collection
// export interface BggGameData {
//   _declaration: {
//     _attributes: {
//       version: string;
//       encoding: string;
//       standalone: string;
//     };
//   };
//   items: {
//     _attributes: {
//       totalitems: string;
//       termsofuse: string;
//       pubdate: string;
//     };
//     item: Array<{
//       _attributes: {
//         objecttype: string;
//         objectid: number;
//         subtype: string;
//         collid: string;
//       };
//       name: {
//         _attributes: Attributes;
//         _text: string;
//       };
//       yearpublished: Attributes;
//       image: Attributes;
//       thumbnail: Attributes;
//       stats: {
//         _attributes: {
//           minplayers: string;
//           maxplayers: string;
//           minplaytime: string;
//           maxplaytime: string;
//           playingtime: string;
//           numowned: string;
//         };
//         rating: {
//           _attributes: Attributes;
//           usersrated: {
//             _attributes: Attributes;
//           };
//           average: {
//             _attributes: Attributes;
//           };
//           bayesaverage: {
//             _attributes: Attributes;
//           };
//           stddev: {
//             _attributes: Attributes;
//           };
//           median: {
//             _attributes: Attributes;
//           };
//         };
//       };
//       status: {
//         _attributes: {
//           own: string;
//           prevowned: string;
//           fortrade: string;
//           want: string;
//           wanttoplay: string;
//           wanttobuy: string;
//           wishlist: string;
//           preordered: string;
//           lastmodified: string;
//         };
//       };
//       numplays: Attributes;
//     }>;
//   };
// }

// interface Attributes {
//   _text: string;
// }
