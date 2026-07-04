const CLOUDFLARE_APP_SLUG = "cloudflare-workers-and-pages";

const DEFAULT_SUCCESS_CACHE_SECONDS = 300;
const DEFAULT_ERROR_CACHE_SECONDS = 60;
const MIN_CACHE_SECONDS = 60;
const MAX_CACHE_SECONDS = 86_400;
const FETCH_TIMEOUT_MS = 8_000;

const MINIMAL_FALLBACK_SVG =
  '<svg xmlns="http://www.w3.org/2000/svg" width="110" height="20" role="img" aria-label="status: unavailable"><rect width="110" height="20" fill="#9f9f9f"/><text x="55" y="14" text-anchor="middle" font-family="Verdana,Geneva,DejaVu Sans,sans-serif" font-size="11" fill="#fff">unavailable</text></svg>';

export const BADGE_DEFAULTS = {
  label: "Cloudflare Workers",
  logo: "cloudflare-workers",
  logoColor: "#fc7c1e",
} as const;

const STATUS_FALLBACK_SVGS = import.meta.glob("../assets/badges/status/*.svg", {
  eager: true,
  import: "default",
  query: "?raw",
}) as Record<string, string>;

const ERROR_FALLBACK_SVGS = import.meta.glob("../assets/badges/error/*.svg", {
  eager: true,
  import: "default",
  query: "?raw",
}) as Record<string, string>;

type CheckConclusion =
  | "success"
  | "failure"
  | "neutral"
  | "cancelled"
  | "skipped"
  | "timed_out"
  | "action_required"
  | "stale"
  | null
  | undefined;

type CheckStatus =
  | "queued"
  | "in_progress"
  | "completed"
  | "waiting"
  | "requested"
  | "pending"
  | null
  | undefined;

type RepoResponse = {
  default_branch: string;
};

type CheckRun = {
  id: number;
  started_at: string | null;
  conclusion: CheckConclusion;
  status: CheckStatus;
  app?: {
    slug?: string;
  } | null;
};

type ChecksResponse = {
  check_runs: CheckRun[];
};

class HttpStatusError extends Error {
  status: number;

  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

async function fetchWithTimeout(
  input: RequestInfo | URL,
  init?: RequestInit,
): Promise<Response> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

  try {
    return await fetch(input, {
      ...init,
      signal: controller.signal,
    });
  } catch (error: unknown) {
    if (error instanceof DOMException && error.name === "AbortError") {
      throw new HttpStatusError(504, "upstream timeout");
    }

    throw error;
  } finally {
    clearTimeout(timeout);
  }
}

async function fetchGitHubJson<T>(url: string, token: string): Promise<T> {
  const response = await fetchWithTimeout(url, {
    headers: {
      Accept: "application/vnd.github+json",
      Authorization: `Bearer ${token}`,
      "User-Agent": "cloudflare-build-badge",
      "X-GitHub-Api-Version": "2022-11-28",
    },
  });

  if (!response.ok) {
    throw new HttpStatusError(
      response.status,
      `GitHub API returned ${response.status}`,
    );
  }

  const contentType = response.headers.get("Content-Type") ?? "";
  if (!contentType.toLowerCase().includes("application/json")) {
    throw new HttpStatusError(
      502,
      `GitHub API returned unexpected content type: ${contentType || "none"}`,
    );
  }

  try {
    return (await response.json()) as T;
  } catch {
    throw new HttpStatusError(502, "GitHub API returned invalid JSON");
  }
}

export function getStatusColor(
  conclusion: CheckConclusion,
  status: CheckStatus,
): string {
  switch (status) {
    case "in_progress":
    case "queued":
    case "waiting":
    case "requested":
    case "pending":
      return "f59e0b";
  }

  switch (conclusion) {
    case "success":
      return "brightgreen";
    case "failure":
      return "red";
    case "action_required":
      return "orange";
    case "timed_out":
      return "orange";
    case "neutral":
      return "lightgrey";
    case "cancelled":
      return "lightgrey";
    case "skipped":
      return "lightgrey";
    case "stale":
      return "lightgrey";
    default:
      return "lightgrey";
  }
}

function getStatusMessage(
  conclusion: CheckConclusion,
  status: CheckStatus,
): string {
  switch (status) {
    case "in_progress":
      return "building";
    case "queued":
      return "queued";
    case "waiting":
      return "waiting";
    case "requested":
    case "pending":
      return "pending";
  }

  switch (conclusion) {
    case "success":
      return "passing";
    case "failure":
      return "failing";
    case "action_required":
      return "action required";
    case "timed_out":
      return "timed out";
    case "neutral":
      return "neutral";
    case "cancelled":
      return "cancelled";
    case "skipped":
      return "skipped";
    case "stale":
      return "stale";
    default:
      return "unknown";
  }
}

