// src/firebase/storage.js
// Firebase Storage helpers for file upload and deletion.
// uploadFile signature matches locked decision in CONTEXT.md:
//   uploadFile(storage, file, path, onProgress?) => Promise<downloadURL string>
import { ref, uploadBytesResumable, getDownloadURL, deleteObject } from 'firebase/storage'

const MAX_FILE_BYTES = 10 * 1024 * 1024 // 10 MB
const ALLOWED_MIME   = new Set(['image/jpeg', 'image/png', 'image/gif', 'image/webp'])
const ALLOWED_EXT    = new Set(['jpg', 'jpeg', 'png', 'gif', 'webp'])

// Fallback extension lookup for files whose name has no dot.
export const MIME_TO_EXT = {
  'image/jpeg': 'jpg',
  'image/png':  'png',
  'image/gif':  'gif',
  'image/webp': 'webp',
}

// Validate an image File before uploading.
// Returns an error string if the file should be rejected, or null if it is valid.
export function validateImageFile(file) {
  const ext = file.name.split('.').pop().toLowerCase()
  if (!ALLOWED_MIME.has(file.type) && !ALLOWED_EXT.has(ext)) {
    return 'Only JPEG, PNG, GIF, and WebP images are supported.'
  }
  if (file.size === 0) return 'The selected file is empty.'
  if (file.size > MAX_FILE_BYTES) {
    return `File too large (${(file.size / 1024 / 1024).toFixed(1)} MB) — 10 MB maximum.`
  }
  return null
}

// Upload a file to Firebase Storage with optional progress tracking.
// - storage:   Firebase Storage instance (from useCMSFirebase())
// - file:      File or Blob
// - path:      full storage path (e.g. 'media/images/photo.jpg') — caller controls path
// - onProgress: optional callback called with upload percent (0-100)
// - cancelRef: optional ref — populated with a cancel() function while the upload
//              is in progress; cleared on completion. Call cancelRef.current?.() to
//              abort (e.g. from a useEffect cleanup on unmount).
// Returns a Promise that resolves to the public download URL string.
// Rejects with err.code === 'storage/canceled' if cancelled via cancelRef.
export function uploadFile(storage, file, path, onProgress, cancelRef) {
  return new Promise((resolve, reject) => {
    const storageRef = ref(storage, path)
    const task = uploadBytesResumable(storageRef, file)

    if (cancelRef) cancelRef.current = () => task.cancel()

    task.on(
      'state_changed',
      (snapshot) => {
        if (onProgress) {
          const percent = Math.round(
            (snapshot.bytesTransferred / snapshot.totalBytes) * 100
          )
          onProgress(percent)
        }
      },
      (error) => reject(error),
      async () => {
        if (cancelRef) cancelRef.current = null
        try {
          const url = await getDownloadURL(task.snapshot.ref)
          resolve(url)
        } catch (err) {
          reject(err)
        }
      }
    )
  })
}

// Generate a WebP thumbnail File from an image File using Canvas.
// maxPx: maximum width or height in pixels (aspect ratio preserved).
// Returns a File of type image/webp, or null if canvas is unavailable.
export function generateThumbnail(file, maxPx = 400) {
  return new Promise((resolve) => {
    const url = URL.createObjectURL(file)
    const img = new Image()
    img.onload = () => {
      URL.revokeObjectURL(url)
      const scale = Math.min(1, maxPx / Math.max(img.naturalWidth, img.naturalHeight))
      const w = Math.round(img.naturalWidth * scale)
      const h = Math.round(img.naturalHeight * scale)
      const canvas = document.createElement('canvas')
      canvas.width = w
      canvas.height = h
      const ctx = canvas.getContext('2d')
      if (!ctx) { resolve(null); return }
      ctx.drawImage(img, 0, 0, w, h)
      canvas.toBlob(
        (blob) => resolve(blob ? new File([blob], 'thumb.webp', { type: 'image/webp' }) : null),
        'image/webp',
        0.82
      )
    }
    img.onerror = () => { URL.revokeObjectURL(url); resolve(null) }
    img.src = url
  })
}

// Delete a file from Firebase Storage.
// - storage: Firebase Storage instance (from useCMSFirebase())
// - path: full storage path used when the file was uploaded
export async function deleteFile(storage, path) {
  const storageRef = ref(storage, path)
  await deleteObject(storageRef)
}
