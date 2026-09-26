# Change Log

All notable changes to the "KODRA" extension will be documented in this file.

Check [Keep a Changelog](http://keepachangelog.com/) for recommendations on how to structure this file.

## [0.1.1] - 2026-09-26

###  UI & Aesthetics (Big Changes)
- **New ARC Logo & Chat Empty State**: Completely replaced the generic "Starting a new chat..." text with the new 56x56 ARC logo centered in the chat body. 
- **Dynamic Logo Fade**: Implemented an interaction where the ARC logo becomes invisible the moment the first message is sent, seamlessly transitioning into the normal conversation.
- **Redesigned Stop Button**: Overhauled the "Stop generating" button with a highly professional, modern UI. It now features a transparent, blurry outer circle with a soft red square inside, enhanced by micro-interaction glow effects on hover.
- **Removed Emojis**: Scoured and removed non-professional emojis across the UI to ensure KODRA looks and feels like premium developer tooling.
- **Layout Fixes**: Fixed chat container overflow issues (added `shrink-0`) so the UI behaves smoothly and no longer gets squished.

###  Bugs & Errors Resolved
- **Extension Host Crash Loop**: Fixed the "Extension host did not start in 10 seconds" freezing bug. The issue was traced to uncaught exceptions from third-party extensions breaking the VS Code debugger initialization in the Extension Development Host.
- **VS Code Tasks Compilation Fix**: Corrected `.vscode/tasks.json` `problemMatcher` `endsPattern` so the VS Code debugger actually launches immediately when Webpack finishes compiling instead of hanging.
- **Webpack Build Configuration**: Updated `libraryTarget` from `commonjs2` to `commonjs` so VS Code correctly recognizes the extension's `activate` exports, preventing "activate is not exported" module errors.
- **Git Tracking Fixes**: Correctly configured `.gitignore` and `.vscodeignore` to permanently exclude local configs, build artifacts (`webview/dist`), `.arc1610`, `.continue` files, and the isolated testing environment.
- **Webview Build Pipeline**: Fixed the pipeline issue to correctly compile Vite webview assets into `dist/assets` before the extension launches.

###  Features Added
- **Isolated Testing Environment**: Created a dedicated `Testing-enviroment` workspace. Configured `.vscode/launch.json` to automatically open this specific folder whenever hitting F5, ensuring that testing extension capabilities doesn't pollute the main codebase.
- **Architectural RAG Research**: Conducted an in-depth architectural analysis of the local Continue codebase, fully documenting the entire Retrieval-Augmented Generation (RAG), indexing, embedding, chunking, and vector storage flow into `continue_rag_architecture.md`.

## [0.1.0] - 2026-09-20

- Initial release