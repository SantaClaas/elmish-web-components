import { TemplateResult, nothing, html } from "lit-html";
import MediaAttachment from "../api/mediaAttachment";
import { repeat } from "lit-html/directives/repeat.js";
import { decodeBlurHash } from "fast-blurhash";
import { BlurHash } from "../api/string";
import { generatePng } from "../pixelsToPng";

//TODO dispose object URL
function convertToPngObjectUrl(
  blurHash: BlurHash,
  width: number,
  height: number
): string {
  const pixels = decodeBlurHash(blurHash, width, height);
  const pngBytes = generatePng(width, height, pixels);
  const pngBlob = new Blob([pngBytes], { type: "image/png" });
  return URL.createObjectURL(pngBlob);
}

export function mediaAttachment(
  attachment: MediaAttachment
): TemplateResult | typeof nothing {
  if (attachment.type == "unknown")
    return html`<a href="${attachment.url}" download
      >Download "${attachment.description}"</a
    >`;

  const objectUrl = convertToPngObjectUrl(
    attachment.blurhash,
    attachment.meta.original?.width!,
    attachment.meta.original?.height!
  );

  switch (attachment.type) {
    case "gifv":
    case "video":
      return html`${attachment.description}<video
          src="${attachment.url}"
          controls
        ></video>`;
    case "image":
      // The information I found around the meta data is very spotty
      if (
        attachment.meta.original === undefined ||
        attachment.meta.small === undefined
      )
        return html`${attachment.description}<img
            loading="lazy"
            src="${attachment.url}"
            alt="${attachment.description}"
          />`;

      // Construct srcset attribute value string
      // I assume the "small" in the meta data refers to the preview_url and the "original" to the url. I checked it but it might not be guaranteed.
      // I am doing the same with srcSet and source but not sure that is necessary
      const sourceSet = `${attachment.preview_url} ${attachment.meta.small.width}w, ${attachment.url} ${attachment.meta.original.width}w`;
      return html` <picture>
        <source src="${attachment.preview_url}" />
        <source
          src="${attachment.url}"
          media="min-width: ${attachment.meta.small.width}"
          width="${attachment.meta.original.width}"
        />
        <img
          loading="lazy"
          src="${objectUrl}"
          srcset="${sourceSet}"
          alt="${attachment.description}"
        />
      </picture>`;
    case "audio":
      return html`${attachment.description}<audio
          src="${attachment.url}"
        ></audio>`;
  }
}

export function mediaAttachments(
  attachments: MediaAttachment[]
): TemplateResult | typeof nothing {
  if (attachments.length === 0) return nothing;

  return html`
    <h2>${attachments.length} Attachments</h2>
    ${repeat(attachments, (attachment) => attachment.id, mediaAttachment)}
  `;
}
