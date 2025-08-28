import { CharacterActor } from "./characterActor";
import { CharacterPlay } from "./characterPlay";

export interface Character {
  characterId?: number;
  name?: string;
  description?: string;
  age?: number;              // <-- aquí el cambio
  gender?: string;
  principal?: boolean;
  image?: string;
  actor?: CharacterActor;
  play?: CharacterPlay;
}
