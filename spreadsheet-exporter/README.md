## Setup

(Optional, if you use test_client) `test_client/.credential`: spreadsheet-exporter credential

This is necessary only if you deploy:
```
deno run -A npm:@google/clasp@2.4.2 login
```

## Deploy

```sh
deno task deploy
```

## Test Run

```sh
deno task test-client 1
deno task test-client 2
```
