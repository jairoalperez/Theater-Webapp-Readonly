import { PlayCharacter } from "./playCharacter";

export interface Play {
  playId: number;
  title: string;
  genre?: string;
  format?: string;
  description?: string;
  poster?: string;
  scriptLink?: string; 
  reference?: string;  
  soundTrack?: string; 
  characters?: PlayCharacter[];
}