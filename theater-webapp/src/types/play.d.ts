import { PlayCharacter } from "./playCharacter";
import { PlayReference } from "./playReference";
import { PlaySoundTrack } from "./playSoundtrack";

export interface Play {
    playId: number;
    title: string;
    genre: string;
    format: string;
    description: string;
    poster: string;
    scriptLink: string;
    reference: PlayReference;
    characters: PlayCharacter[];
    soundTrack: PlaySoundTrack[];
}