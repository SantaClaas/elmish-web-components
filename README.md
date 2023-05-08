# Elmish Web Components

A Web App Component Framework built with Elmish on top of lit-html

## Attribution 👏

- This library is using [Elmish](https://github.com/elmish/elmish). The code was copied and converted to TypeScript by me. Elmish is again based on the Model View Update architecture [made famouns by Elm](https://github.com/elmish/elmish#elmish-elm-like-abstractions-for-f-applications)

- [fast-blurhash](https://github.com/mad-gooze/fast-blurhash) [License](https://github.com/mad-gooze/fast-blurhash/blob/main/LICENSE) based on [Blurhash](https://github.com/woltapp/blurhash/), to decode blurhash provided by Mastodon API to show a preview of images or use as background fill instead of black bars. [fast-blurhash](https://github.com/mad-gooze/fast-blurhash) seems to offer a ✨ Performance ✨ improvement at no additional cost (although the improvement is debatable as I didn't measure it in the app)

- Open Props, because it makes styling web components with CSS variables easier
  - Setting up open props: https://stackblitz.com/edit/jit-open-props?file=index.css
  - https://youtu.be/szPNMKZazzQ
  - https://youtu.be/ohJcZW60br0

## ✨ Random Idea list ✨

- Integrate navigation and router with subscriptions
  - when a navigation occurs, a subscription gets triggered and it is resolved client side
- Integrate attribute change on component with subscriptions
- Add cool looking console logging for tracer with slick console APIs and console CSS styling
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
- Add ⚖️ licenses page and find out how to include license in source code
- Try out a more functional programming approach to web components as it would better fit elmish by just defining the functions without a class and annotating them with decorators that mark them as the MVU parts of the elmish component. The decorators build the class from the marked functions and sets up the the lifecycle loop. Property changes are handled through the message type and the update functions can accept the property change notifications.
- Provide advanced permissions UI to allow users to select what OAuth scopes the app has acccess to. In the spirit of OAuth
- Try out [Popover API](https://developer.mozilla.org/en-US/docs/Web/HTML/Global_attributes/popover)

## A Note on Performance

Performance is not my first concern but important. Much of the code I write is allocating new objects as I prefer immutability and I'll change it when required later when I have concrete measurements.

## Roadmap 🛣️

- Allow easy separation of styling and markup for components ✅
- Create new app after user wants to authorize with server for that server and persist credentials in storage
- Simplify route state management (Routing)

## Backlog 🔙🪵

- Allow sharing styles between components
  - This extends "Allow easy separation of styling and markup for components"
- Separate Dim Ice App and Elmish Web Components library
  - Set up NPM package for library
  - Use library in Dim Ice App through NPM
    - Check if that doesn't create too much overhead
    - Check if you can use local path for packages
  - Set up GitHub Actions pipeline to automatically publish package
- Set up GitHub Actions pipleline to automaticall publish Dim Ice App
- Set up code workspace with recommended settings and extensions

<br/>

## Why not just use Fable and F#?

I find F# to be the nicer language but TS is more practical and offers a lot of functional program functionality (hehe) too.

## Why not just compile elmish to JS and import that

I wanted to know how elmish works under the hood
