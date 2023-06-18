import { TemplateResult, html } from "lit-html";
import { ViewElement } from "../../../src/elmishComponent";
import { css } from "../styling";

class OutlinedInput extends ViewElement {
  static styles = css`
    :host {
      display: block;
      font-family: ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont,
        "Segoe UI", Roboto, "Helvetica Neue", Arial, "Noto Sans", sans-serif,
        "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol",
        "Noto Color Emoji";
    }
    * {
      box-sizing: border-box;
      border-width: 0;
      border-style: solid;
      border-color: #e5e7eb;
    }

    /* normalize */
    input {
      font-family: inherit;
      font-size: 100%;
      font-weight: inherit;
      line-height: inherit;
      color: inherit;
      margin: 0;
      padding: 0;
    }
    .group {
      /* relative */
      position: relative;
      /* border-md */
      border-radius: 0.375rem;
    }

    .group input {
      /* transistion-all */
      transition-property: all;
      transition-timing-function: cubic-bezier(0.4, 0, 0.2, 1);
      transition-duration: 150ms;

      /* outline-none */
      outline: 2px solid transparent;
      outline-offset: 2px;

      /* leading-none */
      line-height: 1;

      /* py-3 */
      padding-top: 0.75rem;
      padding-bottom: 0.75rem;

      /* px-4 */
      padding-left: 1rem;
      padding-right: 1rem;

      /* rounded-md */
      border-radius: 0.375rem;

      /* touch-manipulation */
      touch-action: manipulation;

      /* w-full */
      width: 100%;
    }

    .group .fillers {
      /* touch-manipulation */
      touch-action: manipulation;

      /* origin-top-left */
      transform-origin: top left;

      /* w-full */
      width: 100%;

      /* h-full */
      height: 100%;

      /* flex */
      display: flex;

      /* top-0 */
      top: 0;

      /* left-0 */
      left: 0;

      /* absolute */
      position: absolute;

      /* pointer-events-none */
      pointer-events: none;
    }

    .group .fillers .filler-start {
      border-style: solid;
      /* border-slate-400 */
      border-color: #94a3b8;
      /* border-color: red; */

      /* border-l */
      border-left-width: 1px;

      /* border-y */
      border-top-width: 1px;
      border-bottom-width: 1px;

      /* rounded-l-md */
      border-top-left-radius: 0.375rem;
      border-bottom-left-radius: 0.375rem;

      /* w-4 */
      width: 1rem;
    }

    .group .fillers .filler-middle {
      /* px-0.5 */
      padding-left: 0.125rem;
      padding-right: 0.125rem;

      /* border-slate-400 */
      border-color: #94a3b8;

      /* border-y */
      border-top-width: 1px;
      border-bottom-width: 1px;
    }

    .group .fillers .filler-middle label {
      display: block;
      /* text-slate-400 */
      color: #94a3b8;
      /* whitespace-nowrap */
      white-space: nowrap;

      /* transition-all */
      transition-property: all;
      transition-timing-function: cubic-bezier(0.4, 0, 0.2, 1);
      transition-duration: 150ms;

      /* translate-y-1/3 */
      transform: translateY(33.33333333333333%);

      /* Needs to be set here to also apply to div and label */
      line-height: 1.5;
    }

    .group .fillers .filler-end {
      /* border-slate-400 */
      border-color: #94a3b8;

      /* border-r */
      border-right-width: 1px;

      /* border-y */
      border-top-width: 1px;
      border-bottom-width: 1px;

      /* rounded-r-md */
      border-top-right-radius: 0.375rem;
      border-bottom-right-radius: 0.375rem;

      /* w-full */
      width: 100%;
    }

    /* Only remove border top when label moves up e.g focus, not-empty, placeholder shown */
    .group:focus-within .fillers .filler-middle {
      /* border-t-transparent */
      border-top-color: transparent;
    }
    /* TODO check if label needs to be nested withing div */
    /* Only move label up when label moves up e.g focus, not-empty, placeholder shown */
    .group:focus-within .fillers .filler-middle label {
      /* -translate-y-3.5 */
      transform: translateY(-0.5rem);
    }

    /* Only move label up when label moves up e.g focus, not-empty, placeholder shown */
    .group:focus-within .fillers .filler-middle label {
      /* text-xs */
      font-size: 0.75rem;
      line-height: 1rem;
    }
  `;

