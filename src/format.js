"use strict";

function formatReference(filePath, selection, { prefix, linePrefix, rangeSeparator }) {
  const { start, end } = selection;
  const firstLine = start.line + 1;
  // The end is exclusive. Column zero leaves that line outside the selection.
  const lastLine = end.line > start.line && end.character === 0 ? end.line : end.line + 1;
  const reference = `${prefix}${filePath}${linePrefix}${firstLine}`;
  if (firstLine === lastLine) {
    return reference;
  }
  return `${reference}${rangeSeparator}${lastLine}`;
}

function formatMarkdown(reference, code, languageId) {
  let fenceLength = 3;
  for (const [backticks] of code.matchAll(/`+/g)) {
    fenceLength = Math.max(fenceLength, backticks.length + 1);
  }

  const fence = "`".repeat(fenceLength);
  const language = /^[\w.+-]+$/.test(languageId) ? languageId : "";
  const closingNewline = /[\r\n]$/.test(code) ? "" : "\n";
  return `${reference}\n${fence}${language}\n${code}${closingNewline}${fence}`;
}

module.exports = { formatReference, formatMarkdown };
