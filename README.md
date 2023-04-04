# Why not just use Fable and F#?

I find F# to be the nicer language but TS is more practical and offers a lot of functional program functionality (hehe) too.

# Why not just compile elmish to JS and import that

I wanted to know how elmish works under the hood

# Attribution

This library is using [Elmish](https://github.com/elmish/elmish). The code was copied and converted to TypeScript by me but I think it is fair to say I am using what they build here. Elmish is again based on the Model View Update architecture [made famouns by Elm](https://github.com/elmish/elmish#elmish-elm-like-abstractions-for-f-applications)

# ✨ Random Idea list ✨

- Integrate navigation and router with subscriptions
  - when a navigation occurs, a subscription gets triggered and it is resolved client side
- Integrate attribute change on component with subscriptions
- Add cool looking console logging for tracer with often overlooked console APIs and console CSS styling
- Learn and implement Web Accessibility https://www.w3.org/WAI/ARIA/apg/

# A Note on Performance

Performance is not my first concern but important. Much of the code I write is allocating new objects as I prefer immutability and I'll change it when required later when I have concrete measurements.
