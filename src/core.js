/**
 * Resolve the value of an HTTP Content-Location header against a base URL.
 *
 * @param {string} headerValue - The raw Content-Location header value, as
 *   received from an HTTP message. Leading and trailing OWS (optional
 *   whitespace) is tolerated; internal whitespace is treated as data, matching
 *   RFC 9110's description of field values as ordered runs of octets.
 * @param {string} baseUrl - An absolute URL used as the base when the header
 *   value is a relative reference. Must itself be absolute, or the function
 *   throws — refusing to guess a base is safer than silently using a caller's
 *   ambient document URL.
 * @returns {string} An absolute URL string, with any fragment component
 *   removed. The Content-Location header identifies a resource, not a
 *   sub-section of one; keeping a fragment would mislead callers into thinking
 *   the server pointed at a fragment.
 * @throws {TypeError} If either argument is not a string, or if baseUrl is
 *   not an absolute URL.
 * @throws {Error} If headerValue cannot be parsed as a URI reference, or if
 *   resolution against the base yields an invalid URL.
 */
export function resolveContentLocation(headerValue, baseUrl) {
  if (typeof headerValue !== "string") {
    throw new TypeError(
      `Content-Location header value must be a string, got ${typeof headerValue}`,
    );
  }
  if (typeof baseUrl !== "string") {
    throw new TypeError(`Base URL must be a string, got ${typeof baseUrl}`);
  }

  // Reject empty values explicitly rather than falling through to URL(),
  // which would treat "" as a reference to the base itself. An empty
  // Content-Location is malformed, not a synonym for the base URL.
  const trimmed = headerValue.trim();
  if (trimmed === "") {
    throw new Error("Content-Location header value is empty");
  }

  const base = tryParseUrl(baseUrl);
  if (base === null || base.protocol === "") {
    // A non-absolute base URL is almost always a programming mistake on
    // the caller's side. Rather than silently coercing it (e.g. against
    // an ambient document URL), surface the problem immediately.
    throw new TypeError(`Base URL is not absolute: ${JSON.stringify(baseUrl)}`);
  }

  const resolved = tryParseUrl(trimmed, base);
  if (resolved === null || resolved.protocol === "") {
    throw new Error(
      `Content-Location value is not a valid URI reference: ${JSON.stringify(headerValue)}`,
    );
  }

  // Content-Location identifies the resource at the other end of the
  // link; a fragment would suggest a sub-section of a representation,
  // which is not what this header conveys. Strip it.
  resolved.hash = "";

  return resolved.href;
}

/**
 * Wrap the URL constructor so a bad input becomes null instead of throwing.
 *
 * The native URL() throws a TypeError on syntactic failure, which makes
 * distinguishing "not a URL" from "called URL wrong" awkward at call sites.
 * Returning null for both lets the caller present a uniform error.
 *
 * @param {string} input
 * @param {string|URL} [base]
 * @returns {URL|null}
 */
function tryParseUrl(input, base) {
  try {
    return new URL(input, base);
  } catch {
    return null;
  }
}
