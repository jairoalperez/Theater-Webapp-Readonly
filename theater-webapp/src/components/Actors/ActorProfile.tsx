"use client"

import React, { useEffect, useState } from "react"
import { UserIcon } from "../ui/user"
import { Actor } from "@/types/actor"
import { Card, CardHeader, CardTitle } from "../ui/card"
import { cn } from "@/lib/utils"

interface ActorProfileProps {
	actor: Actor
}

const ActorProfile: React.FC<ActorProfileProps> = ({ actor }) => {
	return (
		<div>
			<div className="ml-8 mr-8 mt-8 overflow-hidden grid sm:grid-cols-1 md:grid-cols-[280px,280px] lg:grid-cols-[560px,158px] gap-2 items-center">
				<div className="grid sm:grid-cols-1 md:grid-cols-1 lg:grid-cols-2 gap-2">
					{actor.frontImage ? (
						<img
							className="h-[280px] w-[280px] rounded-lg object-cover object-end group-hover:brightness-105 transition duration-300 ease-in-out"
							src={actor.frontImage}
							alt="image"
						/>
					) : (
						<div className="h-[280px] w-[280px] rounded-lg bg-muted object-cover object-end flex items-center justify-center">
							{" "}
							<UserIcon />{" "}
						</div>
					)}
					<div className="rounded-lg w-[280px] h-[280px] flex flex-col items-center bg-card text-foreground border border-border shadow-2xl">
						<h1 className="text-3xl whitespace-nowrap font-semibold mt-4 leading-tight truncate">
							{actor?.firstName} {actor?.lastName}
						</h1>
						<span className="text-gray-500 mb-4 text-sm">({actor.dob})</span>
						<div className="text-center mb-8 flex flex-row">
							<span className="text-md font-semibold mr-2">{actor.age}</span>
							<span
								className={`inline-block ${
									actor.gender === "Female"
										? "bg-pink-200 text-pink-800"
										: actor.gender === "Male"
										? "bg-cyan-200 text-cyan-800"
										: "bg-gray-200 text-gray-800"
								} py-1 px-4 text-xs rounded-full uppercase font-bold tracking-wide group-hover:bg-card group-hover:text-foreground transition duration-300 ease-in-out`}
							>
								{actor.gender}
							</span>
						</div>

						<div className="w-[230px] grid grid-cols gap-x-4 text-left">
							<div className="mt-2 flex flex-row items-center justify-between">
								<span className="font-semibold">Skin</span>
								<span>{actor.skinColor}</span>
							</div>
							<div className="mt-2 flex flex-row items-center justify-between">
								<span className="font-semibold">Eyes</span>
								<span>{actor.eyeColor}</span>
							</div>
							<div className="mt-2 flex flex-row items-center justify-between">
								<span className="font-semibold">Hair</span>
								<span>{actor.hairColor}</span>
							</div>
						</div>
					</div>
				</div>
				<div>
					{actor.fullBodyImage ? (
						<img
							className="lg:h-[280px] h-[498px] lg:w-[158px] md:w-[280px] rounded-lg object-cover object-end group-hover:brightness-105 transition duration-300 ease-in-out"
							src={actor.fullBodyImage}
							alt="image"
						/>
					) : (
						<div className="lg:h-[280px] h-[498px] lg:w-[158px] md:w-[280px] rounded-lg bg-muted object-cover object-end flex items-center justify-center">
							{" "}
							<UserIcon />{" "}
						</div>
					)}
				</div>
			</div>
		</div>
	)
}

export default ActorProfile
