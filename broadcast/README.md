## Setup

`apps-script-api-conf.json`:

```json
{
  "clientId": "...",
  "clientSecret": "..."
}
```

`obs-websocket-conf.json`:

```json
{
  "address": "ws://...",
  "password": "..."
}
```

## Run

```sh
deno task build
deno task start
```

## Dev

```sh
deno task dev
```
