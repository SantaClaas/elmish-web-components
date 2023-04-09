/**
 * Represents a keyword that, if matched, should cause the filter action to be taken.
 * https://docs.joinmastodon.org/entities/FilterKeyword/
 */
type FilterKeyword = {
  /**
   * The Id of the FilterKeyword in the database.
   */
  id: string;

  /**
   * The phrase to be matched against.
   */
  keyword: string;

  /**
   * Should the filter consider word boundaries? See implementation guidelines for filters.
   * (https://docs.joinmastodon.org/api/guidelines/#filters)
   */
  whole_word: boolean;
};
export default FilterKeyword;
