export interface GameDataSave {
  id: string;
  title: string;
  yearpublished: string;
  thumbnail: string;
  publisher: string[];
  description: string;
  gameown: boolean;
  gamewanttobuy: boolean;
  gameprevowned: boolean;
  gamefortrade: boolean;

}

// This types what is returned from BGG for a game in my collection
export interface GameDataRead {
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