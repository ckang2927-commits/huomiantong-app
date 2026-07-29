import { useEffect, useState } from 'react'
import { clearDiagnosticLogs, loadDiagnosticLogs, subscribeDiagnosticLogs, type DiagnosticLogEntry } from '../lib/diagnosticLog'

export function useDiagnosticLogs() {
  const [logs, setLogs] = useState<DiagnosticLogEntry[]>(() => loadDiagnosticLogs())

  useEffect(() => {
    return subscribeDiagnosticLogs(() => setLogs(loadDiagnosticLogs()))
  }, [])

  return {
    logs,
    clearLogs: clearDiagnosticLogs
  }
}
