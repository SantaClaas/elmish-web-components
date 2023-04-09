import Iso8601DateTimeString, { Iso8601DateString } from "../iso8601DateTime";
import CustomEmoji from "./customEmoji";
import { UnsafeHtmlString, UrlString } from "./string";

// Supporting types
/**
 * Additional metadata attached to a profile as name-value pairs.
 */
type Field = {
  /**
   * The key of a given field’s key-value pair.
   */
  name: string;
  /**
   * The value associated with the name key.
   */
  value: UnsafeHtmlString;
  /**
   * Timestamp of when the server verified a URL value for a rel=“me” link.
   */
  verified_at: Iso8601DateTimeString | null;
};

/**
 * Represents a user of Mastodon and their associated profile.
 * https://docs.joinmastodon.org/entities/Account/
 */
type Account = {
  /**
   * The account id.
   */
  id: string;

  /**
   * The username of the account, not including domain.
   */
  username: string;

  /**
   * The Webfinger account URI. Equal to username for local users, or username@domain for remote users.
   */
  acct: string;

  /**
   * The location of the user’s profile page.
   */
  url: UrlString;

  /**
   * The profile’s display name.
   */
  display_name: string;

  /**
   * The profile’s bio or description.
   */
  note: UnsafeHtmlString;

  /**
   * An image icon that is shown next to statuses and in the profile.
   */
  avatar: UrlString;

  // This might be useful if the user (agent) prefers reduced motion
  /**
   * A static version of the avatar. Equal to avatar if its value is a static image; different if avatar is an animated
   * GIF.
   */
  avatar_static: UrlString;

  /**
   * An image banner that is shown above the profile and in profile cards.
   */
  header: UrlString;

  /**
   * A static version of the header. Equal to header if its value is a static image; different if header is an animated
   * GIF.
   */
  header_static: UrlString;

  /**
   * Whether the account manually approves follow requests.
   */
  locked: boolean;

  /**
   * Additional metadata attached to a profile as name-value pairs.
   */
  fields: Field[];

  /**
   * Custom emoji entities to be used when rendering the profile.
   */
  emojis: CustomEmoji[];

  /**
   * Indicates that the account may perform automated actions, may not be monitored, or identifies as a robot.
   */
  bot: boolean;

  /**
   * Indicates that the account represents a Group actor.
   */
  group: boolean;

  /**
   * Whether the account has opted into discovery features such as the profile directory.
   */
  discoverable?: boolean | null;

  // This should influence the HTML documents header section to include the required headers to be hidden by search
  // engines
  /**
   * Whether the local user has opted out of being indexed by search engines.
   */
  noindex?: boolean | null;

  /**
   * Indicates that the profile is currently inactive and that its user has moved to a new account. Might be null if the
   * profile is suspended.
   */
  moved?: Account | null;

  /**
   * An extra attribute returned only when an account is suspended.
   */
  suspended?: boolean;

  /**
   * An extra attribute returned only when an account is silenced. If true, indicates that the account should be hidden
   * behind a warning screen.
   */
  limited?: boolean;

  /**
   * When the account was created.
   */
  created_at: Iso8601DateTimeString;

  /**
   * When the most recent status was posted.
   */
  last_status_at: Iso8601DateString | null;

  /**
   * How many statuses are attached to this account.
   */
  statuses_count: number;

  /**
   * The reported followers of this profile.
   */
  followers_count: number;

  /**
   * The reported follows of this profile.
   */
  following_Count: number;
};
export default Account;
