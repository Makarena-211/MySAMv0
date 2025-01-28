import { useEffect, useRef, useState } from 'react'
import { Button } from '../ui/button'
import axios from 'axios'

const convertBase64ToPixelArray = async (
	base64: string
): Promise<number[][]> => {
	return new Promise((resolve, reject) => {
		const img = new Image()
		img.src = base64

		img.onload = () => {
			const canvas = document.createElement('canvas')
			canvas.width = 512
			canvas.height = 512
			const ctx = canvas.getContext('2d')

			if (!ctx) {
				reject(new Error('Could not get canvas context'))
				return
			}

			// Draw image to canvas
			ctx.drawImage(img, 0, 0, 512, 512)

			// Get image data and convert to grayscale
			const imageData = ctx.getImageData(0, 0, 512, 512).data
			const pixelArray: number[][] = []

			for (let y = 0; y < 512; y++) {
				const row: number[] = []
				for (let x = 0; x < 512; x++) {
					const idx = (y * 512 + x) * 4
					// Convert RGB to grayscale using luminance formula
					const gray = Math.round(
						0.299 * imageData[idx] +
							0.587 * imageData[idx + 1] +
							0.114 * imageData[idx + 2]
					)
					row.push(gray)
				}
				pixelArray.push(row)
			}
			resolve(pixelArray)
		}

		img.onerror = (error) => {
			reject(new Error('Failed to load image'))
		}
	})
}

const MRIViewer = ({ images }: { images: string[] }) => {
	const [currentImageIndex, setCurrentImageIndex] = useState(0)
	const [isSubmitting, setIsSubmitting] = useState(false)
	const [masks, setMasks] = useState<([boolean[][]] | null)[]>(() =>
		new Array(images.length).fill(null)
	)
	const [points, setPoints] = useState<({ x: number; y: number } | null)[]>(
		() => new Array(images.length).fill(null)
	)
	const canvasRef = useRef<HTMLCanvasElement>(null)
	const POINT_RADIUS = 5
	const SCROLL_THRESHOLD = 100
	let accumulatedScroll = 0

	// Handle image navigation
	const showPreviousImage = () => {
		setCurrentImageIndex((prev) => Math.max(0, prev - 1))
	}

	const showNextImage = () => {
		setCurrentImageIndex((prev) => Math.min(images.length - 1, prev + 1))
	}

	// Handle scroll wheel navigation
	const handleScroll = (e: WheelEvent) => {
		accumulatedScroll += e.deltaY
		if (Math.abs(accumulatedScroll) >= SCROLL_THRESHOLD) {
			if (accumulatedScroll > 0) showNextImage()
			else showPreviousImage()
			accumulatedScroll = 0
		}
	}

	// Handle canvas click
	const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
		const canvas = canvasRef.current
		if (!canvas) return

		const rect = canvas.getBoundingClientRect()
		const scaleX = canvas.width / canvas.offsetWidth
		const scaleY = canvas.height / canvas.offsetHeight

		const x = (e.clientX - rect.left) * scaleX
		const y = (e.clientY - rect.top) * scaleY

		setPoints((prev) => {
			const newPoints = [...prev]
			newPoints[currentImageIndex] = { x, y }
			return newPoints
		})
	}

	// Handle form submission
	const handleSubmit = async () => {
		if (!images[currentImageIndex]) return

		setIsSubmitting(true)
		try {
			const pixelArr = await convertBase64ToPixelArray(
				`data:image/png;base64,${images[currentImageIndex]}`
			)

			const response = await axios.post(
				'http://10.4.105.41:3004/masks/points',
				{
					points: points[currentImageIndex]
						? [
								[
									points[currentImageIndex]!.x,
									points[currentImageIndex]!.y,
								],
						  ]
						: [],
					pixel_arr: pixelArr,
				}
			)

			setMasks((prev) => {
				const newMasks = [...prev]
				newMasks[currentImageIndex] = response.data.mask_points
				return newMasks
			})
		} catch (error) {
			console.error('Submission error:', error)
		} finally {
			setIsSubmitting(false)
		}
	}

	// Draw image with annotations
	const drawImage = () => {
		const canvas = canvasRef.current
		if (!canvas) return

		const ctx = canvas.getContext('2d')
		if (!ctx) return

		const img = new Image()
		img.src = `data:image/png;base64,${images[currentImageIndex]}`

		img.onload = () => {
			// Set canvas dimensions to match image
			canvas.width = img.naturalWidth
			canvas.height = img.naturalHeight

			// Clear and draw base image
			ctx.clearRect(0, 0, canvas.width, canvas.height)
			ctx.drawImage(img, 0, 0)

			// Draw existing point
			const currentPoint = points[currentImageIndex]
			if (currentPoint) {
				ctx.beginPath()
				ctx.arc(
					currentPoint.x,
					currentPoint.y,
					POINT_RADIUS,
					0,
					Math.PI * 2
				)
				ctx.fillStyle = 'rgba(255,0,0,0.3)'
				ctx.fill()
			}

			// Draw mask overlay
			const maskData = masks[currentImageIndex]![0]
			if (maskData) {
				const imageData = ctx.getImageData(
					0,
					0,
					canvas.width,
					canvas.height
				)
				const pixelData = imageData.data

				for (let y = 0; y < maskData.length; y++) {
					for (let x = 0; x < maskData[y].length; x++) {
						if (maskData[y][x]) {
							const pixelIndex = (y * canvas.width + x) * 4
							pixelData[pixelIndex] = 255 // R
							pixelData[pixelIndex + 1] = 0 // G
							pixelData[pixelIndex + 2] = 0 // B
							pixelData[pixelIndex + 3] = 128 // A
						}
					}
				}

				ctx.putImageData(imageData, 0, 0)
			}
		}
	}

	// Reset annotations when images change
	useEffect(() => {
		setPoints(new Array(images.length).fill(null))
		setMasks(new Array(images.length).fill(null))
	}, [images])

	// Redraw when dependencies change
	useEffect(() => {
		drawImage()
		const canvas = canvasRef.current
		if (canvas) {
			canvas.addEventListener('wheel', handleScroll, { passive: false })
			return () => canvas.removeEventListener('wheel', handleScroll)
		}
	}, [currentImageIndex, points, masks])

	return (
		<div className="flex flex-col gap-4 max-w-screen-sm mx-auto">
			<div className="relative aspect-square w-full">
				<canvas
					ref={canvasRef}
					onClick={handleCanvasClick}
					className="w-full h-full cursor-crosshair bg-gray-800 rounded-lg"
				/>
			</div>

			<div className="flex justify-between items-center">
				<Button
					variant="outline"
					onClick={showPreviousImage}
					disabled={currentImageIndex === 0}
				>
					Previous
				</Button>

				<span>
					Image {currentImageIndex + 1} of {images.length}
				</span>

				<Button
					variant="outline"
					onClick={showNextImage}
					disabled={currentImageIndex === images.length - 1}
				>
					Next
				</Button>
			</div>

			<Button
				onClick={handleSubmit}
				disabled={isSubmitting || !images[currentImageIndex]}
			>
				{isSubmitting ? 'Processing...' : 'Submit Point'}
			</Button>
		</div>
	)
}

export { MRIViewer }
