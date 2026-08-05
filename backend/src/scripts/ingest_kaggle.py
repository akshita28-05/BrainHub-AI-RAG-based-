"""
ingest_kaggle.py
-----------------
Turns BrainHub AI's demo data into REAL data, pulled straight from Kaggle.

Dataset: "The Enron Email Dataset" (wcukierski/enron-email-dataset)
https://www.kaggle.com/datasets/wcukierski/enron-email-dataset

Why this dataset: it's 500,000+ real internal emails from an actual company.
That maps almost perfectly onto what BrainHub AI models — people, meetings
(email threads), and the decisions that came out of them — without having to
fabricate a single record. This is what turns the demo from "looks nice" into
"was tested against a real, messy, 500k-row corpus."

What this script does:
  1. Downloads the dataset via kagglehub (needs a free Kaggle account + API
     token — see README "Real dataset (Kaggle)" section).
  2. Reads only the first N rows (the full CSV is 1.4GB — we don't need all
     500k emails for a demo, and reading all of it would make `npm run dev`
     painfully slow to set up).
  3. Parses each raw RFC822 email (Message-ID, From, To, Date, Subject, body)
     using Python's built-in `email` module.
  4. Applies a simple heuristic to find "decision-worthy" emails — ones whose
     subject/body contain language like "approved", "agreed", "we will",
     "decided", "moving forward with" — and turns each one into a `decision`
     record, with the surrounding thread modeled as the `meeting`.
  5. Writes backend/src/data/seed.kaggle.json in the exact same shape as the
     hand-written seed.json, so every existing route/UI component works
     against it unchanged.

Run:
    cd backend
    pip install -r requirements.txt
    python src/scripts/ingest_kaggle.py

Then set DATA_SOURCE=kaggle in backend/.env and restart the backend.
"""

import email
import json
import os
import re
from collections import defaultdict
from email.utils import parseaddr

import pandas as pd

try:
    from dotenv import load_dotenv
    load_dotenv(os.path.join(os.path.dirname(__file__), "..", "..", ".env"))
except ImportError:
    pass  # KAGGLE_USERNAME/KAGGLE_KEY can still be set as real shell env vars

try:
    import kagglehub
except ImportError:
    raise SystemExit(
        "Missing dependency 'kagglehub'.\n"
        "Run:  pip install -r requirements.txt   (from the backend/ folder)"
    )

DATASET = "wcukierski/enron-email-dataset"
ROWS_TO_SCAN = int(os.environ.get("KAGGLE_ROWS_TO_SCAN", 8000))  # rows read from the 1.4GB CSV
MAX_DECISIONS = int(os.environ.get("KAGGLE_MAX_DECISIONS", 40))
MAX_PEOPLE = int(os.environ.get("KAGGLE_MAX_PEOPLE", 12))

DECISION_PATTERNS = [
    r"\bapproved\b", r"\bagreed\b", r"\bwe (will|are going to)\b",
    r"\bdecided\b", r"\bdecision\b", r"\bmoving forward with\b",
    r"\bfinal(ize|ized|izing)?\b", r"\bsign(ed)? off\b", r"\brecommend(ation)?\b",
    r"\bgo(-| )?ahead\b", r"\bproceed(ing)? with\b",
]
DECISION_RE = re.compile("|".join(DECISION_PATTERNS), re.IGNORECASE)

NOISE_SUBJECTS = re.compile(r"^(re:|fwd:)*\s*$", re.IGNORECASE)


def download_dataset():
    print(f"⬇️  Downloading '{DATASET}' via kagglehub (cached after first run)...")
    path = kagglehub.dataset_download(DATASET)
    csv_path = os.path.join(path, "emails.csv")
    if not os.path.exists(csv_path):
        # some mirrors nest it differently — fall back to a search
        for root, _, files in os.walk(path):
            if "emails.csv" in files:
                csv_path = os.path.join(root, "emails.csv")
                break
    print(f"✅ Dataset ready at {csv_path}")
    return csv_path


def parse_email(raw_message):
    msg = email.message_from_string(raw_message)
    body = msg.get_payload()
    if isinstance(body, list):  # multipart, rare in this corpus
        body = body[0].get_payload()
    body = (body or "").strip()

    from_name, from_addr = parseaddr(msg.get("From", ""))
    to_raw = msg.get("To", "") or ""
    to_addrs = [parseaddr(a)[1] for a in to_raw.split(",") if a.strip()]

    return {
        "message_id": msg.get("Message-ID", ""),
        "date": (msg.get("Date", "") or "")[:25],
        "from": from_addr,
        "to": to_addrs,
        "subject": (msg.get("Subject", "") or "(no subject)").strip(),
        "body": body,
    }


