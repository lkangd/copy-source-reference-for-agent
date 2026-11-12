"use strict";

const path = require("node:path");
const vscode = require("vscode");
const { formatReference, formatMarkdown } = require("./format");

const SECTION = "copySourceReferenceForAgent";
const LEGACY_SECTION = "copyPathForAgent";
const MARKDOWN_CONTEXT = `${SECTION}.markdownPending`;
const FOLLOW_UP_MS = 2_000;

function readSetting(config, legacyConfig, key, defaultValue) {
  const setting = config.inspect(key);
  const value = config.get(key, defaultValue);
  if (setting?.globalValue !== undefined
      || setting?.workspaceValue !== undefined
      || setting?.workspaceFolderValue !== undefined) {
    return value;
  }
  return legacyConfig.get(key, value);
}

function activate(context) {
  const status = vscode.window.createStatusBarItem(`${SECTION}.status`, vscode.StatusBarAlignment.Left);
  status.name = "Copy Source Reference for Agent";
  let statusTimer;
  let pending;
  let pendingTimer;
  let clipboardQueue = Promise.resolve();
  let latestRequest = 0;

  function clearPending() {
    if (pending) {
      pending = undefined;
      clearTimeout(pendingTimer);
      void vscode.commands.executeCommand("setContext", MARKDOWN_CONTEXT, false);
    }
  }

  function showStatus(message, { error = false, followUp = false } = {}) {
    clearTimeout(statusTimer);
    status.color = error ? undefined : new vscode.ThemeColor("terminal.ansiGreen");
    status.backgroundColor = error ? new vscode.ThemeColor("statusBarItem.errorBackground") : undefined;
    const icon = error ? "$(error)" : "$(check)";
    status.text = `${icon} ${message.replace(/\$\(/g, "\\$(")}`;
    status.tooltip = followUp ? `${message}\nPress M to include Markdown. You can keep the copy shortcut modifiers held.` : message;
    status.show();
    statusTimer = setTimeout(() => status.hide(), error ? 4_000 : FOLLOW_UP_MS);
  }

  function fail(message) {
    showStatus(`Copy failed: ${message}`, { error: true });
  }

  function writeClipboard(text) {
    const write = clipboardQueue.then(() => vscode.env.clipboard.writeText(text));
    clipboardQueue = write.catch(() => {});
    return write;
  }

  function isCurrent({ editor, selection, version }) {
    return vscode.window.activeTextEditor === editor
      && editor.document.version === version
      && editor.selection.isEqual(selection);
  }

  async function copyReference(absolute) {
    const request = ++latestRequest;
    clearPending();

    const editor = vscode.window.activeTextEditor;
    if (!editor) {
      fail("Open a source file first.");
      return;
    }

    const { document, selection } = editor;
    const { uri } = document;
    if (uri.scheme !== "file" && uri.scheme !== "vscode-remote") {
      fail("Open a file with a filesystem path first.");
      return;
    }
    if (!absolute && !vscode.workspace.getWorkspaceFolder(uri)) {
      fail("File is outside the workspace. Use Copy Absolute Path.");
      return;
    }

    const config = vscode.workspace.getConfiguration(SECTION, uri);
    const legacyConfig = vscode.workspace.getConfiguration(LEGACY_SECTION, uri);
    const filePath = path.normalize(absolute ? uri.fsPath : vscode.workspace.asRelativePath(uri));
    const reference = formatReference(filePath, selection, {
      prefix: readSetting(config, legacyConfig, "prefix", "@"),
      linePrefix: config.get("linePrefix", "#L"),
      rangeSeparator: readSetting(config, legacyConfig, "rangeSeparator", "-"),
    });
    const snapshot = { editor, selection, version: document.version, reference };

    try {
      await writeClipboard(reference);
    } catch {
      if (request === latestRequest) {
        fail("Could not write to the clipboard.");
      }
      return;
    }
    if (request !== latestRequest) {
      return;
    }

    const followUp = isCurrent(snapshot);
    if (followUp) {
      pending = snapshot;
      void vscode.commands.executeCommand("setContext", MARKDOWN_CONTEXT, true);
      pendingTimer = setTimeout(clearPending, FOLLOW_UP_MS);
    }
    showStatus(`Copied: ${reference}`, { followUp });
  }

  async function copyMarkdown() {
    const snapshot = pending;
    clearPending();
    if (!snapshot || !isCurrent(snapshot)) {
      return;
    }

    const request = ++latestRequest;
    const { editor, selection, reference } = snapshot;
    const { document } = editor;
    const code = selection.isEmpty ? document.lineAt(selection.active.line).text : document.getText(selection);

    try {
      await writeClipboard(formatMarkdown(reference, code, document.languageId));
    } catch {
      if (request === latestRequest) {
        fail("Could not write Markdown to the clipboard.");
      }
      return;
    }
    if (request === latestRequest) {
      showStatus(`Copied with Markdown: ${reference}`);
    }
  }

  // Keep user keybindings from earlier versions working after the command IDs change.
  for (const section of [SECTION, LEGACY_SECTION]) {
    context.subscriptions.push(
      vscode.commands.registerCommand(`${section}.copyRelative`, () => copyReference(false)),
      vscode.commands.registerCommand(`${section}.copyAbsolute`, () => copyReference(true)),
      vscode.commands.registerCommand(`${section}.copyMarkdown`, copyMarkdown),
    );
  }

  context.subscriptions.push(
    status,
    vscode.window.onDidChangeActiveTextEditor(clearPending),
    vscode.window.onDidChangeTextEditorSelection(({ textEditor }) => {
      if (pending?.editor === textEditor && !isCurrent(pending)) {
        clearPending();
      }
    }),
    vscode.workspace.onDidChangeTextDocument(({ document }) => {
      if (pending?.editor.document === document && !isCurrent(pending)) {
        clearPending();
      }
    }),
    vscode.window.onDidChangeWindowState(({ focused }) => {
      if (!focused) {
        clearPending();
      }
    }),
    new vscode.Disposable(() => {
      latestRequest++;
      clearPending();
      clearTimeout(statusTimer);
    }),
  );
}

module.exports = { activate };
