# Human-in-the-loop (interwencja)

## Triggery pauzy

W konfiguracji agenta (`pause`) można włączyć:

- `manual: true` – pauza na żądanie (API / GUI).
- `on_tool_error: true` – pauza przy błędzie narzędzia.
- `on_low_confidence: 0.6` – pauza, gdy confidence &lt; próg.

## Zdarzenie agent.paused

Gdy wykonanie się zatrzyma, emitowane jest zdarzenie z `pause_point`:

- `id`, `execution_id`, `checkpoint_id`
- `trigger` – powód (np. `manual`, `tool_error`, `confidence_low`)
- `trigger_details` – kontekst
- `status_summary`, `pending_questions`
- `available_actions` – lista akcji (np. `continue`, `cancel`, `modify`, `retry`)

## Reakcja w kodzie

```typescript
agent.on("agent.paused", async (e) => {
  const { pause_point } = e
  // Pokaż użytkownikowi pause_point i available_actions
  // Po wyborze akcji: wywołaj odpowiednie API (resume / modify / cancel)
  // Implementacja resume/modify zależy od warstwy (CLI, HTTP, WebSocket).
})
```

W GUI (Sentinel) panel „Intervention” wyświetla aktywny `pause_point` i przyciski dla `available_actions`.

## Timeout

W definicji punktu pauzy można ustawić `timeout_ms` i `on_timeout` (akcja domyślna przy braku odpowiedzi).
