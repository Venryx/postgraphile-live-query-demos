# PostGraphile Live-Query Demos

Demos showing how to implement live-queries in PostGraphile, using various client libraries and change-stream protocols.

## Demos

### Todo app

Simple todo application, letting the user create, edit, reorder, and delete todo entries.

#### Server variants

Base ([entry point](/Demos/TodoApp/Server/Variants/Base.ts))

> Uses Postgraphile's official "subscription-lds" plugin to send change-stream updates to the client.
>
> Pro: Works with any client that supports subscriptions.  
> Con: High overhead for change-feed updates, because the entire result set is resent each time.

With JSON patches ([entry point](/Demos/TodoApp/Server/Variants/WithJSONPatches.ts))

> Uses the [graphql-live-query](https://github.com/n1ru4l/graphql-live-query) libraries (with a Postgraphile plugin around it) to send change-stream updates to the client.
>
> Pro: Low overhead for change-feed updates, because only the delta for the result-set is sent each time.  
> Con: Requires adding plugins to both the server and client code, for the deltas to be generated and applied.

#### Client variants

Apollo, vanilla ([entry point](/Demos/TodoApp/Client/Variants/Apollo_Base.ts))

> Pro: Uses the standard API of a popular GraphQL client library, easing the learning curve.   

Apollo + MobX Graphlink ([entry point](/Demos/TodoApp/Client/Variants/Apollo_MobXGraphlink.ts))

> Pro: Uses a layer-2 library which runs on top of Apollo, and provides a streamlined and highly-composable way to access, cache, and receive change-feed updates for database contents.  
> Con: The library's design philosophy is highly opinionated, and uses [MobX](https://github.com/mobxjs/mobx) as its client-side update-propagation mechanism. This accelerates development for people who agree with its approach, but will be confusing to developers unfamiliar with its "deeply-nested accessor" system.  
> Con: The library's documentation is severely lacking at the moment.