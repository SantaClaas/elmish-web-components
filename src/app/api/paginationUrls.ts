import { UrlString } from "./models/string";

/**
 * A link that points to the next toots in the home timeline
 */
type NextUrl = UrlString;

/**
 * A link that points to the previous toots in the home timeline
 */
type PreviousUrl = UrlString;

type PaginationUrls = {
  next: NextUrl;
  previous: PreviousUrl;
};

export default PaginationUrls;
