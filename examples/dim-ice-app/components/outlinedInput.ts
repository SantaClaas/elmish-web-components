import { TemplateResult, html } from "lit-html";
import { ViewElement } from "../../../src/elmishComponent";
import { css } from "../styling";

class OutlinedInput extends ViewElement {
  static styles = css`
    :host {
      display: block;
    }
    * {
      box-sizing: border-box;
      border-width: 0;
      border-style: solid;
      border-color: var(--md-sys-color-outline);
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
      /* Using invisible border so label text and content text are on same height */
      border-width: 1px 0;
      border-color: transparent;
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

      padding: 0.75rem 1rem;

      border-radius: 0.375rem;

      touch-action: manipulation;

      width: 100%;

      /* Styling text (and caret) */
      caret-color: var(--md-sys-color-primary);
      color: var(--md-sys-color-on-surface);
      font-family: var(--md-sys-typescale-body-large-font-family-name);
      line-height: var(--md-sys-typescale-body-large-line-height);
      font-size: var(--md-sys-typescale-body-large-font-size);
      font-weight: var(--md-sys-typescale-body-large-font-weight);
      letter-spacing: var(--md-sys-typescale-body-large-letter-spacing);
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

      /* absolute */
      position: absolute;
      /* top-0 */
      top: 0;

      /* left-0 */
      left: 0;

      /* pointer-events-none */
      pointer-events: none;
    }

    .group .fillers .filler-start {
      border-color: var(--md-sys-color-outline);

      border-width: 1px 0 1px 1px;

      border-radius: 0.375rem 0 0 0.375rem;

      width: 1rem;
    }

    .group .fillers .filler-middle {
      padding: 0 0.125rem 0 0.25rem;

      /* border-slate-400 */
      border-color: var(--md-sys-color-outline);

      /* border-y */
      border-width: 1px 0;
    }

    .group .fillers .filler-middle label {
      display: block;
      /* text-slate-400 */
      color: var(--md-sys-color-on-surface-variant);

      /* whitespace-nowrap */
      white-space: nowrap;

      /* transition-all */
      transition-property: all;
      transition-timing-function: cubic-bezier(0.4, 0, 0.2, 1);
      transition-duration: 150ms;

      /* translate-y-1/3 */
      /* transform: translateY(33.33333333333333%); */
      translate: 0 0.75rem;

      font-family: var(--md-sys-typescale-body-large-font-family-name);
      line-height: var(--md-sys-typescale-body-large-line-height);
      font-size: var(--md-sys-typescale-body-large-font-size);
      font-weight: var(--md-sys-typescale-body-large-font-weight);
      letter-spacing: var(--md-sys-typescale-body-large-letter-spacing);
    }

    .group .fillers .filler-end {
      border-color: var(--md-sys-color-outline);

      border-width: 1px 1px 1px 0;

      border-radius: 0 0.375rem 0.375rem 0;

      width: 100%;
    }

    /* Only remove border top when label moves up e.g focus, not-empty, placeholder shown */
    .group:focus-within .fillers .filler-middle {
      /* border-t-transparent */
      border-top-color: transparent;
    }

    /* Only move label up when label moves up e.g focus, not-empty, placeholder shown */
    .group:focus-within .fillers .filler-middle label {
      translate: 0 -0.5rem;
    }

    /* Only move label up when label moves up e.g focus, not-empty, placeholder shown */
    .group:focus-within .fillers .filler-middle label {
      /* text-xs */
      /* font-size: 0.75rem;
      line-height: 1rem; */
      font-size: var(--md-sys-typescale-body-small-font-size);
      line-height: var(--md-sys-typescale-body-small-line-height);
    }
  `;

  // TODO check if I can remove outer two divs
  view(): TemplateResult {
    return html`<div>
      <div class="group">
        <input id="input" value="Label text" />
        <div class="fillers">
          <!-- Filler start -->
          <div class="filler-start"></div>
          <!-- Filler middle -->
          <div class="filler-middle">
            <label for="input">Label text 1</label>
          </div>
          <!-- Filler end -->
          <div class="filler-end"></div>
        </div>
      </div>
    </div>`;
  }
}

customElements.define("dim-outlined-input", OutlinedInput);
