export interface PlayCharacter {
    characterId: number;
    name: string;
    principal: boolean;
    image: string;
    actor: PlayCharacterActor;
}

interface PlayCharacterActor {
    actorId: number;
    firstName: string;
    lastName: string;
    frontImage: string;
}