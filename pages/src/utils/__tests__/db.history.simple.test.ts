import { DB } from '../db';

describe('DB History Simple', () => {
  let db: DB;

  beforeAll(() => {
    db = new DB();
  });

  afterAll(() => {
    db.close();
  });

  it('should track history when setting data', async () => {
    await db.init('test-client');
    const testData = { key: 'value' };
    await db.setData(testData);

    const history = await db.getHistory();
    expect(history).toHaveLength(1);
    expect(history[0].action).toBe('setData');
    expect(history[0].data).toEqual(testData);
    expect(history[0].clientId).toBe('test-client');
    expect(history[0].timestamp).toBeLessThanOrEqual(Date.now());
  });
});