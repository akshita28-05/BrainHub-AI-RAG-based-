# 🧠 BrainHub AI — Organizational Memory Engine

BrainHub AI captures and connects an organization's knowledge — meetings, commits,
PRs, tasks, docs, and decisions — into one searchable memory, so anyone can
ask *why* a decision was made, *who* made it, and *what impact* it had.

This repo runs in two modes:
- **Demo mode (zero setup)** — works instantly with bundled sample data, keyword search, and templated Q&A.
- **Real mode** — connected to your actual GitHub repo, a real Neo4j graph database, real Qdrant vector search (free local embeddings), and real Llama 3.3 answers via Groq.

**👉 See [SETUP.md](./SETUP.md) for the 4 free accounts (~5 min each) that turn on real mode.**
Everything below runs in demo mode by default — no setup required to see it working.

---

## ✨ Features included

| Feature | Where |
|---|---|
| 🔐 Authentication (JWT, bcrypt-hashed passwords) | `/login`, `/register` |
| 🧠 Decision timeline with full context | `/timeline` |
| 🔗 Knowledge graph (decisions ↔ people ↔ meetings ↔ commits ↔ PRs ↔ docs) | `/graph` |
| 💬 Natural language Q&A ("Why was X changed?") | `/chat` |
| 📊 Knowledge Risk Score (bus-factor per person) | `/risk` |
| 🔍 Semantic search across all artifact types | `/search` |
| 📥 Real Kaggle dataset ingestion (Enron Email Corpus) | `npm run ingest:kaggle` |

All `/api/*` routes except `/api/auth/*` and `/api/health` require a valid
`Authorization: Bearer <token>` header — the frontend handles this for you
automatically once you're signed in.

---

## 🚀 Quick start — demo mode (2 minutes)

You need Node.js 18+ installed.

### 1. Backend

```bash
cd backend
npm install
npm start
```
Runs at **http://localhost:4000**. A demo account (`demo@brainhub.ai` /
`demo1234`) is seeded automatically on first run — try logging in with it,
or register your own.

### 2. Frontend

Open a second terminal:

