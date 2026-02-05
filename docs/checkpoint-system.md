# System checkpointów

CAF używa **trójwarstwowego** modelu danych:

1. **Runtime** – w pamięci: oddzielne obiekty `ThoughtChain`, `Context`, `ToolState` (szybkie częściowe aktualizacje).
2. **Eksport** – monolityczny JSON: jeden plik na checkpoint (atomowy snapshot, git-friendly, przenośny).
3. **Baza** – SQLite + Drizzle: znormalizowane tabele (`checkpoints`, `thoughts`, `tool_calls`) do zapytań i szybkiego przywracania z `snapshot_json`.

## Zapis

- Domyślnie checkpointy trafiają do katalogu `export_dir` (np. `./checkpoints/`) jako pliki `{id}.json`.
- Jeśli ustawisz bazę (`agent.setDatabase(db)`), ten sam checkpoint jest zapisywany także w tabelach Drizzle.

## Przywracanie

- `exportCheckpoint(id)` – odczyt checkpointu (z pliku lub bazy).
- `restoreCheckpoint(checkpoint)` – ustawia wewnętrzny „punkt wznowienia”; kolejne `run(task, { resumeFrom: checkpoint.id })` startuje od tego stanu.

## Schemat pliku JSON

Każdy checkpoint zawiera m.in.:

- `version` – wersja schematu (np. `"0.0.1"`)
- `id`, `timestamp`, `execution_id`, `agent_id`
- `snapshot` – pełny stan: `thought_chain`, `context`, `tool_state`, `progress`
- `metadata` – `step_number`, `tokens_used`, `duration_ms`, `checkpoint_reason`

Wszystkie pola w snake_case; struktury zgodne ze schematami Zod z `@liberos/caf-shared`.
