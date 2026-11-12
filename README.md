# Copy Source Reference for Agent

Copy a source file reference and an optional Markdown snippet from VS Code or Cursor. Paste the result into a coding agent to point it to the code you want to discuss.

| Action | macOS | Windows / Linux |
| --- | --- | --- |
| Copy workspace-relative path | `Option+O` | `Alt+O` |
| Copy absolute path | `Option+Shift+O` | `Alt+Shift+O` |
| Add a Markdown snippet within 2 seconds after copying | `M`, `Option+M`, or `Option+Shift+M` | `M`, `Alt+M`, or `Alt+Shift+M` |

The two path commands are also available in the Command Palette under **Copy Source Reference for Agent**. The status bar briefly shows the copied reference or the reason the copy failed.

## Output

| Editor selection | Copied text |
| --- | --- |
| Caret on line 11 of `files.ts` with no selection | `@files.ts#L11` |
| Selected text on line 11 | `@Tests/MenubarKitTests/BrandAssetsTests.swift#L11` |
| Selected text on lines 11 through 26 | `@Tests/MenubarKitTests/BrandAssetsTests.swift#L11-26` |

Line numbers start at 1. A selection ending at the start of the next line leaves that line out of the range. With multiple cursors, the extension uses the primary selection. Relative paths follow VS Code's workspace convention, including the folder name in a multi-root workspace. For files outside the workspace, use **Copy Absolute Path**. Windows paths use backslashes, for example `@C:\projects\demo\src\extension.ts#L15-19`.

The Markdown shortcut replaces the clipboard contents with the same reference followed by the exact selected text in a language-tagged code block. With no selection, the snippet contains the current line. Editing the file, moving the selection, or switching editors ends the follow-up window.

````text
@src/format.js#L9-11
```javascript
  if (firstLine === lastLine) {
    return reference;
  }
```
````

## Settings

| Setting | Default | Example |
| --- | --- | --- |
| `copySourceReferenceForAgent.prefix` | `@` | `#` changes the prefix. `""` omits it. |
| `copySourceReferenceForAgent.linePrefix` | `#L` | `§L` changes the marker. `:` restores the earlier format, such as `:46-48`. |
| `copySourceReferenceForAgent.rangeSeparator` | `-` | `..` produces a range like `#L46..48`. |

The Marketplace build of v0.1.5 uses the `copyPathForAgent` prefix. Builds from this repository also read those settings when the corresponding `copySourceReferenceForAgent` setting is unset.

## Build and install

Use Node.js 22 or later for packaging.

```sh
npm test
npm run package
```

In either editor, run **Extensions: Install from VSIX...** and select `copy-source-reference-for-agent-0.1.6.vsix`.

## Publish

Upload the same VSIX to [Visual Studio Marketplace](https://marketplace.visualstudio.com/manage/publishers/) and [Open VSX](https://open-vsx.org/). Cursor discovers Open VSX extensions through its [extension marketplace](https://cursor.com/help/customization/extensions).

Use a publisher ID that you control on both registries and set `publisher` in `package.json` before packaging. The Visual Studio Marketplace accepts VSIX uploads from the publisher dashboard. Open VSX requires a [publisher agreement, an access token, and a matching namespace](https://github.com/eclipse-openvsx/openvsx/wiki/Publishing-Extensions). Once `OVSX_PAT` is set in your environment, publish the package with `npx ovsx publish copy-source-reference-for-agent-0.1.6.vsix`.
