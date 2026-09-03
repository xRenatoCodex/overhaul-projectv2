import { Storage, type Bucket } from "@google-cloud/storage"

export type UploadedFile = {
  uri: string
  path: string
  bucket: string
}

export class StorageError extends Error {
  constructor(message: string, public readonly cause?: unknown) {
    super(message)
    this.name = "StorageError"
  }
}

/**
 * Wraps Google Cloud Storage using Application Default Credentials; only the
 * bucket name is read from the environment.
 */
export class StorageService {
  private readonly storage: Storage
  private readonly bucketName: string

  constructor(bucketName = process.env.GCP_BUCKET_NAME ?? "") {
    this.bucketName = bucketName
    this.storage = new Storage()
  }

  public async uploadFile(
    file: Buffer,
    fileName: string,
    mimeType: string,
    folderPath: string,
  ): Promise<string> {
    const { uri } = await this.upload(file, fileName, mimeType, folderPath)
    return uri
  }

  public async upload(
    file: Buffer,
    fileName: string,
    mimeType: string,
    folderPath: string,
  ): Promise<UploadedFile> {
    const bucket = this.getBucket()
    const objectPath = buildObjectPath(folderPath, fileName)

    try {
      await bucket.file(objectPath).save(file, {
        contentType: mimeType,
        resumable: false,
        metadata: { cacheControl: "private, max-age=0" },
      })
    } catch (error) {
      throw new StorageError(
        `No se pudo subir el archivo "${objectPath}" a Cloud Storage.`,
        error,
      )
    }

    return {
      uri: `gs://${this.bucketName}/${objectPath}`,
      path: objectPath,
      bucket: this.bucketName,
    }
  }

  public async getSignedUrl(
    objectPath: string,
    expiresInMs = 15 * 60 * 1000,
  ): Promise<string> {
    try {
      const [url] = await this.getBucket().file(objectPath).getSignedUrl({
        version: "v4",
        action: "read",
        expires: Date.now() + expiresInMs,
      })
      return url
    } catch (error) {
      throw new StorageError(
        `No se pudo generar la URL firmada para "${objectPath}".`,
        error,
      )
    }
  }

  public async deleteFile(objectPath: string): Promise<void> {
    try {
      await this.getBucket().file(objectPath).delete({ ignoreNotFound: true })
    } catch (error) {
      throw new StorageError(
        `No se pudo eliminar el archivo "${objectPath}".`,
        error,
      )
    }
  }

  private getBucket(): Bucket {
    if (!this.bucketName) {
      throw new StorageError("GCP_BUCKET_NAME no está configurado.")
    }
    return this.storage.bucket(this.bucketName)
  }
}

function buildObjectPath(folderPath: string, fileName: string): string {
  const folder = folderPath.replace(/^\/+|\/+$/g, "")
  const safeName = sanitizeFileName(fileName)

  return folder ? `${folder}/${safeName}` : safeName
}

// Blocks path traversal and characters that break object keys.
function sanitizeFileName(fileName: string): string {
  const base = fileName.split(/[\\/]/).pop()?.trim() ?? ""
  const safe = base.replace(/[^\w.\-]+/g, "_").replace(/^\.+/, "")

  if (!safe) {
    throw new StorageError("El nombre del archivo no es válido.")
  }

  return safe
}
