"use client"

import { useInterventionStore } from "@/stores/intervention-store"

export default function InterventionPage() {
  const { pausePoint } = useInterventionStore()

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold text-white">Intervention Panel</h1>
      <p className="mt-2 text-gray-400">
        Panel interwencji human-in-the-loop. Gdy agent się zatrzyma, możesz zatwierdzić, zmodyfikować lub anulować.
      </p>
      {pausePoint ? (
        <div className="mt-6 rounded border border-gray-700 bg-gray-800 p-4">
          <p className="text-sm text-gray-400">Trigger: {pausePoint.trigger}</p>
          <p className="mt-2 text-white">{pausePoint.status_summary}</p>
          <div className="mt-4 flex gap-2">
            {pausePoint.available_actions.map((a) => (
              <button
                key={a.id}
                className="rounded bg-gray-600 px-3 py-1 text-sm hover:bg-gray-500"
              >
                {a.label}
              </button>
            ))}
          </div>
        </div>
      ) : (
        <p className="mt-6 text-gray-500">Brak aktywnej pauzy.</p>
      )}
    </div>
  )
}
