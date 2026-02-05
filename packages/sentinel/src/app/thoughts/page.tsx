"use client"

import { useThoughtStore } from "@/stores/thought-store"
import { ThoughtChain } from "@/components/thoughts/Chain"

export default function ThoughtsPage() {
  const { thoughts } = useThoughtStore()

  return (
    <div className="flex h-full flex-col p-8">
      <h1 className="text-2xl font-bold text-white">Thought Chain</h1>
      <p className="mt-2 text-gray-400">
        Wizualizacja łańcucha myśli agenta.
      </p>
      <div className="mt-6 flex-1 min-h-[400px]">
        <ThoughtChain thoughts={thoughts} />
      </div>
    </div>
  )
}
