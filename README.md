<div align="center">

```
 ░▒▓████████▓▒░ ░▒▓██████▓▒░  ░▒▓█▓▒░░▒▓█▓▒░
 ░▒▓█▓▒░       ░▒▓█▓▒░░▒▓█▓▒░ ░▒▓█▓▒░░▒▓█▓▒░
 ░▒▓█▓▒░       ░▒▓█▓▒░        ░▒▓█▓▒░░▒▓█▓▒░
 ░▒▓██████▓▒░  ░▒▓█▓▒░        ░▒▓█▓▒░░▒▓█▓▒░
 ░▒▓█▓▒░       ░▒▓█▓▒░        ░▒▓█▓▒░░▒▓█▓▒░
 ░▒▓█▓▒░       ░▒▓█▓▒░░▒▓█▓▒░ ░▒▓█▓▒░░▒▓█▓▒░
 ░▒▓████████▓▒░ ░▒▓██████▓▒░   ░▒▓██████▓▒░
```

# EVERY CINEMATIC UNIVERSE

**Every franchise. Every timeline. Every film — in order.**

[![Live Site](https://img.shields.io/badge/LIVE-everycinematicuniverse.com-c0392b?style=for-the-badge&logo=netlify&logoColor=white)](https://everycinematicuniverse.com)
![Built with Next.js](https://img.shields.io/badge/Next.js-15-black?style=for-the-badge&logo=nextdotjs)
![TypeScript](https://img.shields.io/badge/TypeScript-strict-3178C6?style=for-the-badge&logo=typescript&logoColor=white)
![Deployed on VPS](https://img.shields.io/badge/AWS_Lightsail-232F3E?style=flat-square&logo=amazon-aws&logoColor=white)
![Hosted](https://img.shields.io/badge/Hosted_on-Coolify-000000?style=flat-square&logo=coolify&logoColor=white)
![License: MIT](https://img.shields.io/badge/License-MIT-yellow?style=for-the-badge)

</div>

---

## ✦ What is this?

**Every Cinematic Universe** is a discovery and exploration site for cinematic franchises — from the MCU to Jurassic Park, Star Wars to John Wick, Bollywood and more.

Every universe is laid out in **chronological in-universe order**, complete with movie posters, release years, and phase/arc breakdowns. No more Googling "what order should I watch X" — it's all here.

> 40+ universes. Hundreds of films. One place.

---

## ✦ Stack

| Layer | Tech |
|---|---|
| Framework | Next.js 15 + TypeScript |
| Styling | Tailwind CSS |
| Data | `universe.ts` — hand-curated title arrays |
| Posters & Years | OMDB API |
| Hosting | Lightsail | Coolify

No database. No backend. Just a meticulously maintained `universe.ts` file and a fast frontend.

---

## ✦ How it Works

```
universe.ts   →  OMDB API  →  Poster + Year
    │                                  │
    └─── rendered on the timeline ◄────┘
```

Each universe is a typed array of movie titles in `data/universe.ts`. The Netlify function fetches posters and release years from OMDB at runtime. That's it — deliberately simple.

---

## ✦ Run Locally

```bash
# 1. Clone
git clone https://github.com/zishansheikhh/everycinematicuniverse.git
cd everycinematicuniverse

# 2. Install dependencies
npm install

# 3. Set up environment
cp .env.example .env.local
# → Add your OMDB API key (free at https://www.omdbapi.com/apikey.aspx)

# 4. Run
netlify dev
```

Open [http://localhost:8888](http://localhost:8888)

## ✦ Contributing

This is an open source project — **contributions to universe data are very welcome.**

### Want to add a universe or missing titles?

1. **Fork** this repo
2. Edit `data/universe.ts` — add your titles in the correct order
3. Make sure each title matches its **exact OMDB title** (so poster fetching works)
4. **Open a PR** with the format: `[Universe] Add: <Title or Universe Name>`
5. I review and merge — only the maintainer merges to `main`

### Ground rules
- One universe or topic per PR — keep them small and reviewable
- Match titles exactly to OMDB (check at [omdbapi.com](https://www.omdbapi.com))
- No changes to layout, infrastructure, or Netlify functions without opening an Issue first
- See [CONTRIBUTING.md](./CONTRIBUTING.md) for the full guide

---

## ✦ Environment Variables

```bash
# .env.local (never commit this)
OMDB_API_KEY=your_key_here
```

Get a free key at [omdbapi.com/apikey.aspx](https://www.omdbapi.com/apikey.aspx)

---

## ✦ License

MIT © ZISHAN SHEIKH — see [LICENSE](./LICENSE)

Free to fork, remix, and build on. Credit appreciated.

---

<div align="center">

*Built for anyone who's ever asked "wait, what order do I watch these in?"*

**[everycinematicuniverse.com](https://everycinematicuniverse.com)**

</div>
