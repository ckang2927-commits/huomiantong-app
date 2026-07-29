import mammoth from 'mammoth/mammoth.browser'
import * as pdfjsLib from 'pdfjs-dist/legacy/build/pdf.mjs'
import pdfWorkerUrl from 'pdfjs-dist/legacy/build/pdf.worker.mjs?url'

pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorkerUrl

export type ResumeImportKind = 'formal' | 'detailed' | 'extra'

export interface ResumeImportResult {
  fileName: string
  text: string
}

function getExtension(fileName: string): string {
  const dotIndex = fileName.lastIndexOf('.')

  return dotIndex >= 0 ? fileName.slice(dotIndex + 1).toLowerCase() : ''
}

async function readPdf(file: File): Promise<string> {
  const data = new Uint8Array(await file.arrayBuffer())
  const document = await pdfjsLib.getDocument({ data }).promise
  const pages: string[] = []

  for (let pageNumber = 1; pageNumber <= document.numPages; pageNumber += 1) {
    const page = await document.getPage(pageNumber)
    const content = await page.getTextContent()
    const text = content.items
      .map((item) => ('str' in item ? item.str : ''))
      .filter(Boolean)
      .join(' ')
    pages.push(text)
  }

  return pages.join('\n\n').trim()
}

async function readDocx(file: File): Promise<string> {
  const result = await mammoth.extractRawText({
    arrayBuffer: await file.arrayBuffer()
  })

  return result.value.trim()
}

export async function importResumeFile(file: File, kind: ResumeImportKind): Promise<ResumeImportResult> {
  const extension = getExtension(file.name)
  let text = ''

  if (extension === 'md' || extension === 'markdown' || extension === 'txt') {
    text = (await file.text()).trim()
  } else if (extension === 'docx') {
    text = await readDocx(file)
  } else if (extension === 'pdf' && kind !== 'detailed') {
    text = await readPdf(file)
  } else if (extension === 'doc') {
    throw new Error('暂不支持老版 .doc，请先用 Word 另存为 .docx')
  } else if (extension === 'pdf') {
    throw new Error('万字解释版暂不支持 PDF，请使用 .docx 或 .md')
  } else {
    throw new Error('文件格式不支持')
  }

  if (!text) {
    throw new Error('没有从文件中读取到文字')
  }

  return {
    fileName: file.name,
    text
  }
}