```bash
cd frontend
npm install
npm run dev
```
Open **http://localhost:5173** in your browser. You'll land on the sign-in
page — use the demo account above (there's a "Use demo account" button) or
register a new one.

---

## 🔌 Real mode — connect your actual data

Follow **[SETUP.md](./SETUP.md)** to get free API keys/accounts for:
GitHub (real commits/PRs), Groq (real LLM answers), Neo4j AuraDB (real graph
database), Qdrant Cloud (real vector search with local, free embeddings).

Then:
```bash
cd backend
npm run ingest   # pulls real GitHub data, syncs Neo4j + Qdrant
npm start
```
The API and frontend are identical in both modes — BrainHub AI auto-detects
which services are configured via `backend/.env` and uses the real ones
wherever keys are present, falling back to the demo path for anything
you haven't set up yet. Every response from `/api/graph` and `/api/search`
includes an `engine` field telling you which one served it.

---

## 📊 Real dataset — Kaggle (Enron Email Corpus)

Instead of only the hand-written sample data, BrainHub AI can run on a
**real, public dataset**: the [Enron Email Dataset](https://www.kaggle.com/datasets/wcukierski/enron-email-dataset)
— 500,000+ real internal emails from an actual company. It's a natural fit:
BrainHub AI already models people, meetings, and decisions — an email thread
where someone writes "we've decided to move forward with X" *is* a decision
record, no synthetic data needed.

**What the ingestion script does** (`backend/src/scripts/ingest_kaggle.py`):
1. Downloads the dataset via `kagglehub` (cached locally after the first run).
2. Reads a sample of rows (default 8,000 — the full CSV is 1.4GB, more than
   a demo needs) and parses each raw email with Python's `email` module.
3. Scores each email for decision-like language ("approved", "decided",
   "moving forward with", "sign off", etc.) and keeps the top matches.
4. Builds `people` from the most frequent senders, and turns each qualifying
   email into a `decision` + linked `meeting` + `doc`, in the exact schema
   the app already uses — so Timeline, Search, Chat, Graph, and Risk Score
   all work against it with zero code changes.
5. Writes `backend/src/data/seed.kaggle.json`.

**Setup:**
```bash
cd backend
pip install -r requirements.txt

# Get a free API token: https://www.kaggle.com/settings -> "Create New Token"
# Either drop the downloaded kaggle.json into ~/.kaggle/, or set these in .env:
#   KAGGLE_USERNAME=your-username
#   KAGGLE_KEY=your-key

python src/scripts/ingest_kaggle.py
```

Then flip the switch and restart the backend:
```bash
# in backend/.env
DATA_SOURCE=kaggle
```
```bash
npm start
```

The dashboard shows a badge ("Kaggle · Enron Email Corpus" vs "Demo seed
data") so it's always obvious which dataset is live — check `GET /api/meta`
if you want it programmatically. If `DATA_SOURCE=kaggle` is set but you
haven't run the ingest script yet, the backend logs a warning and safely
falls back to the demo data instead of crashing.

> Note: this dataset has no code, so `commits`/`prs`/`tasks` stay empty when
> running in Kaggle mode — Timeline, Search, Chat, Graph, and Risk Score all
> still work fully off `decisions`/`meetings`/`docs`/`people`.

---

## 🧩 How it's wired

| File | Demo path (default) | Real path (when configured) |
|---|---|---|
| `backend/src/services/searchService.js` | In-memory keyword scoring | `vectorService.js` — local BGE embeddings + Qdrant (when `QDRANT_URL` is set) |
| `backend/src/services/llmService.js` | Templated answer from retrieved docs | Real Groq/Llama 3.3 call (when `GROQ_API_KEY` is set) |
| `backend/src/services/memoryStore.js` | Bundled `data/seed.json` | `data/seed.kaggle.json` (when `DATA_SOURCE=kaggle`) or overwritten with real GitHub data after `npm run ingest` |
| `backend/src/services/neo4jService.js` | (inactive) | Real Cypher-backed graph (when `NEO4J_URI` is set) |
| `backend/src/services/githubIngest.js` | (inactive) | Real commits/PRs/issues via GitHub REST API |
| `backend/src/scripts/ingest_kaggle.py` | (inactive) | Real decisions/meetings from the Enron Email Corpus on Kaggle |

---

## 📁 Project structure

```
brainhub/
├── SETUP.md                       # get your free API keys/accounts here
├── backend/
│   ├── src/
│   │   ├── data/seed.json         # sample data (overwritten by `npm run ingest`)
│   │   ├── services/
│   │   │   ├── memoryStore.js
│   │   │   ├── searchService.js   # keyword fallback
│   │   │   ├── vectorService.js   # REAL: Qdrant + local BGE embeddings
│   │   │   ├── llmService.js      # REAL: Groq / Llama 3.3
│   │   │   ├── neo4jService.js    # REAL: Neo4j graph
│   │   │   ├── githubIngest.js    # REAL: GitHub REST API ingestion
│   │   │   └── riskService.js
│   │   ├── scripts/ingest.js      # run this to pull real data + sync real DBs
│   │   ├── routes/api.js
│   │   └── server.js
│   └── .env.example
├── frontend/
│   └── src/
│       ├── pages/                 # Dashboard, Timeline, Search, Chat, Graph, Risk
│       ├── components/
│       └── lib/api.js
└── docker-compose.yml              # optional: run Postgres/Neo4j/Qdrant locally instead of cloud
```

---

## 🗺️ Suggested next steps for your submission
1. Record a demo in **real mode**: run `npm run ingest` against your own repo first, so the timeline and chat show real commit history.
2. Mention in your presentation which parts are real vs. fallback — the `engine` field in API responses backs this up honestly.
3. Meetings have no public API in this version (kept as manual/seed input) — a good "future work" talking point (e.g. Google Calendar or Zoom transcript integration).

Good luck with the internship review! 🚀
