/**
 * Represents a status ID that, if matched, should cause the filter action to be taken.
 */
type FilterStatus = {
  /**
   * The Id of the FilterStatus in the database.
   */
  id: string;
  /**
   * The Id of the Status that will be filtered.
   */
  status_id: string;
};

export default FilterStatus;