function isExpectedHttpError(httpStatus?: number): boolean {
  return httpStatus !== undefined && httpStatus >= 400 && httpStatus < 500;
}

function getErrorMessage(httpStatus?: number): string {
  switch (httpStatus) {
    case 404:
      return "repo not found";
    case 401:
      return "unauthorized";
    case 403:
      return "forbidden";
    case 410:
      return "repo gone";
    case 422:
      return "invalid ref";
    case 429:
      return "rate limited";
    case 451:
      return "unavailable";
    default:
      if (httpStatus !== undefined && httpStatus >= 500) {
        return "GitHub unavailable";
      }
      return "service unavailable";
  }
}

function getErrorColor(httpStatus?: number): string {
  switch (httpStatus) {
    case 401:
    case 403:
    case 404:
    case 422:
      return "red";
    case 429:
      return "orange";
    case 410:
    case 451:
      return "lightgrey";
    default:
      if (httpStatus !== undefined && httpStatus >= 500) {
        return "red";
      }
      return "red";
  }
}

function resolveBadgeLabel(requestParams: URLSearchParams): string {
  return requestParams.get("label") ?? BADGE_DEFAULTS.label;
}

function resolveCacheSeconds(
  requestParams: URLSearchParams,
  defaultSeconds: number,
): number {
  const raw = requestParams.get("cacheSeconds");

  if (!raw) {
    return defaultSeconds;
  }

  const parsed = Number.parseInt(raw, 10);

  if (!Number.isFinite(parsed) || parsed <= 0) {
    return defaultSeconds;
  }

  // Keep cache windows practical to avoid bursty re-fetches and overly stale edge responses.
  return Math.min(Math.max(parsed, MIN_CACHE_SECONDS), MAX_CACHE_SECONDS);
}

function messageToSvgSlug(message: string): string {
  return message.toLowerCase().replace(/ /g, "-");
}

function getStaticFallbackSvg(
  message: string,
  kind: "status" | "error",
): string | undefined {
  const slug = messageToSvgSlug(message);

  if (kind === "status") {
    return STATUS_FALLBACK_SVGS[`../assets/badges/status/${slug}.svg`];
  }

  return ERROR_FALLBACK_SVGS[`../assets/badges/error/${slug}.svg`];
}

/** Encode a string for use in a shields.io static badge path segment. */
function shieldsEncode(text: string): string {
  const shieldsEscaped = text
    .replace(/_/g, "__") // literal underscore → double underscore
    .replace(/-/g, "--") // literal hyphen → double hyphen
    .replace(/ /g, "_"); // space → underscore

  // URL-encode remaining unsafe characters (/, ?, #, %, &, +, non-ASCII, ...).
  // encodeURIComponent leaves -, _, ., ~ untouched, so shields markers survive.
  return encodeURIComponent(shieldsEscaped);
}

function buildShieldsUrl(
  message: string,
  color: string,
  requestParams: URLSearchParams,
): string {
  const params = new URLSearchParams();

  // Apply defaults first so extending BADGE_DEFAULTS requires no additional wiring.
  for (const [key, value] of Object.entries(BADGE_DEFAULTS)) {
    if (key !== "label") {
      params.set(key, String(value));
    }
  }

  // Request params override defaults (except label which goes in the path)
  for (const [key, value] of requestParams) {
    if (key !== "label") params.set(key, value);
  }

  const label = resolveBadgeLabel(requestParams);

  const encodedLabel = shieldsEncode(label);
  const encodedMessage = shieldsEncode(message);

  return `https://img.shields.io/badge/${encodedLabel}-${encodedMessage}-${color}?${params.toString()}`;
}

async function svgResponse(
  svg: string,
  cacheSeconds: number,
): Promise<Response> {
  const ttl = Math.max(cacheSeconds, MIN_CACHE_SECONDS);

  return new Response(svg, {
    status: 200,
    headers: {
      "Content-Type": "image/svg+xml; charset=utf-8",
      "Cache-Control": `public, max-age=${ttl}, s-maxage=${ttl}, stale-while-revalidate=60, stale-if-error=86400`,
    },
  });
}

