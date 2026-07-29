import { app, shell } from 'electron'
import { existsSync } from 'node:fs'
import path from 'node:path'

type OpenDocResult = {
  ok: boolean
  path?: string
  message?: string
}

function normalizeDocPath(input: string): string {
  const normalized = input.trim().replace(/\\/g, '/')
  const markdownIndex = normalized.toLowerCase().indexOf('.md')

  if (markdownIndex === -1) {
    return ''
  }

  const cleaned = normalized.slice(0, markdownIndex + 3).replace(/^docs\//i, '')

  if (!cleaned || cleaned.startsWith('/') || cleaned.includes('..') || path.isAbsolute(cleaned)) {
    return ''
  }

  return cleaned.toLowerCase().endsWith('.md') ? cleaned : ''
}

function candidateDocsRoots(): string[] {
  return Array.from(new Set([
    path.resolve(process.cwd(), 'docs'),
    path.resolve(app.getAppPath(), 'docs'),
    path.resolve(__dirname, '../../docs'),
    path.resolve(process.resourcesPath, 'docs')
  ]))
}

function isInsideDocsRoot(targetPath: string, docsRoot: string): boolean {
  const normalizedTarget = path.resolve(targetPath).toLowerCase()
  const normalizedRoot = path.resolve(docsRoot).toLowerCase()

  return normalizedTarget === normalizedRoot || normalizedTarget.startsWith(normalizedRoot + path.sep)
}

export async function openDocFile(rawPath: string): Promise<OpenDocResult> {
  const relativePath = normalizeDocPath(rawPath)

  if (!relativePath) {
    return {
      ok: false,
      message: '文档路径不正确，只能打开 docs 目录里的 .md 文件。'
    }
  }

  for (const docsRoot of candidateDocsRoots()) {
    const targetPath = path.resolve(docsRoot, relativePath)

    if (!isInsideDocsRoot(targetPath, docsRoot) || !existsSync(targetPath)) {
      continue
    }

    const errorMessage = await shell.openPath(targetPath)

    return errorMessage
      ? { ok: false, path: targetPath, message: errorMessage }
      : { ok: true, path: targetPath }
  }

  return {
    ok: false,
    message: `找不到文档：${relativePath}`
  }
}

