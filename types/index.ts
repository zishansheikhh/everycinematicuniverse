export interface TimelineMovie {
  title: string;
  year: string;
  releaseYear: string;
  imdbID?: string;
  phase: string;
  note: string;
}

export interface TimelineUniverse {
  label: string;
  color: string;
  glow: string;
  icon: string;
  description: string;
  movies: TimelineMovie[];
}

export type TimelineUniverseKey =
  | "mcu"
  | "starwars"
  | "dcu"
  | "universalmonsters"
  | "conjuring"
  | "startrek"
  | "johnwick"
  | "missionimpossible"
  | "terminator"
  | "spiderverse"
  | "dcanimated"
  | "harrypotter"
  | "lordoftherings"
  | "jurassicpark"
  | "piratesofthecaribbean"
  | "xmen"
  | "hasbro"
  | "tmnt"
  | "matrix"
  | "ghostbusters"
  | "lego"
  | "hellboy"
  | "fastandfurious"
  | "meninblack"
  | "monsterverse"
  | "bourne"
  | "planetoftheapes"
  | "rohitshetty"
  | "crimecity"
  | "dragonball"
  | "onepiece"
  | "krrish"
  | "kungfupanda"
  | "shingodzilla"
  | "makotoshinkai"
  | "jamesbond"
  | "sherlock"
  | "insidious"
  | "evildead"
  | "despicable"
  | "gameofthrones"
  | "alienpredator"
  | "mhcu"
  | "yrfspy";

export type TimelineUniverses = Record<TimelineUniverseKey, TimelineUniverse>;

export type PhaseColorMap = Record<string, string>;