  view(): TemplateResult {
    return html`<div>
      <div class="group">
        <input id="input" />
        <div class="fillers">
          <!-- Filler start -->
          <div class="filler-start"></div>
          <!-- Filler middle -->
          <div class="filler-middle">
            <label for="input">Label text</label>
          </div>
          <!-- Filler end -->
          <div class="filler-end"></div>
        </div>
      </div>
    </div>`;
  }
}
const old = ` input {
    all: unset;

    /* transition-all */
    transition-property: all;
    transition-timing-function: cubic-bezier(0.4, 0, 0.2, 1);
    transition-duration: 150ms;

    touch-action: manipulation;

    /* py-3 */
    padding-top: 0.75rem;
    padding-bottom: 0.75rem;

    /* px-4 */
    padding-left: 1rem;
    padding-right: 1rem;

    /* w-full */
    width: 100%;

    /* rounded-md */
    border-radius: 0.375rem;

    /* leading-none */
    line-height: 1;

    background-color: var(--md-sys-color-surface);

    &:hover {
      background-color: var(--md-sys-color-surface-hover);
    }

    &:focus {
      background-color: var(--md-sys-color-surface-focus);
    }
  }
  .fillers {
    display: flex;
    position: absolute;
    top: 0;
    left: 0;
    transform-origin: top left;
    width: 100%;
    height: 100%;
    touch-action: manipulation;
    pointer-events: none;
    border-color: blue;
  }

  .filler-start {
    width: 1rem;
    border-style: solid;
    border: 1px solid var(--md-sys-color-outline);
    border-right-width: 0;

    border-top-left-radius: 0.375rem;
    border-bottom-left-radius: 0.375rem;
  }

  .filler-middle {
    border: 1px solid var(--md-sys-color-outline);
    border-left-width: 0;
    border-right-width: 0;

    /* px-0.5 */
    padding-left: 0.125rem;
    padding-right: 0.125rem;
  }

  .filler-end {
    width: 100%;
    border: 1px solid var(--md-sys-color-outline);
    border-left-width: 0;
    /* rounded-r-md */
    border-top-right-radius: 0.375rem;
    border-bottom-right-radius: 0.375rem;
  }

  label {
    white-space: nowrap;

    /* Label text (unpopulated) */
    color: var(--md-sys-color-on-surface-variant);

    font-family: var(--md-sys-typescale-body-large-font-family-name);
    line-height: var(--md-sys-typescale-body-large-height);
    font-size: var(--md-sys-typescale-body-large-font-size);
    font-weight: var(--md-sys-typescale-body-large-font-weight);
    letter-spacing: var(--md-sys-typescale-body-large-tracking);
    /*
    font-style: var(--md-sys-typescale-body-large-font-family-style);
    text-transform: var(--md-sys-typescale-body-large-text-transform);
    text-decoration: var(--md-sys-typescale-body-large-text-decoration); */

    &:empty {
      /* Label text (populated) */
    }
  }`;
