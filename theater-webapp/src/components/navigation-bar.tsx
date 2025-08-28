import {
	NavigationMenu,
	NavigationMenuContent,
	NavigationMenuIndicator,
	NavigationMenuItem,
	NavigationMenuLink,
	NavigationMenuList,
	NavigationMenuTrigger,
	navigationMenuTriggerStyle,
	NavigationMenuViewport,
} from "@/components/ui/navigation-menu"
import Link from "next/link"
import { buttonVariants } from "./ui/button"
import { cn } from "@/lib/utils"

const NavigationBar: React.FC = () => {
	return (
		<section className="py-4">
			<div className="container">
				<nav className="hiddn justify-between lg:flex">
					<div className="flex items-center gap-6">
						<div className="flex items-center gap-2 whitespace-nowrap">
							<span className="text-xl font-semibold ml-8">Theater App</span>
						</div>
						<div className="flex items-center">
							<a
								href="/actors"
								className={`${cn(
									"text-muted-foreground",
									navigationMenuTriggerStyle,
									buttonVariants({
										variant: "ghost",
									})
								)}`}
							>
								Actors
							</a>
							<a
								href="/plays"
								className={`${cn(
									"text-muted-foreground",
									navigationMenuTriggerStyle,
									buttonVariants({
										variant: "ghost",
									})
								)}`}
							>
								Plays
							</a>
						</div>
					</div>
				</nav>
			</div>
		</section>

		// <div className="flex justify-center">
		// <NavigationMenu>
		// 	<NavigationMenuList>
		//     <NavigationMenuItem>
		// 			<Link href="/actors" legacyBehavior passHref>
		//                 <NavigationMenuLink className={`${navigationMenuTriggerStyle()} text-lg`}>
		//                     Actors
		//                 </NavigationMenuLink>
		//             </Link>
		// 		</NavigationMenuItem>
		//         <NavigationMenuItem>
		// 			<Link href="/plays" legacyBehavior passHref>
		//                 <NavigationMenuLink className={`${navigationMenuTriggerStyle()} text-lg`}>
		//                     Plays
		//                 </NavigationMenuLink>
		//             </Link>
		// 		</NavigationMenuItem>
		// 	</NavigationMenuList>
		// </NavigationMenu>
		// </div>
	)
}

export default NavigationBar
