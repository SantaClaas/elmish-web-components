import PaginationUrls from "../paginationUrls";
import Status from "./status";
/**
 * Parses the next and previous links from the Link header value
 * More details: https://docs.joinmastodon.org/api/guidelines/#pagination
 */
export function parsePaginationLins(link: string): PaginationUrls {
  const [link1, link2] = link
    ?.split(", ")
    .map((linkSegment) =>
      linkSegment.split("; ").map((split) => {
        const trimmed = split.trim();
        // either <url> or rel="something"
        const dataStart = trimmed[0] === "<" ? 1 : 5;
        return trimmed.substring(dataStart, trimmed.length - 1);
      })
    )
    .map(([link, relationship]) => ({
      link,
      relationship: relationship as "next" | "prev",
    }));

  // Assume "prev" and "next" exist always and only they exist
  if (link1.relationship === "prev") {
    return { next: link2.link, previous: link1.link };
  }

  return { next: link1.link, previous: link2.link };
}

type GetHomeTimelineResponse = {
  readonly toots: Status[];
  readonly links: PaginationUrls;
};

export default GetHomeTimelineResponse;
