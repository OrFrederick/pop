# POP

[![CI](https://github.com/OrFrederick/pop/actions/workflows/ci.yml/badge.svg)](https://github.com/OrFrederick/pop/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-purple.svg)](LICENSE)

A neon arcade game. Collect glowing orbs, dodge spinning spikes, chain combos for big scores.

**[Play Live →](https://OrFrederick.github.io/pop/)**

---

## Controls

| Key | Action |
|-----|--------|
| `W A S D` or `↑ ← ↓ →` | Move |
| Any key | Start / restart |

## Rules

- Collect teal orbs for points
- Chain them quickly for combo multipliers
- Red spikes cost a life on contact — 1s of invincibility after each hit
- Pink hearts restore a life (max 5)
- Game over when all 3 lives are gone

## Development

```bash
bun install
bun run dev          # dev server at localhost:5173
bun run build        # production build → dist/
bun run preview      # preview production build
bun run typecheck    # tsc --noEmit
bun run lint         # ESLint
bun run test         # Vitest
bun run test:coverage
```

## Stack

- **TypeScript** strict mode
- **Vite** for bundling
- **HTML5 Canvas 2D** — no game engine
- **Web Audio API** oscillators — no sample files
- **Vitest** for unit tests
- **GitHub Actions** CI + Pages deploy

## License

MIT © OrFrederick
