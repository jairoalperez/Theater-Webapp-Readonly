export interface CharacterActor {
  actorId: number;
  firstName: string;
  lastName: string;
  gender?: string;      // opcional también, ya que puede faltar
  frontImage?: string;  // <-- hacerlo opcional
}
