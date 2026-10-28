/**
 * Re-exports the public API of http-request-line-parse.
 *
 * Keeping the entry point as a thin barrel file means callers import from
 * the package root (`import { parseRequestLine } from "http-request-line-parse"`)
 * while the parsing logic stays in its own module for testability.
 */
export { parseRequestLine, ParseErrorCode } from "./core.js";
