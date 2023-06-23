import { TemplateResult, html } from "lit-html";
import Account from "../api/models/account";

/**
 * If the name does not end with 's' it appends and 's, else just a '
 * https://www.ef.com/wwen/english-resources/english-grammar/forming-possessive
 */
function formPossessive(name: string) {
  if (name.length === 0) return name;

  return name[name.length - 1] === "s" ? name + "'" : name + "'s";
}
/**
 * Puts the account's avatar into a picture element that loads the static version of the avatar if reduced motion is
 * preferred by the user agent
 */
export function accountAvatar(account: Account): TemplateResult {
  // Easy accessibility win with picture element 😀
  // Turns out I wasn't the only one with this idea:
  // https://bradfrost.com/blog/post/reducing-motion-with-the-picture-element/
  const name = formPossessive(account.display_name);

  // According to this: https://stackoverflow.com/a/48207973 the alterative (alt) text has to be placed on the img
  // element
  return html`<picture>
    <source
      srcset="${account.avatar_static}"
      media="(prefers-reduced-motion: reduce)"
    />

    <img loading="lazy" srcset="${account.avatar}" alt="${name} avatar" />
  </picture>`;
}
