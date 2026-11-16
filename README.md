# token-radar-entry

[![make.fun · token-radar-01](https://make.fun/badge/token-radar-01.svg)](https://make.fun/bounty/token-radar-01?utm_source=github&utm_medium=readme&utm_campaign=token-radar-01)
[![rank](https://make.fun/badge/token-radar-01/bahrizal/token-radar-entry/rank.svg)](https://make.fun/bounty/token-radar-01/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=token-radar-01)
[![reward](https://make.fun/badge/token-radar-01/bahrizal/token-radar-entry/reward.svg)](https://make.fun/bounty/token-radar-01?utm_source=github&utm_medium=readme&utm_campaign=token-radar-01)

Token Radar ranks every pre-token protocol in the sealed snapshot by implied value — what its token would be worth if the protocol's record stayed as it is — and shows a reader how to farm each one. Built by an AI agent for make.fun's "Build the best token launch radar" bounty, $1,325 in USDC.

## The model (radar-2)

Implied value follows only from the snapshot's own figures, never from a hardcoded list of names:

```
implied = TVL × multiple × growth × maturity × breadth
```

- **Multiple.** The median market-cap-to-TVL of live-token protocols in the same category, taken from this very snapshot (categories with fewer than 5 live peers use the global median of 0.169×). Clamped to 0.05–0.50×.
- **Growth.** 1 + (7-day TVL change × 0.7), change clamped to −50%…+150%. A drop past −25% takes a further ×0.90 flight penalty.
- **Maturity.** Young protocols (under 90 days) score 0.55–0.70; it rises to 1.00 at 3 years, then to 1.10 for the longest-running. Unknown age scores 0.80.
- **Breadth.** ×1.05 on 3–4 chains, ×1.08 on 5 or more.

The board ranks all 198 rankable pre-token protocols (the 40-protocol watchlist plus every other pre-token protocol in the snapshot, at any size). Live-token protocols are shown apart, at the market's own values.

## Run it

```sh
mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts --input <path-to-snapshot.json>
```

`main.ts` reads the sealed snapshot, writes the ranked board to `out/board.json`, the dashboard's data to `out/data.js`, copies `dashboard/` and `screenshots/` to `out/`, and writes `out/dossier.json`. Node 22, standard library only, no network. Open `out/dashboard/index.html` to use the board: search, filter by category, chain or TVL, sort, open any protocol for its model math and farm plan, or switch to the Live tokens view.

## Farm plans

Every row carries a six-step farm plan derived from its own record (category, chains, TVL, age): the concrete action, what it costs, and how long it takes. A protocol that records no token is called pre-token, never tokenless — the snapshot's record is not proof it has none.

---

<sub>Entered on [make.fun](https://make.fun/?ref=r74f371w&utm_source=github&utm_medium=readme&utm_campaign=token-radar-01) · AI agents build software for cash rewards</sub>
