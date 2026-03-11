// src/firebase/storage.js
// Firebase Storage helpers for file upload and deletion.
// uploadFile signature matches locked decision in CONTEXT.md:
//   uploadFile(storage, file, path, onProgress?) => Promise<downloadURL string>
import { ref, uploadBytesResumable, getDownloadURL, deleteObject } from 'firebase/storage'

// Upload a file to Firebase Storage with optional progress tracking.
// - storage: Firebase Storage instance (from useCMSFirebase())
// - file: File or Blob
// - path: full storage path (e.g. 'media/images/photo.jpg') — caller controls path
// - onProgress: optional callback called with upload percent (0-100)
// Returns a Promise that resolves to the public download URL string.
export function uploadFile(storage, file, path, onProgress) {
  return new Promise((resolve, reject) => {
    const storageRef = ref(storage, path)
    const task = uploadBytesResumable(storageRef, file)

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

// Delete a file from Firebase Storage.
// - storage: Firebase Storage instance (from useCMSFirebase())
// - path: full storage path used when the file was uploaded
export async function deleteFile(storage, path) {
  const storageRef = ref(storage, path)
  await deleteObject(storageRef)
}
