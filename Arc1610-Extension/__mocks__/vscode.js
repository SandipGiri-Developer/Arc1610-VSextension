module.exports = {
  window: {
    createOutputChannel: jest.fn(() => ({
      appendLine: jest.fn(),
      clear: jest.fn(),
      show: jest.fn(),
      dispose: jest.fn(),
    })),
    showInformationMessage: jest.fn(),
    showErrorMessage: jest.fn(),
  },
  workspace: {
    getConfiguration: jest.fn(() => ({
      get: jest.fn(),
      update: jest.fn(),
    })),
    workspaceFolders: [],
  },
  EventEmitter: class {
    constructor() {
      this.event = jest.fn();
    }
    fire() {}
    dispose() {}
  },
  Uri: {
    file: jest.fn((path) => ({ fsPath: path })),
  },
};
