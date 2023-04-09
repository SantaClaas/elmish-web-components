import {
  NumberString,
  UnixTimestampString,
  UnsafeHtmlString,
  UrlString,
} from "./string";

/**
 * Usage statistics for given days (typically the past week).
 */
type PreviewCardHistory = {
  /**
   * UNIX timestamp on midnight of the given day.
   */
  day: UnixTimestampString;
  /**
   * The counted accounts using the link within that day.
   */
  accounts: NumberString;

  /**
   * The counted statuses using the link within that day.
   */
  uses: NumberString;
};
/**
 * The type of the preview card.
 */
type PreviewCardType =
  /**
   * Link OEmbed
   */
  | "link"
  /**
   * Photo OEmbed
   */
  | "photo"
  /**
   * Video OEmbed
   */
  | "video"
  /**
   * iframe OEmbed. Not currently accepted, so won’t show up in practice.
   */
  | "rich";

type PreviewCard = {
  /**
   * Location of linked resource.
   */
  url: UrlString;

  /**
   * Title of linked resource.
   */
  title: string;

  /**
   * Description of preview.
   */
  description: string;

  /**
   * The type of the preview card.
   */
  type: PreviewCardType;

  /**
   * The author of the original resource.
   */
  author_name: string;

  /**
   * A link to the author of the original resource.
   */
  author_url: UrlString;

  /**
   * The provider of the original resource.
   */
  provider_name: string;

  /**
   * A link to the provider of the original resource.
   */
  provider_url: UrlString;

  /**
   * HTML to be used for generating the preview card.
   */
  html: UnsafeHtmlString;

  /**
   * Width of preview, in pixels.
   * (Note from copying: Don't use excact pixels as pixel density differs greatly between screens. Prefer relative units
   * like rem that scale with the user screen settings from browser ans operating system)
   */
  width: number;

  /**
   * Height of preview, in pixels.
   * (Note from copying: Don't use excact pixels as pixel density differs greatly between screens. Prefer relative units
   * like rem that scale with the user screen settings from browser ans operating system)
   */
  height: number;

  /**
   * Preview thumbnail.
   */
  image: UrlString | null;

  /**
   * Used for photo embeds, instead of custom html.
   */
  embed_url: UrlString;

  /**
   * A hash computed by the BlurHash algorithm (https://github.com/woltapp/blurhash), for generating colorful preview
   * thumbnails when media has not been downloaded yet.
   */
  blurhash: string | null;

  /**
   * Usage statistics for given days (typically the past week).
   */
  history: PreviewCardHistory[];
};

export default PreviewCard;
