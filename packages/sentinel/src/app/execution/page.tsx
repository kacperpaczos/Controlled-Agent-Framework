"use client"

import { useExecutionStore } from "@/stores/execution-store"

export default function ExecutionPage() {
  const { executions, currentExecutionId } = useExecutionStore()

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold text-white">Execution Monitor</h1>
      <p className="mt-2 text-gray-400">
        Real-time status wykonań agenta. Połącz z CAF Dev Server (WebSocket) aby zobaczyć dane.
      </p>
      <div className="mt-6">
        <p className="text-sm text-gray-500">
          Obecne wykonanie: {currentExecutionId ?? "—"}
        </p>
        <p className="mt-2 text-sm text-gray-500">
          Liczba wykonań w sesji: {Object.keys(executions).length}
        </p>
      </div>
    </div>
  )
}
