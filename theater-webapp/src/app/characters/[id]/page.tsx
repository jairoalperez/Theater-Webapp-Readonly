"use client"

import React from "react"
import { useParams, useRouter } from "next/navigation"
import axios from "axios"
import { cn } from "@/lib/utils"
import { LoaderPinwheelIcon } from "@/components/ui/loader-pinwheel"
import { Sleep } from "@/helpers/sleep"
import { Character } from "@/types/character"
import CharacterProfile from "@/components/Characters/CharacterProfile"
import dotenv from "dotenv"
dotenv.config();
const apiUrl = process.env.NEXT_PUBLIC_API_BASE_URL

const CharacterPage: React.FC = () => {
	const params = useParams()
	const id = params?.id

	const [character, setCharacter] = React.useState<Character | null>(null)
	const [loading, setLoading] = React.useState<boolean>(true)
	const [error, setError] = React.useState<string | null>(null)

	React.useEffect(() => {
		if (id) {
			let config = {
				method: "get",
				url: `${apiUrl}/characters/${id}`,
			}

			axios
				.request(config)
				.then(async (response) => {
					setCharacter(response.data)
					await Sleep(500)
					setLoading(false)
				})
				.catch(async (error) => {
					setError(`${error.status} Error fetching data: ${error.response.data}`)
					await Sleep(500)
					setLoading(false)
				})
		} else {
			setError(`No id`)
			setLoading(false)
		}
	}, [id])

	return loading ? (
		<div className="flex justify-center">
			<div className={cn("mx-auto flex flex-col items-center p-4")}>
				<div className="h-56 w-full object-cover object-end flex items-center justify-center">
					<LoaderPinwheelIcon isAnimating={true} />
				</div>
			</div>
		</div>
	) : error ? (
		<div className="flex justify-center">
			<div className={cn("mx-auto flex flex-col items-center p-4")}>
				<div className="h-56 w-full object-cover object-end flex items-center justify-center">
					<div className="text-foreground">{error}</div>
				</div>
			</div>
		</div>
	) : (
		<div>
			<div className="flex justify-center pb-16">
				<div className="mx-auto flex flex-col items-center">
                    {character && <CharacterProfile character={character} />}
                </div>
			</div>
		</div>
	)
}

export default CharacterPage
