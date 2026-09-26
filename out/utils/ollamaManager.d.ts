export declare class OllamaManager {
    /**
     * A singleton startup promise. When non-null, Ollama is in the process of being
     * started. All concurrent callers await this same promise to prevent multi-spawn.
     */
    private static startupPromise;
    /**
     * Guards the user-facing warning dialog to ensure it is only shown once at a time.
     */
    private static isPrompting;
    /**
     * Silently checks if Ollama is reachable. Does NOT prompt the user.
     * Use this for background tasks (indexing, embeddings) that should not interrupt the user.
     */
    static isRunning(endpoint?: string): Promise<boolean>;
    /**
     * Ensures Ollama is running, prompting the user to start it if not.
     * Only one user-facing prompt can be shown at a time. If startup is already
     * in progress, all callers await the same singleton promise.
     *
     * @returns true if Ollama is running (or was successfully started), false otherwise.
     */
    static ensureRunning(endpoint?: string): Promise<boolean>;
    /**
     * Ping Ollama's root endpoint. Returns true if responsive.
     */
    private static ping;
    /**
     * Spawns 'ollama serve' as a fully detached, hidden background process.
     * Polls until Ollama is reachable or the timeout expires.
     * This method is guaranteed to be called at most once concurrently.
     */
    private static startOllama;
}
//# sourceMappingURL=ollamaManager.d.ts.map