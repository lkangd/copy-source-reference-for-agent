"use strict";

const assert = require("node:assert/strict");
const { test } = require("node:test");
const { formatReference, formatMarkdown } = require("../src/format");

const file = "Tests/MenubarKitTests/BrandAssetsTests.swift";

test("a caret copies the path and its one-based line number", () => {
  const position = { line: 10, character: 0 };
  const selection = { start: position, end: position };
  assert.equal(formatReference("files.ts", selection, "@", "-"), "@files.ts:11");
});

test("selected text on one line adds a one-based line number", () => {
  const selection = { start: { line: 10, character: 2 }, end: { line: 10, character: 8 } };
  assert.equal(formatReference(file, selection, "@", "-"), `@${file}:11`);
});

test("a multi-line selection includes the final line when it contains selected text", () => {
  const selection = { start: { line: 10, character: 2 }, end: { line: 25, character: 8 } };
  assert.equal(formatReference(file, selection, "@", "-"), `@${file}:11-26`);
  assert.equal(formatReference(file, selection, "", ".."), `${file}:11..26`);
});

test("a selection ending at column zero excludes that line", () => {
  const selection = { start: { line: 10, character: 0 } };
  assert.equal(formatReference(file, { ...selection, end: { line: 26, character: 0 } }, "@", "-"), `@${file}:11-26`);
  assert.equal(formatReference(file, { ...selection, end: { line: 11, character: 0 } }, "@", "-"), `@${file}:11`);
});

test("Markdown preserves indentation and existing CRLF line endings", () => {
  const reference = "@src/extension.ts:15-19";
  const code = "  const value = true;\r\n  return value;\r\n";
  assert.equal(formatMarkdown(reference, code, "typescript"), [reference, "```typescript", code + "```"].join("\n"));
});

test("Markdown uses a longer fence when selected text contains a fence", () => {
  const code = "```js\nvalue\n```";
  assert.equal(formatMarkdown("@README.md:1-3", code, "markdown"), "@README.md:1-3\n````markdown\n```js\nvalue\n```\n````");
});