class OutlinedInput2 extends ViewElement {
  static styles = css`
    /* ! tailwindcss v3.3.2 | MIT License | https://tailwindcss.com */

    /*
1. Prevent padding and border from affecting element width. (https://github.com/mozdevs/cssremedy/issues/4)
2. Allow adding a border to an element by just adding a border-width. (https://github.com/tailwindcss/tailwindcss/pull/116)
*/

    *,
    ::before,
    ::after {
      box-sizing: border-box;
      /* 1 */
      border-width: 0;
      /* 2 */
      border-style: solid;
      /* 2 */
      border-color: #e5e7eb;
      /* 2 */
    }

    ::before,
    ::after {
      --tw-content: "";
    }

    /*
1. Use a consistent sensible line-height in all browsers.
2. Prevent adjustments of font size after orientation changes in iOS.
3. Use a more readable tab size.
4. Use the user's configured 'sans' font-family by default.
5. Use the user's configured 'sans' font-feature-settings by default.
6. Use the user's configured 'sans' font-variation-settings by default.
*/

    :host {
      line-height: 1.5;
      /* 1 */
      -webkit-text-size-adjust: 100%;
      /* 2 */
      -moz-tab-size: 4;
      /* 3 */
      tab-size: 4;
      /* 3 */
      font-family: ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont,
        "Segoe UI", Roboto, "Helvetica Neue", Arial, "Noto Sans", sans-serif,
        "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol",
        "Noto Color Emoji";
      /* 4 */
      font-feature-settings: normal;
      /* 5 */
      font-variation-settings: normal;
      /* 6 */
    }

    /*
1. Remove the margin in all browsers.
2. Inherit line-height from 'html' so users can set them as a class directly on the 'html' element.
*/

    body {
      margin: 0;
      /* 1 */
      line-height: inherit;
      /* 2 */
    }

    /*
1. Add the correct height in Firefox.
2. Correct the inheritance of border color in Firefox. (https://bugzilla.mozilla.org/show_bug.cgi?id=190655)
3. Ensure horizontal rules are visible by default.
*/

    hr {
      height: 0;
      /* 1 */
      color: inherit;
      /* 2 */
      border-top-width: 1px;
      /* 3 */
    }

    /*
Add the correct text decoration in Chrome, Edge, and Safari.
*/

    abbr:where([title]) {
      -webkit-text-decoration: underline dotted;
      text-decoration: underline dotted;
    }

    /*
Remove the default font size and weight for headings.
*/

    h1,
    h2,
    h3,
    h4,
    h5,
    h6 {
      font-size: inherit;
      font-weight: inherit;
    }

    /*
Reset links to optimize for opt-in styling instead of opt-out.
*/

    a {
      color: inherit;
      text-decoration: inherit;
    }

    /*
Add the correct font weight in Edge and Safari.
*/

    b,
    strong {
      font-weight: bolder;
    }

    /*
1. Use the user's configured 'mono' font family by default.
2. Correct the odd 'em' font sizing in all browsers.
*/

    code,
    kbd,
    samp,
    pre {
      font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas,
        "Liberation Mono", "Courier New", monospace;
      /* 1 */
      font-size: 1em;
      /* 2 */
    }

    /*
Add the correct font size in all browsers.
*/

    small {
      font-size: 80%;
    }

    /*
Prevent 'sub' and 'sup' elements from affecting the line height in all browsers.
*/

    sub,
    sup {
      font-size: 75%;
      line-height: 0;
      position: relative;
      vertical-align: baseline;
    }

    sub {
      bottom: -0.25em;
    }

    sup {
      top: -0.5em;
    }

    /*
1. Remove text indentation from table contents in Chrome and Safari. (https://bugs.chromium.org/p/chromium/issues/detail?id=999088, https://bugs.webkit.org/show_bug.cgi?id=201297)
2. Correct table border color inheritance in all Chrome and Safari. (https://bugs.chromium.org/p/chromium/issues/detail?id=935729, https://bugs.webkit.org/show_bug.cgi?id=195016)
3. Remove gaps between table borders by default.
*/

    table {
      text-indent: 0;
      /* 1 */
      border-color: inherit;
      /* 2 */
      border-collapse: collapse;
      /* 3 */
    }

    /*
1. Change the font styles in all browsers.
2. Remove the margin in Firefox and Safari.
3. Remove default padding in all browsers.
*/

    button,
    input,
    optgroup,
    select,
    textarea {
      font-family: inherit;
      /* 1 */
      font-size: 100%;
      /* 1 */
      font-weight: inherit;
      /* 1 */
      line-height: inherit;
      /* 1 */
      color: inherit;
      /* 1 */
      margin: 0;
      /* 2 */
      padding: 0;
      /* 3 */
    }

    /*
Remove the inheritance of text transform in Edge and Firefox.
*/

    button,
    select {
      text-transform: none;
    }

    /*
1. Correct the inability to style clickable types in iOS and Safari.
2. Remove default button styles.
*/

    button,
    [type="button"],
    [type="reset"],
    [type="submit"] {
      -webkit-appearance: button;
      /* 1 */
      background-color: transparent;
      /* 2 */
      background-image: none;
      /* 2 */
    }

    /*
Use the modern Firefox focus style for all focusable elements.
*/

    :-moz-focusring {
      outline: auto;
    }

    /*
Remove the additional ':invalid' styles in Firefox. (https://github.com/mozilla/gecko-dev/blob/2f9eacd9d3d995c937b4251a5557d95d494c9be1/layout/style/res/forms.css#L728-L737)
*/

    :-moz-ui-invalid {
      box-shadow: none;
    }

    /*
Add the correct vertical alignment in Chrome and Firefox.
*/

    progress {
      vertical-align: baseline;
    }

    /*
Correct the cursor style of increment and decrement buttons in Safari.
*/

    ::-webkit-inner-spin-button,
    ::-webkit-outer-spin-button {
      height: auto;
    }

    /*
1. Correct the odd appearance in Chrome and Safari.
2. Correct the outline style in Safari.
*/

    [type="search"] {
      -webkit-appearance: textfield;
      /* 1 */
      outline-offset: -2px;
      /* 2 */
    }

    /*
Remove the inner padding in Chrome and Safari on macOS.
*/

    ::-webkit-search-decoration {
      -webkit-appearance: none;
    }

    /*
1. Correct the inability to style clickable types in iOS and Safari.
2. Change font properties to 'inherit' in Safari.
*/

    ::-webkit-file-upload-button {
      -webkit-appearance: button;
      /* 1 */
      font: inherit;
      /* 2 */
    }

    /*
Add the correct display in Chrome and Safari.
*/

    summary {
      display: list-item;
    }

    /*
Removes the default spacing and border for appropriate elements.
*/

    blockquote,
    dl,
    dd,
    h1,
    h2,
    h3,
    h4,
    h5,
    h6,
    hr,
    figure,
    p,
    pre {
      margin: 0;
    }

    fieldset {
      margin: 0;
      padding: 0;
    }

    legend {
      padding: 0;
    }

    ol,
    ul,
    menu {
      list-style: none;
      margin: 0;
      padding: 0;
    }

    /*
Prevent resizing textareas horizontally by default.
*/

    textarea {
      resize: vertical;
    }

    /*
1. Reset the default placeholder opacity in Firefox. (https://github.com/tailwindlabs/tailwindcss/issues/3300)
2. Set the default placeholder color to the user's configured gray 400 color.
*/

    input::placeholder,
    textarea::placeholder {
      opacity: 1;
      /* 1 */
      color: #9ca3af;
      /* 2 */
    }

    /*
Set the default cursor for buttons.
*/

    button,
    [role="button"] {
      cursor: pointer;
    }

    /*
Make sure disabled buttons don't get the pointer cursor.
*/

    :disabled {
      cursor: default;
    }

    /*
1. Make replaced elements 'display: block' by default. (https://github.com/mozdevs/cssremedy/issues/14)
2. Add 'vertical-align: middle' to align replaced elements more sensibly by default. (https://github.com/jensimmons/cssremedy/issues/14#issuecomment-634934210)
   This can trigger a poorly considered lint error in some tools but is included by design.
*/

    img,
    svg,
    video,
    canvas,
    audio,
    iframe,
    embed,
    object {
      display: block;
      /* 1 */
      vertical-align: middle;
      /* 2 */
    }

    /*
Constrain images and videos to the parent width and preserve their intrinsic aspect ratio. (https://github.com/mozdevs/cssremedy/issues/14)
*/

    img,
    video {
      max-width: 100%;
      height: auto;
    }

    /* Make elements with the HTML hidden attribute stay hidden by default */

    [hidden] {
      display: none;
    }

    *,
    ::before,
    ::after {
      --tw-border-spacing-x: 0;
      --tw-border-spacing-y: 0;
      --tw-translate-x: 0;
      --tw-translate-y: 0;
      --tw-rotate: 0;
      --tw-skew-x: 0;
      --tw-skew-y: 0;
      --tw-scale-x: 1;
      --tw-scale-y: 1;
      --tw-pan-x: ;
      --tw-pan-y: ;
      --tw-pinch-zoom: ;
      --tw-scroll-snap-strictness: proximity;
      --tw-gradient-from-position: ;
      --tw-gradient-via-position: ;
      --tw-gradient-to-position: ;
      --tw-ordinal: ;
      --tw-slashed-zero: ;
      --tw-numeric-figure: ;
      --tw-numeric-spacing: ;
      --tw-numeric-fraction: ;
      --tw-ring-inset: ;
      --tw-ring-offset-width: 0px;
      --tw-ring-offset-color: #fff;
      --tw-ring-color: rgb(59 130 246 / 0.5);
      --tw-ring-offset-shadow: 0 0 #0000;
      --tw-ring-shadow: 0 0 #0000;
      --tw-shadow: 0 0 #0000;
      --tw-shadow-colored: 0 0 #0000;
      --tw-blur: ;
      --tw-brightness: ;
      --tw-contrast: ;
      --tw-grayscale: ;
      --tw-hue-rotate: ;
      --tw-invert: ;
      --tw-saturate: ;
      --tw-sepia: ;
      --tw-drop-shadow: ;
      --tw-backdrop-blur: ;
      --tw-backdrop-brightness: ;
      --tw-backdrop-contrast: ;
      --tw-backdrop-grayscale: ;
      --tw-backdrop-hue-rotate: ;
      --tw-backdrop-invert: ;
      --tw-backdrop-opacity: ;
      --tw-backdrop-saturate: ;
      --tw-backdrop-sepia: ;
    }

    ::backdrop {
      --tw-border-spacing-x: 0;
      --tw-border-spacing-y: 0;
      --tw-translate-x: 0;
      --tw-translate-y: 0;
      --tw-rotate: 0;
      --tw-skew-x: 0;
      --tw-skew-y: 0;
      --tw-scale-x: 1;
      --tw-scale-y: 1;
      --tw-pan-x: ;
      --tw-pan-y: ;
      --tw-pinch-zoom: ;
      --tw-scroll-snap-strictness: proximity;
      --tw-gradient-from-position: ;
      --tw-gradient-via-position: ;
      --tw-gradient-to-position: ;
      --tw-ordinal: ;
      --tw-slashed-zero: ;
      --tw-numeric-figure: ;
      --tw-numeric-spacing: ;
      --tw-numeric-fraction: ;
      --tw-ring-inset: ;
      --tw-ring-offset-width: 0px;
      --tw-ring-offset-color: #fff;
      --tw-ring-color: rgb(59 130 246 / 0.5);
      --tw-ring-offset-shadow: 0 0 #0000;
      --tw-ring-shadow: 0 0 #0000;
      --tw-shadow: 0 0 #0000;
      --tw-shadow-colored: 0 0 #0000;
      --tw-blur: ;
      --tw-brightness: ;
      --tw-contrast: ;
      --tw-grayscale: ;
      --tw-hue-rotate: ;
      --tw-invert: ;
      --tw-saturate: ;
      --tw-sepia: ;
      --tw-drop-shadow: ;
      --tw-backdrop-blur: ;
      --tw-backdrop-brightness: ;
      --tw-backdrop-contrast: ;
      --tw-backdrop-grayscale: ;
      --tw-backdrop-hue-rotate: ;
      --tw-backdrop-invert: ;
      --tw-backdrop-opacity: ;
      --tw-backdrop-saturate: ;
      --tw-backdrop-sepia: ;
    }

    .pointer-events-none {
      pointer-events: none;
    }

    .absolute {
      position: absolute;
    }

    .relative {
      position: relative;
    }

    .left-0 {
      left: 0px;
    }

    .top-0 {
      top: 0px;
    }

    .flex {
      display: flex;
    }

    .h-full {
      height: 100%;
    }

    .w-4 {
      width: 1rem;
    }

    .w-full {
      width: 100%;
    }

    .origin-top-left {
      transform-origin: top left;
    }

    .translate-y-1\/3 {
      --tw-translate-y: 33.333333%;
      transform: translate(var(--tw-translate-x), var(--tw-translate-y))
        rotate(var(--tw-rotate)) skewX(var(--tw-skew-x)) skewY(var(--tw-skew-y))
        scaleX(var(--tw-scale-x)) scaleY(var(--tw-scale-y));
    }

    .touch-manipulation {
      touch-action: manipulation;
    }

    .whitespace-nowrap {
      white-space: nowrap;
    }

    .rounded-md {
      border-radius: 0.375rem;
    }

    .rounded-l-md {
      border-top-left-radius: 0.375rem;
      border-bottom-left-radius: 0.375rem;
    }

    .rounded-r-md {
      border-top-right-radius: 0.375rem;
      border-bottom-right-radius: 0.375rem;
    }

    .border-y {
      border-top-width: 1px;
      border-bottom-width: 1px;
    }

    .border-l {
      border-left-width: 1px;
    }

    .border-r {
      border-right-width: 1px;
    }

    .border-slate-400 {
      --tw-border-opacity: 1;
      border-color: rgb(148 163 184 / var(--tw-border-opacity));
    }

    .p-4 {
      padding: 1rem;
    }

    .px-0 {
      padding-left: 0px;
      padding-right: 0px;
    }

    .px-0\.5 {
      padding-left: 0.125rem;
      padding-right: 0.125rem;
    }

    .px-4 {
      padding-left: 1rem;
      padding-right: 1rem;
    }

    .py-3 {
      padding-top: 0.75rem;
      padding-bottom: 0.75rem;
    }

    .leading-none {
      line-height: 1;
    }

    .text-slate-400 {
      --tw-text-opacity: 1;
      color: rgb(148 163 184 / var(--tw-text-opacity));
    }

    .outline-none {
      outline: 2px solid transparent;
      outline-offset: 2px;
    }

    .transition-all {
      transition-property: all;
      transition-timing-function: cubic-bezier(0.4, 0, 0.2, 1);
      transition-duration: 150ms;
    }

    .placeholder\:text-lg::placeholder {
      font-size: 1.125rem;
      line-height: 1.75rem;
    }

    .placeholder\:opacity-0::placeholder {
      opacity: 0;
    }

    .placeholder\:transition-all::placeholder {
      transition-property: all;
      transition-timing-function: cubic-bezier(0.4, 0, 0.2, 1);
      transition-duration: 150ms;
    }

    .autofill\:bg-black:autofill {
      --tw-bg-opacity: 1;
      background-color: rgb(0 0 0 / var(--tw-bg-opacity));
    }

    .focus-within\:border-indigo-100:focus-within {
      --tw-border-opacity: 1;
      border-color: rgb(224 231 255 / var(--tw-border-opacity));
    }

    .placeholder\:focus\:opacity-100:focus::placeholder {
      opacity: 1;
    }

    .group:focus-within .group-focus-within\:-translate-y-3 {
      --tw-translate-y: -0.75rem;
      transform: translate(var(--tw-translate-x), var(--tw-translate-y))
        rotate(var(--tw-rotate)) skewX(var(--tw-skew-x)) skewY(var(--tw-skew-y))
        scaleX(var(--tw-scale-x)) scaleY(var(--tw-scale-y));
    }

    .group:focus-within .group-focus-within\:-translate-y-3\.5 {
      --tw-translate-y: -0.875rem;
      transform: translate(var(--tw-translate-x), var(--tw-translate-y))
        rotate(var(--tw-rotate)) skewX(var(--tw-skew-x)) skewY(var(--tw-skew-y))
        scaleX(var(--tw-scale-x)) scaleY(var(--tw-scale-y));
    }

    .group:focus-within .group-focus-within\:border-indigo-100 {
      --tw-border-opacity: 1;
      border-color: rgb(224 231 255 / var(--tw-border-opacity));
    }

    .group:focus-within .group-focus-within\:border-t-transparent {
      border-top-color: transparent;
    }

    .group:focus-within .group-focus-within\:text-xs {
      font-size: 0.75rem;
      line-height: 1rem;
    }

    .group:focus-within .group-focus-within\:text-indigo-100 {
      --tw-text-opacity: 1;
      color: rgb(224 231 255 / var(--tw-text-opacity));
    }

    .group:hover .group-hover\:border-slate-600 {
      --tw-border-opacity: 1;
      border-color: rgb(71 85 105 / var(--tw-border-opacity));
    }

    .group:hover:focus-within
      .group-hover\:group-focus-within\:border-indigo-100 {
      --tw-border-opacity: 1;
      border-color: rgb(224 231 255 / var(--tw-border-opacity));
    }

    .group:focus-within:hover
      .group-focus-within\:group-hover\:border-t-transparent {
      border-top-color: transparent;
    }

    .group:hover:focus-within
      .group-hover\:group-focus-within\:border-t-transparent {
      border-top-color: transparent;
    }

    @media (prefers-color-scheme: dark) {
      .dark\:text-slate-900 {
        --tw-text-opacity: 1;
        color: rgb(15 23 42 / var(--tw-text-opacity));
      }

      .placeholder\:dark\:text-slate-600::placeholder {
        --tw-text-opacity: 1;
        color: rgb(71 85 105 / var(--tw-text-opacity));
      }
    }
  `;

