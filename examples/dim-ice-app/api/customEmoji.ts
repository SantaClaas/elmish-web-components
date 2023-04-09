import { UrlString } from "./string";

/**
 * Represents a custom emoji.
 */
type CustomEmoji = {
  /**
   * The name of the custom emoji.
   */
  shortcode: string;

  /**
   * A link to the custom emoji.
   */
  url: UrlString;

  /**
   * A link to a static copy of the custom emoji.
   */
  static_url: UrlString;

  /**
   * Whether this Emoji should be visible in the picker or unlisted.
   */
  visible_in_picker: boolean;

  /**
   * Used for sorting custom emoji in the picker.
   */
  category: string;
};

export default CustomEmoji;
