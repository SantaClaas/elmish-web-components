import Filter from "./filter";

/**
 * Represents a filter whose keywords matched a given status.
 * https://docs.joinmastodon.org/entities/FilterResult/
 */
type FilterResult = {
  /**
   * The filter that was matched.
   */
  filter: Filter;

  /**
   * The keyword within the filter that was matched.
   */
  keyword_matches: string[] | null;

  /**
   * The status ID within the filter that was matched.
   */
  status_matches: string | null;
};

export default FilterResult;
