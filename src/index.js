/**
 * @file Public entry point for the http-content-location-header library.
 *
 * The library's single responsibility is to take the value of an HTTP
 * Content-Location header and resolve it against a base URL so callers always
 * receive an absolute URL string. The parser is intentionally strict about
 * what RFC 9110 considers a single header field value; it refuses to
 * interpret commas inside Content-Location as a delimiter, because unlike
 * Location, Content-Location holds exactly one URI-reference per field.
 */

export { resolveContentLocation } from "./core.js";
