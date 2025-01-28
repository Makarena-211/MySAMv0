import React, { useEffect, useState } from 'react'
import MaskOverlay from './mask-preview'

interface ROIProps {
	base64Image: string
}

const ROIMaskGenerator: React.FC<ROIProps> = ({ base64Image }) => {
	const [maskData, setMaskData] = useState<boolean[][] | null>(null)
	const [isLoading, setIsLoading] = useState(false)
	const [error, setError] = useState<string | null>(null)
	const [debugInfo, setDebugInfo] = useState<string>('')

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

	const fetchROIMask = async () => {
		setIsLoading(true)
		setError(null)
		setDebugInfo('')

		try {
			const pixelArr = await convertBase64ToPixelArray(base64Image)

			// Test with known simple ROI (entire image)
			const hardcodedROI = [50, 50, 200, 200] // Small centered ROI
			setDebugInfo(`Sending ROI: ${JSON.stringify(hardcodedROI)}`)

			const requestBody = {
				roi: hardcodedROI,
				pixel_arr: pixelArr,
			}

			const response = await fetch(`http://10.4.105.41:3004/masks/roi`, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
				},
				body: JSON.stringify(requestBody),
			})

			const responseData = await response.json()
			setDebugInfo(
				(prev) =>
					prev +
					`\nResponse: ${JSON.stringify(responseData).slice(
						0,
						100
					)}...`
			)

			if (!response.ok) {
				throw new Error(`HTTP error! status: ${response.status}`)
			}

			if (
				!responseData.mask_roi ||
				!Array.isArray(responseData.mask_roi)
			) {
				throw new Error('Invalid mask format in response')
			}

			// Log mask statistics
			const flatMask = responseData.mask_roi.flat()
			const trueCount = flatMask.filter(Boolean).length
			setDebugInfo(
				(prev) => prev + `\nMask contains ${trueCount} true pixels`
			)

			setMaskData(responseData.mask_roi)
		} catch (err) {
			const errorMessage =
				err instanceof Error ? err.message : 'Unknown error'
			setError(errorMessage)
			setDebugInfo((prev) => prev + `\nError: ${errorMessage}`)
		} finally {
			setIsLoading(false)
		}
	}

	useEffect(() => {
		if (base64Image) {
			fetchROIMask()
		}
	}, [base64Image])

	return (
		<div className="roi-mask-generator">
			{isLoading && <p>Generating ROI mask...</p>}
			{error && <p className="error">Error: {error}</p>}

			<div className="debug-info">
				<h4>Debug Information:</h4>
				<pre>{debugInfo}</pre>
			</div>

			{maskData && (
				<div>
					<h3>ROI Mask:</h3>
					<MaskOverlay maskData={maskData[0]} />
				</div>
			)}
		</div>
	)
}

export default ROIMaskGenerator
