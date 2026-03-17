import { v2 as cloudinary } from 'cloudinary'
import { CloudinaryStorage } from 'multer-storage-cloudinary'
import multer from 'multer'

// Configure cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key:    process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
})

// Video storage config
const videoStorage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder:        'lms/videos',
    resource_type: 'video',
    allowed_formats: ['mp4', 'mkv', 'mov', 'avi', 'webm'],
    transformation: [
      {
        quality:  'auto',     // auto compress
        fetch_format: 'auto'
      }
    ]
  }
})

// PDF storage config
const pdfStorage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder:        'lms/pdfs',
    resource_type: 'raw',
    allowed_formats: ['pdf']
  }
})

// Multer instances
export const uploadVideo = multer({
  storage: videoStorage,
  limits: { fileSize: 100 * 1024 * 1024 } // 100MB max
})

export const uploadPDF = multer({
  storage: pdfStorage,
  limits: { fileSize: 20 * 1024 * 1024 } // 20MB max
})

export default cloudinary