"use client"

import React from "react"
import { UserIcon } from "../ui/user"
import { Play } from "@/types/play"
import { ActivityIcon } from "../ui/activity"

interface PlayProfileProps {
	play: Play
}

const PlayProfile: React.FC<PlayProfileProps> = ({ play }) => {
	return (
		<div>
			<div className="m-8 gap-2 overflow-hidden grid items-center flex flex-col justify-center sm:grid-cols-[280px] md:grid-cols-[280px,280px] lg:grid-cols-[280px,560px]">
				<div className="w-[280px] items-center justify-center">
					{play.poster ? (
						<img
							className="h-[415px] w-full object-cover object-end group-hover:brightness-105 transition duration-300 ease-in-out"
							src={play.poster}
							alt="image"
						/>
					) : (
						<div className="h-[415px] w-full bg-muted object-cover object-end flex items-center justify-center rounded-lg">
							{" "}
							<ActivityIcon />{" "}
						</div>
					)}
				</div>
				<div className="w-[280px] lg:w-[560px] text-foreground text-left shadow-2xl p-4">
					<p className="mt-2 mb-2 text-lg font-semibold">{play.title}</p>
					<p className="text-gray-400 text-sm tracking-wide mb-4">
						{play.format} &#8226; {play.genre}
					</p>
                    <p>{play.description}</p>
				</div>
			</div>
		</div>
	)
}

export default PlayProfile
