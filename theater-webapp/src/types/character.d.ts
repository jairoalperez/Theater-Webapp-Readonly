import { CharacterActor } from "./characterActor";
import { CharacterPlay } from "./characterPlay";

export interface Character {
    characterId?: number;
    name?: string;
    description?: string;
    age?: string;
    gender?: string;
    principal?: boolean;
    image?: string;
    actor?: CharacterActor;
    play?: CharacterPlay;
}