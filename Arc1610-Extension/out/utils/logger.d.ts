/**
 * Structured logger that writes to a dedicated VS Code output channel.
 * All log entries include timestamps and severity levels.
 */
export declare class Logger {
    private static instance;
    private outputChannel;
    private constructor();
    static getInstance(): Logger;
    info(message: string, ...args: unknown[]): void;
    warn(message: string, ...args: unknown[]): void;
    error(message: string, ...args: unknown[]): void;
    debug(message: string, ...args: unknown[]): void;
    private log;
    private stringify;
    show(): void;
    dispose(): void;
}
//# sourceMappingURL=logger.d.ts.map