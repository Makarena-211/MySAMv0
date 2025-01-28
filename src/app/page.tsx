'use client'
import Image from 'next/image'

import {
	Table,
	TableBody,
	TableCaption,
	TableCell,
	TableFooter,
	TableHead,
	TableHeader,
	TableRow,
} from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from '@/components/ui/dialog'
import {
	Form,
	FormControl,
	FormDescription,
	FormField,
	FormItem,
	FormLabel,
	FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { UIEvent, useEffect, useState } from 'react'
import { z } from 'zod'
import { set, useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'

import { useMutation, useQuery } from '@tanstack/react-query'

import {
	Tooltip,
	TooltipContent,
	TooltipProvider,
	TooltipTrigger,
} from '@/components/ui/tooltip'
import { useToast } from '@/hooks/use-toast'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { MRIViewer } from '@/components/home/scan-view'

// export const fetchGames = async (): Promise<Game[]> => {
//   const response = await fetch("http://localhost:8000/games");
//   if (!response.ok) {
//     throw new Error("Network response was not ok");
//   }
//   return JSON.parse(await response.json());
// };

const IMAGES = [
	'https://prod-images-static.radiopaedia.org/images/13655026/ec94148eda8e1556ae7d1c0558b01c_big_gallery.jpeg',
	'https://prod-images-static.radiopaedia.org/images/13655043/a2919fa916463afa7c5e3ad9558d9e_big_gallery.jpeg',
	'https://prod-images-static.radiopaedia.org/images/13655058/2fd7c8e4fffb33a31b13858642d4e4_big_gallery.jpeg',
	'https://prod-images-static.radiopaedia.org/images/13655079/1221c482451d0d2cb37502459dda11_big_gallery.jpeg',
	'https://prod-images-static.radiopaedia.org/images/13655093/cdc8af52851dc1796dd2e8f747b6b5_big_gallery.jpeg',
	'https://prod-images-static.radiopaedia.org/images/13655111/961dd24d2ff31a99803793f5185252_big_gallery.jpeg',
	'https://prod-images-static.radiopaedia.org/images/13655126/c433410955a740520c8f94b34e79f5_big_gallery.jpeg',
	'https://prod-images-static.radiopaedia.org/images/13655148/cb32bfab7daf889ae19d7318b3fe91_big_gallery.jpeg',
	'https://prod-images-static.radiopaedia.org/images/13655183/99969f32484716e94d94c5a749e40e_big_gallery.jpeg',
	'https://prod-images-static.radiopaedia.org/images/13655191/5ee899a6d461b5d5f57a50b7c6a13b_big_gallery.jpeg',
	'https://prod-images-static.radiopaedia.org/images/13655201/b9bd795a3fa12adc0be6aa76196a83_big_gallery.jpeg',
]

export default function Home() {
	// const form = useForm<z.infer<typeof WineEvaluationSchema>>({
	//   resolver: zodResolver(WineEvaluationSchema),
	//   defaultValues: {
	//     fixed_acidity: 7.4,
	//     volatile_acidity: 0.7,
	//     citric_acid: 0.0,
	//     residual_sugar: 1.9,
	//     chlorides: 0.085,
	//     free_sulfur_dioxide: 11,
	//     total_sulfur_dioxide: 30,
	//     density: 0.9978,
	//     pH: 3.2,
	//     sulphates: 0.56,
	//     alcohol: 9.4,
	//   },
	// });

	// const {
	//   data: games,
	//   isLoading,
	//   isError,
	//   error,
	// } = useQuery({
	//   queryKey: ["games"],
	//   queryFn: fetchGames,
	// });

	const { toast } = useToast()

	const [image, setImage] = useState(IMAGES[0])

	const handleScroll = (e: any) => {
		console.log(e)
	}

	const nextImage = () => {
		const index = IMAGES.indexOf(image)
		setImage(IMAGES[(index + 1) % IMAGES.length])
	}

	const prevImage = () => {
		const index = IMAGES.indexOf(image)
		setImage(IMAGES[(index - 1) % IMAGES.length])
	}

	return (
		<div className="flex flex-col items-center min-h-screen pt-10 pb-20 gap-16 font-[family-name:var(--font-geist-sans)]">
			<h1 className="font-medium text-xl">MRI Scanner</h1>

			{/* <div
        className="w-[500px] h-[500px] aspect-square relative bg-contain"
        onScroll={handleScroll}
        style={{
          backgroundImage: `url(${image})`,
        }}
      ></div>

      <div className="flex gap-4">
        <Button onClick={prevImage} size="icon">
          <ChevronLeft />
        </Button>
        <Button onClick={nextImage} size="icon">
          <ChevronRight />
        </Button>
      </div> */}

			{/* <MRIViewer images={[]}/> */}
		</div>
	)
}
