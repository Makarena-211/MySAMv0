import React, { useEffect, useState } from 'react'
import MaskOverlay from './mask-preview'

interface Props {
	base64Image: string
}

const MaskGenerator: React.FC<Props> = ({ base64Image }) => {
	const [maskData, setMaskData] = useState<boolean[][] | null>(null)
	const [isLoading, setIsLoading] = useState(false)
	const [error, setError] = useState<string | null>(null)

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

	const fetchMaskData = async () => {
		setIsLoading(true)
		setError(null)

		try {
			// Convert base64 to pixel array
			const pixelArr = await convertBase64ToPixelArray(base64Image)

			// Hardcoded points from your example
			const requestBody = {
				points: [[263, 145]],
				pixel_arr: pixelArr,
			}

			const response = await fetch(`http://localhost:3004/masks/points`, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
				},
				body: JSON.stringify(requestBody),
			})

			if (!response.ok) {
				throw new Error(`HTTP error! status: ${response.status}`)
			}

			const data = await response.json()
			setMaskData(data.mask_points)
		} catch (err) {
			setError(
				err instanceof Error ? err.message : 'Failed to generate mask'
			)
		} finally {
			setIsLoading(false)
		}
	}

	useEffect(() => {
		if (base64Image) {
			fetchMaskData()
		}
	}, [base64Image])

	return (
		<div className="mask-generator">
			{isLoading && <p>Generating mask...</p>}
			{error && <p className="error">Error: {error}</p>}
			{maskData && (
				<div>
					<h3>Mask Overlay:</h3>
					<MaskOverlay
						base64Image={base64Image}
						maskData={maskData[0]}
					/>
				</div>
			)}
		</div>
	)
}

export default MaskGenerator
