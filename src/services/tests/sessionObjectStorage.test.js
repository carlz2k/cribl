import { SessionObjectStorage } from '../sessionObjectStorage';

describe('sessionObjectStorage', () => {
  test('should be able to set and retrieve session storage by id', async () => {
    const sessionObjectStorage = new SessionObjectStorage();
    const sessionObject = sessionObjectStorage.add();

    const sessionObjectFound = sessionObjectStorage.get(sessionObject.id);
    expect(sessionObjectFound.id).toBeDefined();
    expect(sessionObjectFound).toEqual(sessionObject);
  });

  test('should be able to set next partition id to 1', async () => {
    const sessionObjectStorage = new SessionObjectStorage();
    const sessionObject = sessionObjectStorage.add({
      partition: {
        id: 2,
      },
    });

    sessionObjectStorage.setToNextPartitionId(sessionObject.id);
    const sessionObjectFound = sessionObjectStorage.get(sessionObject.id);
    expect(sessionObjectFound.nextPartitionId).toBe(1);
  });

  test('should be able to set next partition id to undefined when no next partition', async () => {
    const sessionObjectStorage = new SessionObjectStorage();
    const sessionObject = sessionObjectStorage.add({
      partition: {
        id: 0,
      },
    });

    sessionObjectStorage.setToNextPartitionId(sessionObject.id);
    const sessionObjectFound = sessionObjectStorage.get(sessionObject.id);
    expect(sessionObjectFound.nextPartitionId).not.toBeDefined();
  });
});
