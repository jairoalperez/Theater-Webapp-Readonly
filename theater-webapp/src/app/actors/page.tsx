"use client"

import React from "react"
import { useParams, useRouter } from "next/navigation"
import axios from "axios"
import { cn } from "@/lib/utils"
import ActorCard from "@/components/Actors/ActorCard"
import { ActorShort } from "@/types/actorShort"
import Link from "next/link"
import { LoaderPinwheelIcon } from "@/components/ui/loader-pinwheel"
import { Sleep } from "@/helpers/sleep"
import * as dotenv from "dotenv"
dotenv.config();
const apiUrl = process.env.NEXT_PUBLIC_API_BASE_URL

const ActorsList: React.FC = () => {
	const [actors, setActors] = React.useState<ActorShort[]>([])

	const [loading, setLoading] = React.useState<boolean>(true)
	const [error, setError] = React.useState<string | null>(null)

	const [isModalOpen, setIsModalOpen] = React.useState(false)

	React.useEffect(() => {
		let config = {
			method: "get",
			url: `${apiUrl}/actors/all`,
		}
		console.log(`calling ${apiUrl}`)

		axios
			.request(config)
			.then(async (response) => {
				setActors(response.data)
				await Sleep(500)
				setLoading(false)
			})
			.catch(async (error) => {
				setError(`Error fetching data: ${error}`)
				await Sleep(500)
				setLoading(false)
			})
	}, [])

	return loading ? (
		<div className="flex justify-center">
			<div className={cn("mx-auto flex flex-col items-center p-4")}>
				<h1 className="text-4xl font-bold mx-auto mb-8 mt-8 text-foreground">Actors</h1>
				<div className="h-56 w-full object-cover object-end flex items-center justify-center">
					<LoaderPinwheelIcon isAnimating={true} />
				</div>
			</div>
		</div>
	) : error ? (
		<div className="flex justify-center">
			<div className={cn("mx-auto flex flex-col items-center p-4")}>
                <h1 className="text-4xl font-bold mx-auto mb-8 mt-8 text-foreground">Actors</h1>
				<div className="h-56 w-full object-cover object-end flex items-center justify-center">
					<div className="text-foreground">{error}</div>
				</div>
			</div>
		</div>
	) : (
		<div className="flex justify-center pb-16">
			<div className={cn("mx-auto flex flex-col items-center")}>
				<h1 className="text-4xl font-bold mx-auto mb-8 mt-8 text-foreground">Actors</h1>
				<div
					className={cn(
						"grid grid-cols-1 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 2xl:grid-cols-4 gap-4 p-4"
					)}
				>
					{actors.map((actor) => (
						<Link key={actor.actorId} href={`/actors/${actor.actorId}`}>
							<ActorCard actor={actor} />
						</Link>
					))}
				</div>
			</div>
		</div>
	)
}

export default ActorsList
