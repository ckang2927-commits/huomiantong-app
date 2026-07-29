import { app } from 'electron'
import { existsSync } from 'node:fs'
import { mkdir, readFile, writeFile } from 'node:fs/promises'
import path from 'node:path'

function getStoragePath(fileName: string): string {
  return path.join(app.getPath('userData'), fileName)
}

export async function readJson<T>(fileName: string, fallback: T): Promise<T> {
  const filePath = getStoragePath(fileName)

  if (!existsSync(filePath)) {
    return fallback
  }

  try {
    return JSON.parse(await readFile(filePath, 'utf8')) as T
  } catch {
    return fallback
  }
}

export async function writeJson<T>(fileName: string, value: T): Promise<void> {
  const filePath = getStoragePath(fileName)
  await mkdir(path.dirname(filePath), { recursive: true })
  await writeFile(filePath, JSON.stringify(value, null, 2), 'utf8')
}
