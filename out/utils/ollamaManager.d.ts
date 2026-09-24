export declare class OllamaManager {
    private static isPrompting;
    /**
     * Check if Ollama is running. If not, prompt the user to start it.
     * Returns true if Ollama is running (or successfully started), false otherwise.
     */
    static ensureRunning(endpoint?: string): Promise<boolean>;
    private static ping;
    private static startOllama;
}
//# sourceMappingURL=ollamaManager.d.ts.map