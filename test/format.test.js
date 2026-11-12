"use strict";

const assert = require("node:assert/strict");
const { test } = require("node:test");
const { formatReference, formatMarkdown } = require("../src/format");

const file = "Tests/MenubarKitTests/BrandAssetsTests.swift";
const defaults = { prefix: "@", linePrefix: "#L", rangeSeparator: "-" };

test("a caret copies the path and its one-based line number", () => {
  const position = { line: 10, character: 0 };
  const selection = { start: position, end: position };
  assert.equal(formatReference("files.ts", selection, defaults), "@files.ts#L11");
});

test("selected text on one line adds a one-based line number", () => {
  const selection = { start: { line: 10, character: 2 }, end: { line: 10, character: 8 } };
  assert.equal(formatReference(file, selection, defaults), `@${file}#L11`);
});

test("a multi-line selection includes the final line when it contains selected text", () => {
  const selection = { start: { line: 10, character: 2 }, end: { line: 25, character: 8 } };
  assert.equal(formatReference(file, selection, defaults), `@${file}#L11-26`);
});

test("the line prefix and range separator can be configured independently", () => {
  const selection = { start: { line: 45, character: 2 }, end: { line: 67, character: 8 } };
  assert.equal(formatReference("file.ts", selection, defaults), "@file.ts#L46-68");
  assert.equal(formatReference("file.ts", selection, { ...defaults, linePrefix: ":" }), "@file.ts:46-68");
  assert.equal(formatReference("file.ts", selection, { ...defaults, rangeSeparator: ".." }), "@file.ts#L46..68");
  assert.equal(formatReference("file.ts", selection, { prefix: "", linePrefix: "§L", rangeSeparator: "~" }), "file.ts§L46~68");
});

test("a selection ending at column zero excludes that line", () => {
  const selection = { start: { line: 10, character: 0 } };
  assert.equal(formatReference(file, { ...selection, end: { line: 26, character: 0 } }, defaults), `@${file}#L11-26`);
  assert.equal(formatReference(file, { ...selection, end: { line: 11, character: 0 } }, defaults), `@${file}#L11`);
});

test("Markdown preserves indentation and existing CRLF line endings", () => {
  const reference = "@src/extension.ts#L15-19";
  const code = "  const value = true;\r\n  return value;\r\n";
  assert.equal(formatMarkdown(reference, code, "typescript"), [reference, "```typescript", code + "```"].join("\n"));
});

test("Markdown uses a longer fence when selected text contains a fence", () => {
  const code = "```js\nvalue\n```";
  assert.equal(formatMarkdown("@README.md#L1-3", code, "markdown"), "@README.md#L1-3\n````markdown\n```js\nvalue\n```\n````");
});
