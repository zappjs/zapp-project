import * as _ from 'lodash'
import * as fs from 'fs';
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
        const repoPath = repo.path || `${homedir()}/.zapp/generators/${domain}/${username}/${repoName}/${repo.version}`;

        generatorPaths.push(repoPath);
      });
    });
  });

  // console.log('Generator Paths:');
  // console.log(generatorPaths);

  const generators = await Promise.all(
    generatorPaths.map((generatorPath) => {
      return load({ dir: generatorPath, isGenerator: true });
    })
  );

  return generators
    .filter((generator: any) => !!generator.exports)
    .map((generator: any) => generator.exports);
}
