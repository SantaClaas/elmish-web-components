import Iso639Part1Code from "../../iso639LanguageCode";
import Account from "./account";
import Rule from "./rule";
import {
  BlurHash,
  EmailAddressString,
  UnsafeHtmlString,
  UriString,
  UrlString,
} from "./string";

type UsersData = {
  /**
   * The number of active users in the past 4 weeks.
   */
  active_month: number;
};
/**
 * Usage data for this instance.
 */
type InstanceUsage = {
  /**
   * Usage data related to users on this instance.
   */
  users: UsersData;
};

/**
 * Links to scaled resolution images, for high DPI screens.
 */
type ThumbnailVersions = {
  /**
   * The URL for the thumbnail image at 1x resolution.
   */
  "@1x": UrlString;
  /**
   * The URL for the thumbnail image at 2x resolution.
   */
  "@2x": UrlString;
};

/**
 * An image used to represent this instance.
 */
type Thumbnail = {
  /**
   * The URL for the thumbnail image.
   */
  url: UrlString;

  /**
   * A hash computed by the BlurHash algorithm, for generating colorful preview thumbnails when media has not been downloaded yet.
   */
  blurhash: BlurHash;

  /**
   * Links to scaled resolution images, for high DPI screens.
   */
  versions: ThumbnailVersions;
};

type UrlsConfiguration = {
  /**
   * The Websockets URL for connecting to the streaming API.
   */
  streaming_api: UriString;
};

/**
 * Limits related to accounts.
 */
type AccountsConfiguration = {
  /**
   * The maximum number of featured tags allowed for each account.
   */
  max_featured_tags: number;
};

/**
 * Limits related to authoring statuses.
 */
type StatusesConfiguration = {
  /**
   * The maximum number of allowed characters per status.
   */
  max_characters: number;
  /**
   * The maximum number of media attachments that can be added to a status.
   */
  max_media_attachments: number;
  /**
   * Each URL in a status will be assumed to be exactly this many characters.
   */
  characters_reserved_per_url: number;
};

/**
 * Hints for which attachments will be accepted.
 */
type MediaAttachmentsConfiguration = {
  /**
   * Contains MIME types that can be uploaded.
   */
  supported_mime_types: string[];
  /**
   * The maximum size of any uploaded image, in bytes.
   */
  image_size_limit: number;

  /**
   * The maximum number of pixels (width times height) for image uploads.
   */
  image_matrix_limit: number;

  /**
   * The maximum size of any uploaded video, in bytes.
   */
  video_size_limit: number;

  /**
   * The maximum frame rate for any uploaded video.
   */
  video_frame_rate_limit: number;

  /**
   * The maximum number of pixels (width times height) for video uploads.
   */
  video_matrix_limit: number;
};

/**
 * Limits related to polls.
 */
type PollsConfiguration = {
  /**
   * Each poll is allowed to have up to this many options.
   */
  max_options: number;
  /**
   * Each poll option is allowed to have this many characters.
   */
  max_characters_per_option: number;

  /**
   * The shortest allowed poll duration, in seconds.
   */
  min_expiration: number;

  /**
   * The longest allowed poll duration, in seconds.
   */
  max_expiration: number;
};

/**
 * Hints related to translation.
 */
type TranslationConfiguration = {
  /**
   * Whether the Translations API is available on this instance.
   */
  enabled: boolean;
};

/**
 * Information about registering for this website.
 */
type InstanceRegistrations = {
  /**
   * Whether registrations are enabled.
   */
  enabled: boolean;

  /**
   * Whether registrations require moderator approval.
   */
  approval_required: boolean;

  /**
   * A custom message to be shown when registrations are closed.
   */
  message: UnsafeHtmlString | null;
};

/**
 * Hints related to contacting a representative of the website.
 */
type InstanceContact = {
  /**
   * An email address that can be messaged regarding inquiries or issues.
   */
  email: EmailAddressString;

  /**
   * An account that can be contacted natively over the network regarding inquiries or issues.
   */
  account: Account;
};

/**
 * Configured values and limits for this website.
 */
type InstanceConfiguration = {
  /**
   * URLs of interest for clients apps.
   */
  urls: UrlsConfiguration;

  /**
   * Limits related to accounts.
   */
  accounts: AccountsConfiguration;

  /**
   * Limits related to authoring statuses.
   */
  statuses: StatusesConfiguration;

  /**
   * Hints for which attachments will be accepted.
   */
  media_attachments: MediaAttachmentsConfiguration;

  /**
   * Limits related to polls.
   */
  polls: PollsConfiguration;

  /**
   * Hints related to translation.
   */
  translation: TranslationConfiguration;
};

/**
 * Represents the software instance of Mastodon running on this domain.
 * https://docs.joinmastodon.org/entities/Instance/
 */
type Instance = {
  /**
   * The domain name of the instance.
   */
  domain: string;
  /**
   * The title of the website.
   */
  title: string;
  /**
   * The version of Mastodon installed on the instance.
   */
  version: string;

  /**
   * The URL for the source code of the software running on this instance, in keeping with AGPL license requirements.
   */
  source_url: UriString;

  /**
   * A short, plain-text description defined by the admin.
   */
  description: string;

  /**
   * Usage data for this instance.
   */
  usage: InstanceUsage;

  /**
   * An image used to represent this instance.
   */
  thumbnail: Thumbnail;

  /**
   * Primary languages of the website and its staff.
   */
  languages: Iso639Part1Code[];

  /**
   * Configured values and limits for this website.
   */
  configuration: InstanceConfiguration;

  /**
   * Information about registering for this website.
   */
  registrations: InstanceRegistrations;

  /**
   * Hints related to contacting a representative of the website.
   */
  contact: InstanceContact;

  /**
   * An itemized list of rules for this website.
   */
  rules: Rule[];
};

export default Instance;
