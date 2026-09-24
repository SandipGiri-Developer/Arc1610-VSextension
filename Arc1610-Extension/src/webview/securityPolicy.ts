import * as vscode from 'vscode';

/**
 * Generate a strict Content Security Policy for the webview.
 * 
 * Prevents execution of inline scripts (except our specific nonce),
 * restricts connect-src (since API calls happen in the extension host, not webview),
 * and prevents framing.
 */
export function getCsp(webview: vscode.Webview, nonce: string): string {
  return [
    `default-src 'none'`,
    // Allow styles from the extension uri and inline styles (needed by React sometimes)
    `style-src ${webview.cspSource} 'unsafe-inline'`,
    // Only allow scripts with the generated nonce
    `script-src 'nonce-${nonce}'`,
    // Allow fonts if needed
    `font-src ${webview.cspSource}`,
    // The webview doesn't make direct API calls — all network happens in the extension host
    `connect-src 'none'`,
    // Images allowed from extension and data URIs
    `img-src ${webview.cspSource} data:`,
    // Frame control
    `frame-src 'none'`,
  ].join('; ');
}
