"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"

const nav = [
  { href: "/", label: "Dashboard" },
  { href: "/execution", label: "Execution Monitor" },
  { href: "/thoughts", label: "Thought Chain" },
  { href: "/checkpoints", label: "Checkpoints" },
  { href: "/intervention", label: "Intervention" },
]

export function Sidebar() {
  const pathname = usePathname()

  return (
    <aside className="flex w-56 flex-col border-r border-gray-700 bg-gray-900">
      <div className="border-b border-gray-700 p-4">
        <span className="font-semibold text-white">Sentinel</span>
      </div>
      <nav className="flex-1 p-2">
        {nav.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={`block rounded px-3 py-2 text-sm ${
              pathname === item.href
                ? "bg-gray-700 text-white"
                : "text-gray-400 hover:bg-gray-800 hover:text-gray-200"
            }`}
          >
            {item.label}
          </Link>
        ))}
      </nav>
    </aside>
  )
}
