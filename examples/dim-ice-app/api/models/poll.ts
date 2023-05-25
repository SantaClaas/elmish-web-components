import { Iso8601DateString } from "../../iso8601DateTime";
import CustomEmoji from "./customEmoji";

// Supporting types
/**
 * A possible answers for a poll.
 */
type PollOption = {
  /**
   * The text value of the poll option.
   */
  title: string;

  /**
   * The total number of received votes for this option.
   * Null if results are not published yet.
   */
  votes_count: number | null;
};

/**
 * Represents a poll attached to a status.
 * https://docs.joinmastodon.org/entities/Poll/
 */
type Poll = {
  /**
   * The Id of the poll in the database.
   */
  id: string;

  /**
   * When the poll ends.
   */
  expires_at: Iso8601DateString | null;

  /**
   * Is the poll currently expired?
   */
  expired: boolean;

  /**
   * Does the poll allow multiple-choice answers?
   */
  multiple: boolean;

  /**
   * How many votes have been received.
   */
  votes_count: number;

  /**
   * How many unique accounts have voted on a multiple-choice poll.
   * Null if multiple is false;
   */
  voters_count: number | null;

  /**
   * Possible answers for the poll
   */
  options: PollOption[];

  /**
   * Custom emoji to be used for rendering poll options.
   */
  emojis: CustomEmoji[];

  /**
   * When called with a user token, has the authorized user voted?
   */
  voted?: boolean;

  /**
   * When called with a user token, which options has the authorized user chosen? Contains an array of index values for
   * options.
   */
  own_votes?: number[];
};

export default Poll;
