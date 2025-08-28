import { actorCharacter } from "./actorCharacter";

export interface Actor {
  actorId?: number;
  firstName?: string;
  lastName?: string;
  dob?: string;
  age?: number;
  gender?: string;
  skinColor?: string;
  eyeColor?: string;
  hairColor?: string;
  frontImage?: string;      // usa undefined cuando no hay imagen
  fullBodyImage?: string;   // idem
  characters?: actorCharacter[];
  principals?: number;      // <-- NUEVO: cantidad de personajes principales
}
