import * as _ from 'lodash'
import { spawnSync } from 'child_process';
import { homedir } from 'os';

import load from './load';

export default async function loadImports({ imports }) {
  const generatorPaths = [];

  Object.keys(imports).forEach((domain) => {
    const users = imports[domain];
    Object.keys(users).forEach((username) => {
      const repos = users[username];
      Object.keys(repos).forEach((repoName) => {
        const repo = repos[repoName];

        if (repo.path) {
          console.log(`Loading import at: ${repo.path}`);
          generatorPaths.push(repo.path);
          return;
        }

        if (repo.version) {
          console.log(`Loading import with version: ${repo.version}`);
          const version = repo.version || 'master';
          const dest = `${homedir()}/.zapp/imports/${domain}/${username}/${repoName}/${version}`;
          const cloneCmd = `git clone https://${domain}/${username}/${repoName}.git ${dest}`;
          spawnSync(cloneCmd.split(' ')[0], cloneCmd.split(' ').slice(1));
          const checkoutCmd = `git checkout ${version}`;
          spawnSync(
            checkoutCmd.split(' ')[0],
            checkoutCmd.split(' ').slice(1),
            {
              cwd: dest
            }
          );
          generatorPaths.push(dest);
        }
      });
    });
  });

  const generators = await Promise.all(
    generatorPaths.map((generatorPath) => {
      return load({ dir: generatorPath, isGenerator: true });
    })
  );

  return generators
    .filter((generator: any) => !!generator.exports)
    .map((generator: any) => generator.exports);
}
