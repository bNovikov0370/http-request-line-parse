# http-request-line-parse

Parses an HTTP request line into `method`, `target`, and `protocolVersion`.

```js
import { parseRequestLine, ParseErrorCode } from "http-request-line-parse";

const result = parseRequestLine("GET /index.html HTTP/1.1");
if (result.ok) {
  console.log(result.method, result.target, result.protocolVersion);
  // → GET /index.html HTTP/1.1
} else {
  console.error("parse failed:", ParseErrorCode[result.error]);
}
```

## Why

Splitting an HTTP request line by hand looks trivial until you remember the
trailing CR that appears when someone split on `"\n"` instead of `"\r\n"`,
or the single leading space a raw transport layer sometimes emits. This
library handles those two real-world quirks and nothing more.

The request target is returned verbatim. It is **not** validated against the
origin-form / absolute-form / authority-form / asterisk-form grammar, because
which form is valid depends on whether you are an origin server or a proxy.
A library that guessed would reject legitimate requests.

## Edge you will hit

If the request target itself contains a space (an illegal but occasionally
seen case), the line will have more than three space-separated parts and the
parse fails with `ParseErrorCode.NOT_THREE_PARTS`. This is intentional — there
is no correct way to recover the boundary between method and target when the
target is unencoded and contains spaces.
