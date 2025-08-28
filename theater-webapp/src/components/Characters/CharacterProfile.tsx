"use client"

import React, { useEffect, useState } from "react"
import { UserIcon } from "../ui/user"
import { Character } from "@/types/character"
import { Card, CardHeader, CardTitle } from "../ui/card"
import { cn } from "@/lib/utils"
import { ActivityIcon } from "../ui/activity"

interface CharacterProfileProps {
	character: Character
}

const CharacterProfile: React.FC<CharacterProfileProps> = ({ character }) => {
	return (
		<div>
			<div className="ml-8 mr-8 mt-8 gap-2 overflow-hidden grid sm:grid-cols-1 md:grid-cols-2 items-center flex flex-col items-center justify-center">
				<div className="w-[280px] text-center items-center justify-center">
					<div className="relative">
						{character?.image ? (
							<img
								className="h-[280px] w-[280px] rounded-lg object-cover object-end brightness-75 group-hover:brightness-105 transition duration-300 ease-in-out"
								src={character?.image}
								alt="image"
							/>
						) : (
							<div className="h-[280px] w-[280px] rounded-lg bg-muted object-cover object-end flex items-center justify-center">
								{" "}
								<UserIcon />{" "}
							</div>
						)}
						{character?.principal ? (
							<div className="absolute bottom-4 right-4 bg-orange-300 text-orange-800 inline-block py-1 px-4 text-xs rounded-full uppercase font-bold tracking-wide">
								Principal
							</div>
						) : (
							<div></div>
						)}
						<span
							className={`${
								character?.gender === "Female"
									? "bg-pink-200 text-pink-800"
									: character?.gender === "Male"
									? "bg-cyan-200 text-cyan-800"
									: "bg-gray-200 text-gray-800"
							} absolute bottom-4 left-4 inline-block py-1 px-4 text-xs rounded-full uppercase font-bold tracking-wide`}
						>
							{character?.gender}
						</span>
					</div>
				</div>
				<div className="w-[280px] text-foreground bg-card text-center shadow-2xl border border-border rounded-lg p-4 flex flex-col items-center justify-center">
					<div className="mt-2">
						<p className="text-lg font-semibold white-space text-nowrap">{character?.name}</p>
						<p className="text-sm text-gray-500 mb-4">({character?.age} YEARS)</p>
					</div>
					<p>{character?.description}</p>
				</div>
				<div className="w-[280px] text-center items-center justify-center">
					<div className="relative">
						{character?.actor?.frontImage ? (
							<img
								className="h-[280px] w-[280px] rounded-lg object-cover object-end brightness-75 group-hover:brightness-105 transition duration-300 ease-in-out"
								src={character?.actor?.frontImage}
								alt="image"
							/>
						) : (
							<div className="h-[280px] w-[280px] rounded-lg bg-muted object-cover object-end flex items-center justify-center">
								{" "}
								<UserIcon />{" "}
							</div>
						)}
						<div className="absolute bottom-4 text-white text-center w-full">
							<p className="text-lg font-semibold white-space text-nowrap">
								{character?.actor?.firstName} {character?.actor?.lastName}
							</p>
						</div>
					</div>
				</div>
				<div className="w-[280px] text-center items-center justify-center">
					{character?.play?.poster ? (
						<img
							className="h-[415px] w-[280px] rounded-lg object-cover object-end brightness-75 group-hover:brightness-105 transition duration-300 ease-in-out"
							src={character?.play?.poster}
							alt="image"
						/>
					) : (
						<div className="h-[415px] w-[280px] rounded-lg bg-muted object-cover object-end flex items-center justify-center">
							{" "}
							<ActivityIcon />{" "}
						</div>
					)}
				</div>
			</div>
		</div>
	)
}

export default CharacterProfile
