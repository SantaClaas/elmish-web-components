import { BlurHash, ResolutionString, UrlString } from "./string";

type MetaData = {
  width: number;
  height: number;
  size: ResolutionString;
  aspect: number;
};
/**
 * Type definition is taken from examples and experience. Could not find specific details about properties and when they appear
 */
type PaperclipMetadata = {
  small?: MetaData;
  original?: MetaData;
};
/**
 * The type of an attachment.
 */
type MediaAttachmentType =
  /**
   * unsupported or unrecognized file type
   */
  | "unknown"
  /**
   * Static image
   */
  | "image"
  /**
   * Looping, soundless animation
   */
  | "gifv"
  /**
   * Video clip
   */
  | "video"
  /**
   * Audio track
   */
  | "audio";

/**
 * Represents a file or media attachment that can be added to a status.
 */
type MediaAttachment = {
  /**
   * The Id of the attachment in the database.
   */
  id: string;

  /**
   * The type of the attachment.
   */
  type: MediaAttachmentType;

  /**
   * The location of the original full-size attachment.
   */
  url: UrlString;

  /**
   * The location of a scaled-down preview of the attachment.
   */
  preview_url: UrlString;

  /**
   * The location of the full-size original attachment on the remote website.
   * Null if the attachment is local.
   */
  remote_url: UrlString | null;

  /**
   * Metadata returned by Paperclip.
   * May contain subtrees small and original, as well as various other top-level properties.
   *
   * More importantly, there may be another topl-level focus Hash object on images as of 2.3.0, with coordinates can be
   * used for smart thumbnail cropping – see Focal points for cropped media thumbnails (https://docs.joinmastodon.org/api/guidelines/#focal-points) for more.
   */
  meta: PaperclipMetadata;

  /**
   * Alternate text that describes what is in the media attachment, to be used for the visually impaired or when media
   * attachments do not load.
   */
  description: string;

  /**
   * A hash computed by the BlurHash algorithm (https://github.com/woltapp/blurhash), for generating colorful preview thumbnails when media has not been
   * downloaded yet.
   */
  blurhash: BlurHash;
};

export default MediaAttachment;
