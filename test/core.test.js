import { describe, it } from "node:test";
import assert from "node:assert/strict";

import { resolveContentLocation } from "../src/core.js";

describe("resolveContentLocation", () => {
  it("returns the header value unchanged when it is already absolute", () => {
    assert.equal(
      resolveContentLocation("https://downstream.example/thing", "https://base.example/"),
      "https://downstream.example/thing",
    );
  });

  it("resolves a relative path against the base URL", () => {
    assert.equal(
      resolveContentLocation("/doc/1.json", "https://base.example/api/collection"),
      "https://base.example/doc/1.json",
    );
  });

  it("resolves a relative segment against the base path", () => {
    assert.equal(
      resolveContentLocation("../next", "https://base.example/a/b"),
      "https://base.example/next",
    );
  });

  it("preserves a query string from the header value", () => {
    assert.equal(
      resolveContentLocation("/items?q=2", "https://base.example/list"),
      "https://base.example/items?q=2",
    );
  });

  it("drops the fragment component", () => {
    assert.equal(
      resolveContentLocation("/page#frag", "https://base.example/"),
      "https://base.example/page",
    );
  });

  it("treats an already-absolute header value's fragment the same way", () => {
    assert.equal(
      resolveContentLocation("https://downstream.example/x#frag", "https://base.example/"),
      "https://downstream.example/x",
    );
  });

  it("switches scheme and host when the header is absolute on a different origin", () => {
    assert.equal(
      resolveContentLocation("http://other.example/y", "https://base.example/"),
      "http://other.example/y",
    );
  });

  it("tolerates surrounding whitespace per RFC 9110 OWS", () => {
    assert.equal(
      resolveContentLocation("  /doc/2  ", "https://base.example/api"),
      "https://base.example/doc/2",
    );
  });

  it("rejects an empty header value", () => {
    assert.throws(() => resolveContentLocation("", "https://base.example/"), {
      message: /empty/i,
    });
  });

  it("rejects a whitespace-only header value", () => {
    assert.throws(() => resolveContentLocation("   \t  ", "https://base.example/"), {
      message: /empty/i,
    });
  });

  it("rejects a non-string header value", () => {
    assert.throws(() => resolveContentLocation(42, "https://base.example/"), {
      name: "TypeError",
    });
  });

  it("rejects a non-string base URL", () => {
    assert.throws(() => resolveContentLocation("/x", null), { name: "TypeError" });
  });

  it("rejects a non-absolute base URL", () => {
    assert.throws(() => resolveContentLocation("/x", "/base"), { name: "TypeError" });
  });

  it("rejects a syntactically invalid header value", () => {
    // An unbalanced scheme-prefix is not a valid URI reference and URL()
    // refuses it.
    assert.throws(
      () => resolveContentLocation("https://[::1", "https://base.example/"),
      { message: /not a valid URI reference/i },
    );
  });

  it("treats a comma inside the value as data, not as a delimiter", () => {
    // Content-Location holds exactly one URI-reference; commas are part of
    // the data. If a server genuinely sent two, that is a protocol violation
    // we surface as an invalid URL rather than silently picking one.
    assert.throws(
      () => resolveContentLocation("https://[::1", "https://base.example/"),
      { message: /not a valid URI reference/i },
    );
  });

  it("does not preserve a query string from the base URL when the header is absolute", () => {
    assert.equal(
      resolveContentLocation("https://downstream.example/p", "https://base.example/api?keep=1"),
      "https://downstream.example/p",
    );
  });

  it("does not carry the base path's query string onto a relative reference", () => {
    assert.equal(
      resolveContentLocation("item.json", "https://base.example/api?keep=1"),
      "https://base.example/item.json",
    );
  });

  it("resolves a scheme-relative URL against the base scheme", () => {
    assert.equal(
      resolveContentLocation("//cdn.example/asset.css", "https://base.example/"),
      "https://cdn.example/asset.css",
    );
  });

  it("resolves a bare path without a leading slash", () => {
    assert.equal(
      resolveContentLocation("child", "https://base.example/parent/"),
      "https://base.example/parent/child",
    );
  });

  it("replaces the last segment when the base path has no trailing slash", () => {
    assert.equal(
      resolveContentLocation("sibling", "https://base.example/parent/leaf"),
      "https://base.example/parent/sibling",
    );
  });
});