export async function errorBadge(
  message: string,
  requestParams: URLSearchParams,
  color: string = "lightgrey",
): Promise<Response> {
  const cacheSeconds = resolveCacheSeconds(
    requestParams,
    DEFAULT_ERROR_CACHE_SECONDS,
  );

  try {
    const url = buildShieldsUrl(message, color, requestParams);
    const res = await fetchWithTimeout(url);
    if (!res.ok) throw new Error(`shields.io returned ${res.status}`);
    return svgResponse(await res.text(), cacheSeconds);
  } catch {
    const fallbackSvg =
      getStaticFallbackSvg(message, "error") ??
      getStaticFallbackSvg(message, "status") ??
      getStaticFallbackSvg("service unavailable", "error") ??
      MINIMAL_FALLBACK_SVG;

    return svgResponse(fallbackSvg, cacheSeconds);
  }
}

export async function getBadgeResponse(params: {
  username: string;
  repository: string;
  branch?: string;
  searchParams: URLSearchParams;
  githubToken?: string;
}): Promise<Response> {
  const { username, repository, branch, searchParams, githubToken } = params;

  if (!githubToken) {
    console.error("[badge] Missing GitHub token", {
      username,
      repository,
      branch: branch ?? null,
    });
    return errorBadge("missing token", searchParams, "red");
  }

  let ref = branch;

  try {
    if (!ref) {
      const repoData = await fetchGitHubJson<RepoResponse>(
        `https://api.github.com/repos/${encodeURIComponent(username)}/${encodeURIComponent(repository)}`,
        githubToken,
      );
      ref = repoData.default_branch;
    }

    if (!ref) {
      throw new HttpStatusError(422, "No branch ref resolved");
    }

    const checksData = await fetchGitHubJson<ChecksResponse>(
      `https://api.github.com/repos/${encodeURIComponent(username)}/${encodeURIComponent(repository)}/commits/${encodeURIComponent(ref)}/check-runs?filter=latest&per_page=100`,
      githubToken,
    );

    const cloudflareChecks = checksData.check_runs
      .filter((run) => run.app?.slug === CLOUDFLARE_APP_SLUG)
      .sort((a, b) => {
        // Newest first: prefer started_at, then check run id as a stable tiebreaker.
        const aStartedRaw = a.started_at ? Date.parse(a.started_at) : 0;
        const bStartedRaw = b.started_at ? Date.parse(b.started_at) : 0;
        const aStarted = Number.isFinite(aStartedRaw) ? aStartedRaw : 0;
        const bStarted = Number.isFinite(bStartedRaw) ? bStartedRaw : 0;
        if (bStarted !== aStarted) return bStarted - aStarted;
        return b.id - a.id;
      });

    if (cloudflareChecks.length === 0) {
      return errorBadge("not deployed", searchParams, "lightgrey");
    }

    const latestRun = cloudflareChecks[0];
    const conclusion = latestRun.conclusion as CheckConclusion;
    const status = latestRun.status as CheckStatus;

    const color = getStatusColor(conclusion, status);
    const message = getStatusMessage(conclusion, status);
    const cacheSeconds = resolveCacheSeconds(
      searchParams,
      DEFAULT_SUCCESS_CACHE_SECONDS,
    );

    try {
      const url = buildShieldsUrl(message, color, searchParams);
      const res = await fetchWithTimeout(url);
      if (!res.ok) throw new Error(`shields.io returned ${res.status}`);
      return svgResponse(await res.text(), cacheSeconds);
    } catch {
      console.warn(
        "[badge] Failed to fetch status badge from shields.io, using static fallback",
        {
          username,
          repository,
          branch: ref ?? null,
          message,
          color,
        },
      );

      const fallbackSvg =
        getStaticFallbackSvg(message, "status") ??
        getStaticFallbackSvg("unknown", "status") ??
        MINIMAL_FALLBACK_SVG;

      return svgResponse(fallbackSvg, cacheSeconds);
    }
  } catch (error: unknown) {
    const httpStatus =
      error !== null &&
      typeof error === "object" &&
      "status" in error &&
      typeof (error as { status: unknown }).status === "number"
        ? (error as { status: number }).status
        : undefined;

    if (!isExpectedHttpError(httpStatus)) {
      const errorMessage =
        error instanceof Error ? error.message : "unknown error";

      console.error("[badge] GitHub/checks flow failed", {
        username,
        repository,
        branch: ref ?? branch ?? null,
        httpStatus: httpStatus ?? null,
        errorMessage,
      });
    }

    return errorBadge(
      getErrorMessage(httpStatus),
      searchParams,
      getErrorColor(httpStatus),
    );
  }
}
