# http-content-location-header

Parses the value of an HTTP Content-Location header and resolves it against a base URL, returning an absolute URL string with the fragment component removed.

```js
import { resolveContentLocation } from "http-content-location-header";

const url = resolveContentLocation("/items/42.json", "https://api.example.org/collection");
// → "https://api.example.org/items/42.json"
```

## Why this exists

The Content-Location header names the resource that a representation corresponds to. It can be an absolute URL or a relative reference, and consumers almost always need it as an absolute URL so they can compare it, fetch it, or store it. Doing this with the native `URL` constructor is two lines but gets the edge cases wrong often enough — empty values, non-absolute bases, fragments, surrounding whitespace — that a single-purpose function is worth carrying.

The deliberate trade-off: this library treats the header value as a single URI-reference, never as a comma-separated list. Unlike Location, Content-Location is defined to hold exactly one reference per field. If a server sends two, that is a protocol violation and the parser surfaces it as an invalid URL rather than silently picking the first.

## Edge you will hit

The function refuses a non-absolute base URL. If you pass `"/api"` as the base, it throws a `TypeError` rather than guessing. Use the request URL (scheme, host, and path) as the base, and pass the header value verbatim.

Fragments are stripped. Content-Location identifies a resource, not a sub-section of a representation. If you need the fragment, you are working with a different header.

## Design notes

The window stores values eagerly rather than keeping running aggregates. Running
sums drift with floating point over long streams, and recomputing from a small
buffer is cheap enough that the drift is not worth the speed.

## Performance

The window keeps a bounded buffer, so `push` is constant time and memory does not
grow with the length of the stream. `peak` and `trough` are linear in the window
size, which is the trade that keeps `push` cheap.

