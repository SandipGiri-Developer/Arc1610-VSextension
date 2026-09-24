# ARC1610 UI Rewrite Plan (Based on Continue)

## 1. Issue with Current UI Rendering
The complete blank screen encountered earlier was diagnosed as a VS Code debugger attachment failure (causing the Extension Host to freeze on line 1, thus never calling `activate()` or registering the Webview provider). This was not a React bug, but rather an environment issue, bypassed by running without debugging or using the packaged `.vsix`. Additionally, the view container registration warning was resolved by replacing the non-existent `.svg` with a native VS Code ThemeIcon (`$(hubot)`).

## 2. Analysis of Continue's Codebase & Dependencies
Based on the `gui/package.json` and architectural patterns in Continue:
- **Core Framework**: React 18 + Vite.
- **Styling**: Tailwind CSS combined with standard VS Code theme variables (`var(--vscode-*)`) to ensure native appearance.
- **State Management**: Redux Toolkit is used heavily in Continue, but for Arc1610's lighter initial scope, React Context + `useReducer` will suffice without overcomplicating the bundle.
- **Markdown & Code**: 
  - `react-markdown` for rendering.
  - `react-syntax-highlighter` for code blocks.
  - `remark-math` / `rehype-katex` for math rendering.
- **Icons**: HeroIcons and Radix icons (we will use `lucide-react` which we already have, as it provides a cleaner, matching aesthetic).
- **Webview Communication**: Typed `postMessage` architecture.

## 3. Selected Technologies for ARC1610
We will adopt the following dependencies to mirror Continue's UI capabilities:
- `tailwindcss`, `postcss`, `autoprefixer` (Styling engine)
- `tailwind-merge`, `clsx` (Dynamic class utilities)
- `react-markdown`, `react-syntax-highlighter`, `remark-gfm` (Robust Markdown rendering)

## 4. Architectural Plan & Component Structure

**Component Tree:**
- `App` (Main container, handles VS Code messaging and state)
  - `SidebarHeader` (Title, + New Chat, History, Settings)
  - `ChatHistory` (Scrollable message list)
    - `MessageBubble` (User / Assistant messages, tailored styling)
      - `MarkdownRenderer` (Memoized component for rendering Markdown and Code)
      - `MessageActions` (Copy, Regenerate, Delete)
  - `ChatInputArea` (Textarea, Send/Stop buttons)
    - `ModelSelector` (Dropdown linked to provider config)
  - `SettingsView` (Dedicated view for provider configurations)

**Streaming Architecture:**
- The extension host streams data to the webview via `streamProgress` messages.
- The webview maintains a `isStreaming` state.
- A "Stop" button in the input area will send a `cancelStream` message back to the host.
- The host uses an `AbortController` to terminate the active LLM network request instantly.

## 5. Implementation Steps
1. **Initialize Tailwind CSS** inside the `webview` directory.
2. **Install Markdown Libraries** for proper code highlighting.
3. **Rewrite `App.tsx`** to implement the strict structural layout defined in the plan.
4. **Implement `MarkdownRenderer.tsx`** to handle code blocks and syntax highlighting natively.
5. **Implement `ChatInputArea.tsx`** with auto-resizing, the model selector, and the Stop button.
6. **Hook up `AbortController`** in the backend `Arc1610ViewProvider` and LLM providers to ensure genuine stream cancellation.
