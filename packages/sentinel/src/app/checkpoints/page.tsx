"use client"

import { useCheckpointStore } from "@/stores/checkpoint-store"

export default function CheckpointsPage() {
  const { checkpoints } = useCheckpointStore()
  const list = Object.values(checkpoints)

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold text-white">Checkpoint Inspector</h1>
      <p className="mt-2 text-gray-400">
        Lista checkpointów. Możesz przywrócić stan z dowolnego checkpointu.
      </p>
      <ul className="mt-6 space-y-2">
        {list.length === 0 ? (
          <li className="text-gray-500">Brak checkpointów.</li>
        ) : (
          list.map((cp) => (
            <li
              key={cp.id}
              className="rounded border border-gray-700 bg-gray-800 p-3 text-sm"
            >
              <span className="font-mono text-gray-300">{cp.id}</span>
              <span className="ml-2 text-gray-500">
                step {cp.metadata.step_number} · {cp.metadata.checkpoint_reason}
              </span>
            </li>
          ))
        )}
      </ul>
    </div>
  )
}
