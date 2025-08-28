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
    frontImage?: string;
    fullBodyImage?: string;
    characters?: actorCharacter[];
}