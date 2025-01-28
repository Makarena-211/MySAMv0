import React, { useEffect, useRef } from 'react'

interface MaskOverlayProps {
	base64Image: string
	maskData: boolean[][]
}

const MaskOverlay: React.FC<MaskOverlayProps> = ({ base64Image, maskData }) => {
	const canvasRef = useRef<HTMLCanvasElement>(null)

	useEffect(() => {
		if (!canvasRef.current || !maskData || !base64Image) return

		const canvas = canvasRef.current
		const ctx = canvas.getContext('2d')
		if (!ctx) return

		// Clear canvas and set dimensions
		canvas.width = 512
		canvas.height = 512
		ctx.clearRect(0, 0, 512, 512)

		// Draw original image
		const img = new Image()
		img.src = base64Image

		img.onload = () => {
			ctx.drawImage(img, 0, 0, 512, 512)

			// Verify mask data structure
			if (!Array.isArray(maskData) || maskData.length !== 512) {
				console.error('Invalid mask format')
				return
			}

			// Create overlay with 50% opacity
			ctx.fillStyle = 'rgba(255, 0, 0, 0.5)'

			// Iterate through rows (y-axis)
			for (let y = 0; y < 512; y++) {
				// Ensure row exists and has correct length
				if (!Array.isArray(maskData[y]) || maskData[y].length !== 512) {
					continue
				}

				// Iterate through columns (x-axis)
				for (let x = 0; x < 512; x++) {
					if (maskData[y][x]) {
						// Draw red pixel at correct position
						ctx.fillRect(x, y, 1, 1)
					}
				}
			}
		}
	}, [base64Image, maskData])

	return (
		<div className="mask-overlay">
			<canvas
				ref={canvasRef}
				width={512}
				height={512}
				style={{
					width: '100%',
					height: 'auto',
					imageRendering: 'crisp-edges', // For pixel-perfect display
				}}
			/>
		</div>
	)
}

export default MaskOverlay
