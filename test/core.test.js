import { test } from "node:test";
import assert from "node:assert/strict";

import {
  parseRequestLine,
  ParseErrorCode,
} from "../src/core.js";

test("parses a standard GET request line", () => {
  const r = parseRequestLine("GET /index.html HTTP/1.1");
  assert.equal(r.ok, true);
  assert.equal(r.method, "GET");
  assert.equal(r.target, "/index.html");
  assert.equal(r.protocolVersion, "HTTP/1.1");
});

test("parses a POST with a query string in the target", () => {
  const r = parseRequestLine("POST /api?q=42 HTTP/2.0");
  assert.equal(r.ok, true);
  assert.equal(r.method, "POST");
  assert.equal(r.target, "/api?q=42");
  assert.equal(r.protocolVersion, "HTTP/2.0");
});

test("tolerates a trailing CR (caller split on LF)", () => {
  const r = parseRequestLine("GET / HTTP/1.1\r");
  assert.equal(r.ok, true);
  assert.equal(r.method, "GET");
});

test("tolerates a single leading space", () => {
  const r = parseRequestLine(" DELETE /resource HTTP/1.1");
  assert.equal(r.ok, true);
  assert.equal(r.method, "DELETE");
});

test("accepts an asterisk-form target (OPTIONS *)", () => {
  const r = parseRequestLine("OPTIONS * HTTP/1.0");
  assert.equal(r.ok, true);
  assert.equal(r.target, "*");
});

test("accepts an absolute-form target (proxy-style)", () => {
  const r = parseRequestLine("GET http://example.test/path HTTP/1.1");
  assert.equal(r.ok, true);
  assert.equal(r.target, "http://example.test/path");
});

test("rejects empty input", () => {
  const r = parseRequestLine("");
  assert.equal(r.ok, false);
  assert.equal(r.error, ParseErrorCode.EMPTY_INPUT);
});

test("rejects input that is only whitespace", () => {
  // After stripping the one tolerated leading space the remainder is empty.
  const r = parseRequestLine(" ");
  assert.equal(r.ok, false);
  assert.equal(r.error, ParseErrorCode.EMPTY_INPUT);
});

test("rejects a line with too few parts", () => {
  const r = parseRequestLine("GET /index.html");
  assert.equal(r.ok, false);
  assert.equal(r.error, ParseErrorCode.NOT_THREE_PARTS);
});

test("rejects a line with too many parts (target contains a space)", () => {
  const r = parseRequestLine("GET /path with space HTTP/1.1");
  assert.equal(r.ok, false);
  assert.equal(r.error, ParseErrorCode.NOT_THREE_PARTS);
});

test("rejects a lowercase method", () => {
  const r = parseRequestLine("get / HTTP/1.1");
  assert.equal(r.ok, false);
  assert.equal(r.error, ParseErrorCode.INVALID_METHOD);
});

test("rejects a malformed protocol version", () => {
  const r = parseRequestLine("GET / HTTP-1.1");
  assert.equal(r.ok, false);
  assert.equal(r.error, ParseErrorCode.INVALID_VERSION);
});

test("throws a TypeError on non-string input", () => {
  assert.throws(() => parseRequestLine(42), TypeError);
});
