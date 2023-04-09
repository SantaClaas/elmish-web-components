import Iso8601DateTimeString from "../iso8601DateTime";
import FilterResult from "./FilterResult";
import Account from "./account";
import CustomEmoji from "./customEmoji";
import MediaAttachment from "./mediaAttachment";
import Poll from "./poll";
import PreviewCard from "./previewCard";
import { UrlString, UriString, UnsafeHtmlString } from "./string";

// Supporting types
/**
 * The types of visibility a status can have
 */
type Visibility =
  /**
   * Visible to everyone, shown in public timelines.
   */
  | "public"
  /**
   * Visible to public, but not included in public timelines.
   */
  | "unlisted"
  /**
   * Visible to followers only, and to any mentioned users.
   */
  | "private"
  /**
   * Visible only to mentioned users.
   */
  | "direct";

/**
 * Represents an application that was used to post a status
 */
type Application = {
  /**
   * The name of the application that posted a status.
   */
  name: string;
  /**
   * The website associated with the application that posted a status.
   */
  website: UrlString | null;
};

/**
 * Mentions of users within a status content.
 */
type Mention = {
  /**
   * The account Id of the mentioned user.
   */
  id: string;
  /**
   * The username of the mentioned user.
   */
  username: string;

  /**
   * The location of the mentioned user’s profile.
   */
  url: UrlString;

  /**
   * The webfinger acct: URI of the mentioned user. Equivalent to username for local users, or username@domain for
   * remote users.
   */
  acct: string;
};

type Tag = {
  /**
   * The value of the hashtag after the # sign.
   */
  name: string;
  /**
   * A link to the hashtag on the instance.
   */
  url: UrlString;
};

/**
 * Represents a status posted by an account
 * https://docs.joinmastodon.org/entities/Status/
 */
type Status = {
  /**
   * Id of the status in the database.
   */
  id: string;

  /**
   * URI of the status used for federation.
   */
  uri: UriString;

  /**
   * The date when this status was created.
   */
  createdAt: Iso8601DateTimeString;

  /**
   * The account that authored this status.
   */
  account: Account;

  /**
   * HTML-encoded status content.
   */
  content: UnsafeHtmlString;

  /**
   * Visibility of this status.
   */
  visibility: Visibility;

  /**
   * Is this status marked as sensitive content?
   */
  sensitive: boolean;

  /**
   * Subject or summary line, below which status content is collapsed until expanded.
   */
  spoiler_text: string;

  /**
   * Media that is attached to this status.
   */
  media_attachments: MediaAttachment[];

  /**
   * The application used to post this status.
   */
  application?: Application;

  /**
   * Mentions of users within the status content.
   */
  mentions: Mention[];

  /**
   * Hashtags used within the status content.
   */
  tags: Tag[];

  /**
   * Custom emoji to be used when rendering status content.
   */
  emojis: CustomEmoji[];

  /**
   * How many boosts this status has received.
   */
  reblogs_count: number;

  /**
   * How many favourites this status has received.
   */
  favourites_count: number;

  /**
   * How many replies this status has received.
   */
  replies_count: number;

  /**
   * A link to the status’s HTML representation.
   */
  url: UrlString | null;

  /**
   * Id of the status being replied to.
   */
  in_reply_to_id: string | null;

  /**
   * Id of the account that authored the status being replied to.
   */
  in_reply_to_account_id: string | null;

  /**
   * The status being reblogged.
   */
  reblog: Status | null;

  /**
   * The poll attached to the status.
   */
  poll: Poll | null;

  /**
   * Preview card for links included within status content.
   */
  card: PreviewCard | null;

  /**
   * Primary language of this status.
   */
  language: Iso639Part1Code | null;

  /**
   * Plain-text source of a status. Returned instead of content when status is deleted, so the user may redraft from the
   * source text without the client having to reverse-engineer the original text from the HTML content.
   */
  text: string | null;

  /**
   * Timestamp of when the status was last edited.
   */
  edited_at: Iso8601DateTimeString | null;

  /**
   * If the current token has an authorized user: Have you favourited this status?
   */
  favourited?: boolean;

  /**
   * If the current token has an authorized user: Have you boosted this status?
   */
  reblogged?: boolean;

  /**
   * If the current token has an authorized user: Have you muted notifications for this status’s conversation?
   */
  muted?: boolean;

  /**
   * If the current token has an authorized user: Have you bookmarked this status?
   */
  bookmarked?: boolean;

  /**
   * If the current token has an authorized user: Have you pinned this status? Only appears if the status is pinnable.
   */
  pinned?: boolean;

  /**
   * If the current token has an authorized user: The filter and keywords that matched this status.
   */
  filtered?: FilterResult[];
};

export default Status;