def display_name(email_addr):
    """turn 'phillip.allen@enron.com' into 'Phillip Allen'"""
    local = email_addr.split("@")[0] if "@" in email_addr else email_addr
    parts = re.split(r"[._\-]+", local)
    return " ".join(p.capitalize() for p in parts if p) or "Unknown"


def main():
    csv_path = download_dataset()

    print(f"📄 Scanning first {ROWS_TO_SCAN} rows for decision-worthy emails...")
    df = pd.read_csv(csv_path, nrows=ROWS_TO_SCAN)

    parsed = []
    for _, row in df.iterrows():
        try:
            p = parse_email(row["message"])
        except Exception:
            continue
        if not p["from"] or NOISE_SUBJECTS.match(p["subject"]):
            continue
        if len(p["body"]) < 80:
            continue
        parsed.append(p)

    # Rank by how strongly the subject+body matches decision language
    def score(p):
        return len(DECISION_RE.findall(p["subject"] + " " + p["body"]))

    candidates = sorted(parsed, key=score, reverse=True)
    candidates = [c for c in candidates if score(c) > 0][:MAX_DECISIONS]

    if not candidates:
        raise SystemExit(
            "No decision-worthy emails found in the scanned rows — try raising "
            "KAGGLE_ROWS_TO_SCAN, e.g.  KAGGLE_ROWS_TO_SCAN=30000 python src/scripts/ingest_kaggle.py"
        )

    print(f"🧠 Found {len(candidates)} decision-worthy emails out of {len(parsed)} scanned.")

    # ---- Build the people roster from the most frequent senders ----------
    sender_counts = defaultdict(int)
    for p in candidates:
        sender_counts[p["from"]] += 1
    top_senders = sorted(sender_counts, key=sender_counts.get, reverse=True)[:MAX_PEOPLE]

    people = []
    person_id_by_email = {}
    for i, addr in enumerate(top_senders, start=1):
        pid = f"p{i}"
        person_id_by_email[addr] = pid
        people.append({"id": pid, "name": display_name(addr), "role": "Enron Employee"})

    # anyone not in the top senders still needs *a* person record for "author"
    fallback_person = {"id": "p0", "name": "Unknown Sender", "role": "External / Unlisted"}
    people.append(fallback_person)

    def person_id(addr):
        return person_id_by_email.get(addr, "p0")

    # ---- Build decisions + meetings + docs --------------------------------
    decisions, meetings, docs = [], [], []
    for i, c in enumerate(candidates, start=1):
        did, mid, docid = f"d{i}", f"m{i}", f"doc{i}"
        summary = c["body"][:400].replace("\n", " ").strip()
        attendees = list({person_id(c["from"]), *[person_id(t) for t in c["to"][:3]]})

        decisions.append({
            "id": did,
            "title": c["subject"][:120],
            "date": c["date"][:16] or "unknown",
            "author": person_id(c["from"]),
            "summary": summary or "(no body text captured)",
            "impact": "Impact inferred from a real Enron corporate email — not annotated by a human reviewer.",
            "tags": ["kaggle", "enron", "email"],
            "linked": {"meetings": [mid], "commits": [], "tasks": [], "prs": [], "docs": [docid]},
        })
        meetings.append({
            "id": mid,
            "title": f"Email thread: {c['subject'][:80]}",
            "date": c["date"][:16] or "unknown",
            "attendees": attendees,
            "notes": summary[:200],
        })
        docs.append({"id": docid, "title": f"Original email — {c['subject'][:80]}", "date": c["date"][:16] or "unknown"})

    output = {
        "people": people,
        "decisions": decisions,
        "meetings": meetings,
        "commits": [],  # Enron corpus has no code — commits/PRs/tasks stay empty for this dataset
        "prs": [],
        "tasks": [],
        "docs": docs,
        "_source": {
            "dataset": DATASET,
            "kaggle_url": f"https://www.kaggle.com/datasets/{DATASET}",
            "rows_scanned": ROWS_TO_SCAN,
            "decisions_generated": len(decisions),
        },
    }

    out_path = os.path.join(os.path.dirname(__file__), "..", "data", "seed.kaggle.json")
    out_path = os.path.abspath(out_path)
    with open(out_path, "w", encoding="utf-8") as f:
        json.dump(output, f, indent=2, ensure_ascii=False)

    print(f"\n✅ Wrote {len(decisions)} real decisions to {out_path}")
    print("   Set DATA_SOURCE=kaggle in backend/.env and restart the backend to use it.")


if __name__ == "__main__":
    main()
