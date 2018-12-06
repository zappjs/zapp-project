import * as assert from 'assert';

import { load } from '..';

describe('load', () => {
  it('should load project', async () => {
    const project = await load({ dir: `${__dirname}/data/basic` });

    assert.deepStrictEqual(project, {
      specs: {
        app: {
          name: 'test',
          version: '1.0.0'
        }
      }
    });
  });
});
