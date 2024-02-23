import { execute } from '../main';

describe('main', () => {
  test('should render result', async () => {
    await execute('taxi_zone_lookup.csv');
  }, 1200000);
});