  view(): TemplateResult {
    return html`<main class="p-4">
      <div>
        <div class="group relative rounded-md focus-within:border-indigo-100">
          <input
            id="yeag"
            type="text"
            class="dark:bg-elevation-2 hover:dark:bg-elevation-1 focus:dark:bg-elevation-0 dark:text-slate-900 placeholder:dark:text-slate-600 w-full touch-manipulation rounded-md px-4 py-3 leading-none outline-none transition-all placeholder:text-lg placeholder:opacity-0 placeholder:transition-all autofill:bg-black placeholder:focus:opacity-100"
          />
          <!-- Filler group -->
          <div
            class="pointer-events-none absolute left-0 top-0 flex h-full w-full origin-top-left touch-manipulation"
          >
            <!-- Filler start -->
            <div
              class="border-slate-400 group-hover:border-slate-600 w-4 rounded-l-md border-y border-l group-focus-within:border-indigo-100 group-hover:group-focus-within:border-indigo-100"
            ></div>
            <!-- Filler mid -->
            <!--                             "group-focus-within:border-indigo-100 group-hover:group-focus-within:border-indigo-100 border-slate-400 group-hover:border-slate-600"
   -->
            <div
              class="border-slate-400 group-hover:border-slate-600 border-y px-0.5 group-focus-within:border-indigo-100 group-focus-within:border-t-transparent group-hover:group-focus-within:border-indigo-100 group-focus-within:group-hover:border-t-transparent group-hover:group-focus-within:border-t-transparent"
            >
              <div
                class="translate-y-1/3 transition-all group-focus-within:-translate-y-3.5"
              >
                <label
                  for="yeag"
                  class="text-slate-400 whitespace-nowrap group-focus-within:text-xs group-focus-within:text-indigo-100"
                  >Label text</label
                >
              </div>
            </div>
            <!-- Filler end -->
            <div
              class="border-slate-400 group-hover:border-slate-600 w-full rounded-r-md border-y border-r group-focus-within:border-indigo-100 group-hover:group-focus-within:border-indigo-100"
            ></div>
          </div>
        </div>
      </div>
    </main> `;
  }
}

customElements.define("dim-outlined-input", OutlinedInput);
