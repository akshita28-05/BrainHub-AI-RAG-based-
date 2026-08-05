/**
 * Pulls REAL data from a GitHub repo using the GitHub REST API.
 * Requires GITHUB_TOKEN (a free personal access token, "repo" or "public_repo"
 * scope: https://github.com/settings/tokens) and GITHUB_REPO ("owner/name").
 *
 * This is what turns BrainHub AI from "demo with sample data" into "connected to
 * your actual engineering history." Run via: npm run ingest
 */

const GITHUB_API = "https://api.github.com";

function headers() {
  return {
    Authorization: `Bearer ${process.env.GITHUB_TOKEN}`,
    Accept: "application/vnd.github+json",
  };
}

async function ghFetch(path) {
  const res = await fetch(`${GITHUB_API}${path}`, { headers: headers() });
  if (!res.ok) {
    throw new Error(`GitHub API error ${res.status} on ${path}: ${await res.text()}`);
  }
  return res.json();
}

export async function fetchRealCommits(repo, limit = 30) {
  const commits = await ghFetch(`/repos/${repo}/commits?per_page=${limit}`);
  return commits.map((c, i) => ({
    id: `c${i + 1}`,
    hash: c.sha.slice(0, 7),
    message: c.commit.message.split("\n")[0],
    author: c.author?.login || c.commit.author.name,
    date: c.commit.author.date.slice(0, 10),
  }));
}

export async function fetchRealPullRequests(repo, limit = 30) {
  const prs = await ghFetch(`/repos/${repo}/pulls?state=closed&per_page=${limit}`);
  return prs
    .filter((pr) => pr.merged_at)
    .map((pr, i) => ({
      id: `pr${i + 1}`,
      title: pr.title,
      author: pr.user?.login,
      date: pr.merged_at.slice(0, 10),
      status: "merged",
      body: pr.body || "",
    }));
}

export async function fetchRealIssues(repo, limit = 30) {
  const issues = await ghFetch(`/repos/${repo}/issues?state=all&per_page=${limit}`);
  return issues
    .filter((i) => !i.pull_request) // exclude PRs (GitHub returns them as issues too)
    .map((issue, i) => ({
      id: `t${i + 1}`,
      title: issue.title,
      assignee: issue.assignee?.login || "unassigned",
      status: issue.state === "closed" ? "done" : "open",
    }));
}

/**
 * Turns merged PRs with substantial descriptions into "decisions" —
 * a reasonable heuristic: a PR with a real description is usually a
 * decision worth remembering, especially if it references "why".
 */
export function derivDecisionsFromPRs(prs, commits) {
  return prs
    .filter((pr) => pr.body && pr.body.length > 40)
    .map((pr, i) => ({
      id: `d${i + 1}`,
      title: pr.title,
      date: pr.date,
      author: pr.author,
      summary: pr.body.slice(0, 400),
      impact: "Impact not yet annotated — add manually or infer from linked issues.",
      tags: [],
      linked: {
        meetings: [],
        commits: commits.filter((c) => c.message.includes(pr.title.slice(0, 15))).map((c) => c.id),
        tasks: [],
        prs: [pr.id],
        docs: [],
      },
    }));
}
