import { errorBadge, getBadgeResponse } from "@/lib/badge";
import type { APIRoute } from "astro";
import { env } from "cloudflare:workers";

export const GET: APIRoute = async ({ params, request }) => {
  const { username, repository, branch } = params;

  if (!username || !repository || !branch) {
    return new Response("Not found", { status: 404 });
  }

  const searchParams = new URL(request.url).searchParams;

  try {
    return await getBadgeResponse({
      username,
      repository,
      branch,
      searchParams,
      githubToken: env.GITHUB_TOKEN,
    });
  } catch (error: unknown) {
    const errorMessage =
      error instanceof Error ? error.message : "unknown error";

    console.error("[badge-route] Unhandled error in branch badge request", {
      username,
      repository,
      branch,
      errorMessage,
    });

    return errorBadge("service unavailable", searchParams, "red");
  }
};
