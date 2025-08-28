"use client"

import React from "react"
import { actorCharacter } from "@/types/actorCharacter"
import { UserIcon } from "../ui/user"

interface ActorCharacterCardProps {
	character: actorCharacter
}

const ActorCharacterCard: React.FC<ActorCharacterCardProps> = ({ character }) => {
	return (
		<div className="group w-[280px] h-[280px] relative isolate flex flex-col justify-end overflow-hidden bg-card hover:bg-primary text-foreground border border-border rounded-lg overflow-hidden shadow-2xl transition duration-300 ease-in-out cursor-pointer">
			{character?.image ? (
				<img
					src="actor.frontImage"
					alt="image"
					className="h-full w-full object-cover object-end brightness-75 group-hover:brightness-105 transition duration-300 ease-in-out"
				/>
			) : (
				<div className="h-full w-full bg-muted object-cover object-end flex items-center justify-center">
					{" "}
					<UserIcon />{" "}
				</div>
			)}
			{character?.principal ? <div className="absolute top-4 right-4 bg-orange-300 text-orange-800 inline-block py-1 px-4 text-xs rounded-full uppercase font-bold tracking-wide group-hover:bg-card group-hover:text-foreground transition duration-300 ease-in-out">Principal</div> : <div></div>}
			<div className="absolute bottom-4 left-4 text-white">
				<h2 className="text-md font-bold">{character?.name}</h2>
				<p className="text-xs">{character?.playTitle} - {character?.playFormat}</p>
			</div>
		</div>
	)
}

export default ActorCharacterCard
