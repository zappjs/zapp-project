import * as glob from 'glob';

export default function getItems(dir): Promise<[string]> {
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
