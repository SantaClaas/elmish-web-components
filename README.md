# Elmish Web Components

A Web App Component Framework built with Elmish on top of lit-html

## Why not just use Fable and F#?

I find F# to be the nicer language but TS is more practical and offers a lot of functional program functionality (hehe) too.

## Why not just compile elmish to JS and import that

I wanted to know how elmish works under the hood

## Attribution

This library is using [Elmish](https://github.com/elmish/elmish). The code was copied and converted to TypeScript by me but I think it is fair to say I am using what they build here. Elmish is again based on the Model View Update architecture [made famouns by Elm](https://github.com/elmish/elmish#elmish-elm-like-abstractions-for-f-applications)

### Others:

- Open Props:
  - Setting up open props: https://stackblitz.com/edit/jit-open-props?file=index.css
  - https://youtu.be/szPNMKZazzQ
  - https://youtu.be/ohJcZW60br0

## ✨ Random Idea list ✨

- Integrate navigation and router with subscriptions
  - when a navigation occurs, a subscription gets triggered and it is resolved client side
- Integrate attribute change on component with subscriptions
- Add cool looking console logging for tracer with often overlooked console APIs and console CSS styling
- Learn and implement Web Accessibility https://www.w3.org/WAI/ARIA/apg/
- Add documentation "how to do x" where x could be something like "routing" and it explains that route change is just a change to the app model
- The awesome thing about elmish is that there are just a couple of base concepts and everything else fits into these concepts which makes understanding easier
- Extract token management to service worker which intercepts requests and automatically sets authorization header to bearer token. This makes calling the api easier and separates authorization concerns cleanly. Service worker is choosen because it is the only thing that can intercept requests
- Test if I can save a "snapshot" of the app model to some persistent storage and return to that state when the app is openend again
- Add settings like VS Code extensions https://code.visualstudio.com/api/references/contribution-points#contributes.configuration
- Use new Temporal API for dates https://tc39.es/proposal-temporal/docs/index.html
  Seeems to work in Chrome but not Firefox
- Use ETag from response header with If-None-Match request header and use caching to reduce bandwith and improve load times. See [MDN](https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/ETag)
- Try out material color utiilties https://www.npmjs.com/package/@material/material-color-utilities
- Use PostCSS plugins to fix custom media queries causing dark mode to break with open props
- Use :host pseudo selector to try and style custom element for grid component
- Use :blank pseudo selector to try fix styling of outlined input when autofilled
- Follow guidelines https://docs.joinmastodon.org/api/guidelines
  - Use link header with rel="next" from mastodon api for pagination

## A Note on Performance

Performance is not my first concern but important. Much of the code I write is allocating new objects as I prefer immutability and I'll change it when required later when I have concrete measurements.
