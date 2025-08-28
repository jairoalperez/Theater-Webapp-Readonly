import NavigationBar from "@/components/navigation-bar";
import { AspectRatio } from "@radix-ui/react-aspect-ratio";
import React, {useEffect, useState} from "react";
import Image from "next/image"

const Home: React.FC = () => {
  return (
    <div className="flex justify-center mt-8">
      <AspectRatio ratio={16 / 9} className="bg-muted">
        <Image src={"https://images.unsplash.com/photo-1588345921523-c2dcdb7f1dcd?w=800&dpr=2&q=80"} alt={"Photo by Drew Beamer"} fill className="h-full w-full rounded-md object-cover" />
      </AspectRatio>
    </div>
  )
}

export default Home;