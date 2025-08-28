"use client"

import React from "react"
import { PlayCharacter } from "@/types/playCharacter"
import { UserIcon } from "../ui/user"

interface PlayCharacterProps {
	character: PlayCharacter
}

const PlayCharacterCard: React.FC<PlayCharacterProps> = ({ character }) => {
	return (
		<div className="relative group w-[280px] l-[280px] bg-card hover:bg-primary text-foreground border border-border rounded-lg overflow-hidden shadow-2xl transition duration-300 ease-in-out cursor-pointer">
			<div className="grid grid-cols-2">
				<div>
					{character?.image ? (
						<img
							className="h-[140px] w-[140px] object-cover object-end brightness-75 group-hover:brightness-105 transition duration-300 ease-in-out"
							src={character?.image}
							alt="image"
						/>
					) : (
						<div className="h-[140px] w-[140px] bg-muted object-cover object-end flex items-center justify-center">
							{" "}
							<UserIcon />{" "}
						</div>
					)}
				</div>
				<div>
					{character?.actor?.frontImage ? (
						<img
							className="h-[140px] w-[140px] object-cover object-end brightness-75 group-hover:brightness-105 transition duration-300 ease-in-out"
							src={character?.actor?.frontImage}
							alt="image"
						/>
					) : (
						<div className="h-[140px] w-[140px] bg-muted object-cover object-end flex items-center justify-center">
							{" "}
							<UserIcon />{" "}
						</div>
					)}
				</div>
			</div>
            <div className="w-[280px] l-[140px] text-left">
                <p className="ml-4 mb-1 mt-4 font-semibold text-lg leading-tight truncate">{character?.name}</p>
                <p className="ml-4 mb-4 text-gray-400 text-sm tracking-wide">{character?.actor?.firstName} {character?.actor?.lastName}</p>
            </div>
            {character?.principal ? <div className="absolute bottom-2 right-2 bg-orange-300 text-orange-800 inline-block py-1 px-2 text-xs rounded-full uppercase font-bold tracking-wide group-hover:bg-card group-hover:text-foreground transition duration-300 ease-in-out">Principal</div> : <div></div>}
		</div>
	)
}

export default PlayCharacterCard
