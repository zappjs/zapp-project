import * as _ from 'lodash'
import * as fs from 'fs';
import * as path from 'path';
import * as yaml from 'js-yaml';
import { homedir } from 'os';

import getItems from './getItems';
import loadImports from './loadImports';
import merge from './merge';

export default async function load({ dir, isGenerator = false }) {
  const localDir = dir.substr(0, 1) === '~' ? `${homedir()}/${dir.substr(1)}` : dir;
  const zappDir = `${localDir}/.zapp`;
  const cwd = path.normalize(zappDir);

  // console.log(cwd);

  let project: any = {};

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

  const imports = await loadImports({ imports: project.imports });

  let zappData = {};
  imports.forEach((generator) => {
    zappData = merge(zappData, generator);
  });
  zappData = merge(zappData, project);

  return zappData;
}
