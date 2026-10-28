/**
 * Parse an HTTP request line into its three components.
 *
 * The request line is the first line of an HTTP request, as defined by
 * RFC 9112 §3:  `Method SP request-target SP HTTP-version CRLF`.
 *
 * Design decisions
 * ----------------
 * The CRLF terminator (or bare LF) is NOT consumed here — the caller splits
 * the request into lines first. We accept a line that may or may not have a
 * trailing CR; that covers both "\n" and "\r\n" split styles without a
 * fragile dual-path implementation.
 *
 * A single leading space before the method is tolerated (a strict parser
 * would reject it), because some raw transport layers emit it. No interior
 * or trailing whitespace is tolerated.
 */

/**
 * Machine-readable reason for a parse failure.
 * Numeric codes are used (not symbols) so the result is JSON-serialisable.
 */
export const ParseErrorCode = Object.freeze({
  EMPTY_INPUT: 1,
  NOT_THREE_PARTS: 2,
  INVALID_METHOD: 3,
  INVALID_VERSION: 4,
});

/**
 * Build a failure result.  The `ok` flag is kept boolean so callers can
 * branch with `if (!result.ok)` without worrying about truthiness edge cases.
 */
function fail(code) {
  return { ok: false, error: code };
}

// Method: one or more token characters.  RFC 9110 §5.1 defines a token as
// any visible US-ASCII char except delimiters.  For practical purposes the
// following regex covers every registered method (GET, POST, PATCH, M-SEARCH,
// etc.) without false-positives on control characters or spaces.
const METHOD_RE = /^[A-Z][A-Z0-9-]*$/;

// Version: literal "HTTP/" followed by exactly DIGIT "." DIGIT.
// We deliberately accept only the canonical form — no whitespace, no
// leading zeros beyond the single digit RFC 9112 permits.
const VERSION_RE = /^HTTP\/[0-9]\.[0-9]$/;

/**
 * @typedef {Object} ParseSuccess
 * @property {true}  ok
 * @property {string} method          Uppercase method token, e.g. "GET".
 * @property {string} target          Request target (origin-form, absolute-form, etc.).
 * @property {string} protocolVersion Version string exactly as it appeared, e.g. "HTTP/1.1".
 */

/**
 * @typedef {Object} ParseFailure
 * @property {false} ok
 * @property {number} error  A {@link ParseErrorCode} value.
 */

/**
 * Parse a single HTTP request line.
 *
 * @param {string} line  A request line **without** the trailing CRLF.
 *                       A trailing CR is tolerated and stripped.
 * @returns {ParseSuccess|ParseFailure}
 */
export function parseRequestLine(line) {
  if (typeof line !== "string") {
    throw new TypeError("parseRequestLine expects a string");
  }

  // A single trailing CR is tolerated so the function works whether the
  // caller split on "\n" (leaving a stray \r) or on "\r\n".
  let normalized = line.endsWith("\r") ? line.slice(0, -1) : line;

  // Tolerate at most one leading space — more than that is a malformed
  // request, not a transport quirk.
  if (normalized.startsWith(" ")) {
    normalized = normalized.slice(1);
  }

  if (normalized === "") {
    return fail(ParseErrorCode.EMPTY_INPUT);
  }

  // Exactly two single-space separators → three parts.
  const parts = normalized.split(" ");
  if (parts.length !== 3) {
    return fail(ParseErrorCode.NOT_THREE_PARTS);
  }

  const [method, target, version] = parts;

  if (!METHOD_RE.test(method)) {
    return fail(ParseErrorCode.INVALID_METHOD);
  }
  if (!VERSION_RE.test(version)) {
    return fail(ParseErrorCode.INVALID_VERSION);
  }

  // Target is returned verbatim.  We intentionally do **not** validate it as
  // an origin-form / absolute-form / authority-form / asterisk-form, because
  // the form depends on context (proxy vs. origin server) and a library that
  // tried to guess would reject valid requests.
  return {
    ok: true,
    method,
    target,
    protocolVersion: version,
  };
}
