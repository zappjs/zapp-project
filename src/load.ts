import * as _ from 'lodash'
import * as glob from 'glob';
import * as fs from 'fs';
import * as path from 'path';
import * as yaml from 'js-yaml';
import { homedir } from 'os';

import merge from './merge';

function getItems(dir): Promise<[string]> {
  return new Promise((resolve, reject) => {
    glob(
      '**/*',
      {
        cwd: dir,
        dot: true,
        nodir: true
      },
      (err, items) => {
        if (err) {
          reject('Unable to load project files.');
          return;
        }

        resolve(items);
      }
    );
  });
}

export default async function load({ dir, isGenerator = false }) {
  const localDir = dir.substr(0, 1) === '~' ? `${homedir()}/${dir.substr(1)}` : dir;
  const zappDir = `${localDir}/.zapp`;
  const cwd = path.normalize(zappDir);

  console.log(cwd);

  let project = {};

  const items = await getItems(cwd);

  items.forEach((item) => {
    const itemPathParts = item.replace(/\.[a-z0-9]+$/i, '').split('/');
    const itemPath = path.normalize(`${cwd}/${item}`);
    const itemValue = fs.readFileSync(itemPath, 'utf8');

    if (itemPathParts[0] === 'exports' && itemPathParts[1] === 'templates') {
      project = _.set(project, itemPathParts, {
        template: itemValue
      });
    } else if (!(/\.ya?ml$/.test(item))) {
      project = _.set(project, itemPathParts, itemValue.replace(/\n$/, ''));
    } else {
      project = _.set(project, itemPathParts, yaml.safeLoad(itemValue));
    }
  });

  if (!project.imports || isGenerator) {
    return project;
  }

  const generatorPaths = [];

  Object.keys(project.imports).forEach((domain) => {
    const users = project.imports[domain];
    Object.keys(users).forEach((username) => {
      const repos = users[username];
      Object.keys(repos).forEach((repoName) => {
        const repo = repos[repoName];
        const repoPath = repo.path || `${homedir()}/.zapp/generators/${domain}/${username}/${repoName}/${repo.version}`;

        generatorPaths.push(repoPath);
      });
    });
  });

  console.log('Generator Paths:');
  console.log(generatorPaths);

  // const generators = [];
  // for (let i = 0; i < generatorPaths.length; i++) {
  //   const generator = await load({ dir: generatorPaths[i], isGenerator: true });
  //   console.log('generator:');
  //   console.log(generator);
  //   generators.push(generator);
  // }

  const generators = await Promise.all(
    generatorPaths.map((generatorPath) => {
      return load({ dir: generatorPath, isGenerator: true });
    })
  );

  // console.log('Generators:');
  // console.log(JSON.stringify(generators[0], null, 2));

  let zappData = {};
  generators.forEach((generator) => {
    console.log('adds generator:');
    console.log(generator.exports);
    zappData = merge(zappData, generator.exports);
  });
  zappData = merge(zappData, project);

  return zappData;
}
