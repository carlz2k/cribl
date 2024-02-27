import { SessionObjectStorage } from '../sessionObjectStorage';

describe('sessionObjectStorage', () => {
  test('should be able to set and retrieve session storage by id', async () => {
    const sessionObjectStorage = new SessionObjectStorage();
    const sessionObject = sessionObjectStorage.add();

    const sessionObjectFound = sessionObjectStorage.get(sessionObject.id);
    expect(sessionObjectFound.id).toBeDefined();
    expect(sessionObjectFound).toEqual(sessionObject);
  });
});
