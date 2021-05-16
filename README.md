# PostGraphile Live-Query Demos

Demos showing how to implement live-queries in PostGraphile, using various client libraries and change-stream protocols.

## Installation

1) Ensure [PostgreSQL](https://www.postgresql.org/) (v10+) is installed.

2) Ensure your PostgreSQL server [has logical decoding enabled](https://www.graphile.org/postgraphile/live-queries/#graphilesubscriptions-lds), by ensuring the following settings are set in `postgresql.conf` (and then restarting PostgreSQL):
```
wal_level = logical
max_wal_senders = 10
max_replication_slots = 10
```
(Note: you can determine where your `postgresql.conf` file is by running `psql template1 -c 'SHOW config_file'`)

3) Ensure the `wal2json` PostgreSQL plugin is installed: https://github.com/eulerto/wal2json#build-and-install

4) Ensure [NodeJS](https://nodejs.org) (v8.6+) is installed.

5) Clone/download this repo to disk. (https://github.com/Venryx/postgraphile-live-query-demos.git)

6) Install this repo's dependencies by running: `npm install`

7) Create a Postgres database for this project, by running: `createdb lq-demos`

8) Init `lq-demos` db in PostgreSQL, by running `npm start initDB`.

9) Set environment variables for the database's username (PGUSER) and password (PGPASSWORD).

## Running

1) Ensure the PostgreSQL server is running. (eg. start pgAdmin, which is installed with PostgreSQL)

2) Start the demo's frontend-dev-server and backend-build-watcher by running: `npm start dev`

3) Start the backend/server, by running: `npm start server.[todo].[base/patches]` (replace bracket-texts with choice of server variant)

4) Start the frontend/webpage, by navigating your browser to: http://localhost:8080

## Variants

Part of the reason I created these demos was to make it easy to compare the code clarity, performance, ease of installation, etc. of the various client libraries (eg. Apollo vanilla vs extended) and change-stream protocols (full resends vs json-patches).

To enable this comparison, I've created "variants" of the server and client code. Your selected server variant determines which "change-stream protocol" is used (the client code detects which server variant is active, and adjusts its receiving of the change-stream data accordingly). Your selected client variant determines how that data is utilized within the app once it's received.

### Server variants

Base

> Uses Postgraphile's official [subscription-lds](https://github.com/graphile/graphile-engine/tree/v4/packages/subscriptions-lds) plugin to send change-stream updates to the client.
>
> **Pro:** Works with any client that supports subscriptions, without plugins.  
> **Con:** High overhead for change-feed updates, because the entire result set is resent each time.

With JSON patches

> Uses the [graphql-live-query](https://github.com/n1ru4l/graphql-live-query) libraries (with a Postgraphile plugin around it) to send change-stream updates to the client.
>
> **Pro:** Low overhead for change-feed updates, because only the delta for the result-set is sent each time.  
> **Con:** Requires adding plugins to both the server and client code, for the deltas to be generated and applied.

### Client variants

Apollo, vanilla

> **Pro:** Uses the standard API of a popular GraphQL client library, easing the learning curve.   

Apollo + MobX Graphlink \[TODO\]

> **Pro:** Uses a layer-2 library ([mobx-graphlink](https://github.com/Venryx/mobx-graphlink)) which runs on top of Apollo, and provides a streamlined and highly-composable way to access, cache, and receive change-feed updates for database contents.  
> **Con:** The library's design philosophy is highly opinionated, and uses [MobX](https://github.com/mobxjs/mobx) as its client-side update-propagation mechanism. This accelerates development for people who agree with its approach, but will be confusing to developers unfamiliar with its "deeply-nested accessor" system.  
> **Con:** The library's documentation is severely lacking at the moment.

## Todo App demo

Simple todo application, letting the user create, edit, reorder, and delete todo entries.

**Server variants supported:** Base, JSON Patches  
**Client variants supported:** Apollo, Apollo + MobX Graphlink