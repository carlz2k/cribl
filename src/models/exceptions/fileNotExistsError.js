export class FileNotExistsError extends Error {
  constructor(message) {
    super(message); // (1)
    this.name = 'FileNotExistsError';
  }
}
