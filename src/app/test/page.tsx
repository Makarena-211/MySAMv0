'use client'
import React, { useState } from 'react'
import axios from 'axios'
import { MRIViewer } from '@/components/home/scan-view'
import MaskGenerator from '@/components/mask'
import ROIMaskGenerator from '@/components/roi-mask'

const UploadPage: React.FC = () => {
	const [files, setFiles] = useState<File[]>([])
	const [error, setError] = useState<string | null>(null)
	const [base64Images, setBase64Images] = useState<string[] | null>(null)

	const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
		const selectedFiles = Array.from(event.target.files || [])
		const dicomFiles = selectedFiles
		setError(null)
		setFiles(dicomFiles)
	}

	const handleUpload = async () => {
		if (files.length === 0) {
			setError('Пожалуйста, выберите файлы перед загрузкой.')
			return
		}

		const formData = new FormData()
		files.forEach((file) => {
			formData.append('dicom_slices', file)
		})

		try {
			const response = await axios.post(
				'http://10.4.105.41:3004/dicom/base64',
				formData,
				{
					headers: {
						'Content-Type': 'multipart/form-data',
					},
				}
			)
			console.log(response.data)
			setBase64Images(response.data.dicom_images) // Предполагаем, что сервер возвращает массив base64 изображений
			setError(null)
		} catch (err) {
			console.error(err)
			setError('Ошибка при загрузке файлов.')
			setBase64Images([])
		}
	}

	return (
		<div style={{ padding: '20px' }}>
			<h1>Загрузка DICOM слайсов</h1>
			<input
				type="file"
				accept=".dcm"
				webkitdirectory="true"
				onChange={handleFileChange}
			/>
			<button onClick={handleUpload} style={{ marginTop: '10px' }}>
				Загрузить
			</button>
			{error && <p style={{ color: 'red' }}>{error}</p>}
			{base64Images && base64Images.length > 0 && (
				<div>
					{/* <MaskGenerator
						base64Image={`data:image/png;base64,${base64Images[4]}`}
					/>
					<ROIMaskGenerator
						base64Image={`data:image/png;base64,${base64Images[4]}`}
					/>
					<h2>Полученные изображения:</h2> */}
					<MRIViewer images={base64Images} />
					{/* {base64Images.map((base64, index) => (
						<img
							key={index}
							src={`data:image/png;base64,${base64}`}
							alt={`DICOM Slice ${index + 1}`}
							style={{
								width: '200px',
								height: 'auto',
								margin: '10px',
							}}
						/>
					))} */}
				</div>
			)}
		</div>
	)
}

export default UploadPage
