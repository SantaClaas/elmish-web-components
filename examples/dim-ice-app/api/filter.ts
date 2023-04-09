import { Iso8601DateString } from "../iso8601DateTime";
import FilterKeyword from "./filterKeyword";
import FilterStatus from "./filterStatus";

type Context = "home" | "notifications" | "public" | "thread" | "account";

type FilterAction = "warn" | "hide";

/**
 * Represents a user-defined filter for determining which statuses should not be shown to the user.
 * https://docs.joinmastodon.org/entities/Filter/
 */
type Filter = {
  /**
   * The Id of the Filter in the database.
   */
  id: string;
  /**
   * A title given by the user to name the filter.
   */
  title: string;
  /**
   * The contexts in which the filter should be applied.
   */
  context: Context[];
  /**
   * When the filter should no longer be applied.
   */
  expires_at: Iso8601DateString | null;
  /**
   * The action to be taken when a status matches this filter.
   */
  filter_action: FilterAction;
  /**
   * The keywords grouped under this filter.
   */
  kewords: FilterKeyword[];
  /**
   * The statuses grouped under this filter.
   */
  statuses: FilterStatus[];
};

export default Filter;
