
export enum Screen {
  HOME = 'HOME',
  LORE = 'LORE',
  WRITER = 'WRITER'
}

export enum Genre {
  FANTASY = 'High Fantasy',
  SCI_FI = 'Science Fiction',
  MYSTERY = 'Noir Mystery',
  HORROR = 'Eldritch Horror',
  ROMANCE = 'Slow-burn Romance',
  CYBERPUNK = 'Cyberpunk',
  HISTORICAL = 'Historical Fiction',
  COMEDY = 'Satirical Comedy',
  SHAKESPEAREAN = 'Shakespeariano',
  FAIRY_TALE = 'Conto de fadas',
  PHILOSOPHICAL = 'Texto filosófico',
  AUTOBIOGRAPHICAL = 'Autobiográfico (1ª Pessoa)',
  ANIME = 'Shounen / Shoujo'
}

export enum SegmentType {
  START = 'Story Start',
  MIDDLE = 'Middle Development',
  END = 'Climax/Ending'
}

export enum SegmentLength {
  SHORT = 'Short (~200 words)',
  MEDIUM = 'Medium (~500 words)',
  LONG = 'Long (~1000 words)',
  GIGANTIC = 'Gigantosaurus (~5000 words)'
}

export interface StorySegment {
  id: string;
  text: string;
  type: SegmentType;
}

export interface LoreData {
  characters: string;
  world: string;
  extraInfo: string;
}

export interface StoryState {
  title: string;
  genre: Genre;
  lore: LoreData;
  segments: StorySegment[];
}
