"use client"

import React from "react"
import { PlayShort } from "@/types/playShort"
import { ActivityIcon } from "../ui/activity"

interface PlayCardProps {
	play: PlayShort
}

const PlayCard: React.FC<PlayCardProps> = ({ play }) => {
	return (
		<div className="group w-[280px] bg-card hover:bg-primary text-foreground border border-border rounded-lg overflow-hidden shadow-2xl transition duration-300 ease-in-out cursor-pointer">
			{play.poster ? (
				<img
					className="h-[415px] w-full object-cover object-end brightness-75 group-hover:brightness-105 transition duration-300 ease-in-out"
					src={play.poster}
					alt="image"
				/>
			) : (
				<div className="h-[415px] w-full bg-muted object-cover object-end flex items-center justify-center">
					{" "}
					<ActivityIcon />{" "}
				</div>
			)}
			<div className="p-6">
				<h4 className="mb-4 font-semibold text-lg leading-tight truncate">{play.title}</h4>
				<div className="flex items-baseline">
					<div className="text-gray-400 text-xs tracking-wide">
						{play.format} &#8226; {play.genre}
					</div>
				</div>
				<div className="flex items-baseline">
					<div className="text-gray-400 text-xs tracking-wide">{play.characters} Characters</div>
				</div>
			</div>
		</div>
	)
}

export default PlayCard
