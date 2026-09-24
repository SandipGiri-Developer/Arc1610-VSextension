import * as vscode from 'vscode';
/**
 * Generate a strict Content Security Policy for the webview.
 *
 * Prevents execution of inline scripts (except our specific nonce),
 * restricts connect-src (since API calls happen in the extension host, not webview),
 * and prevents framing.
 */
export declare function getCsp(webview: vscode.Webview, nonce: string): string;
//# sourceMappingURL=securityPolicy.d.ts.map