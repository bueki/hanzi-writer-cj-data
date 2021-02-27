// Import here Polyfills if needed. Recommended core-js (npm i -D core-js)
// import "core-js/fn/array.find"
import * as fs from 'fs-extra';
import * as path from 'path';

// ...
import { median_util } from './utils/median_util';

interface JsonBean {
  strokes: string[];
  medians: number[][];
}

export function readDir(dir: string) {
  const dirPath = path.resolve(dir);
  console.log(dirPath);
  const invalidFile: string[] = [];
  fs.readdir(dirPath, function (err, files) {
    if (err) {
      return console.log('err' + err);
    }
    files.forEach((f) => {
      console.log('handle file :', f);
      fs.readFile(`${dirPath}/${f}`)
        .then((value) => {
          const strokes: string[] = [];
          const medians: number[][] = [];
          // console.log('file ', value.toString());
          const svgFile = new window.DOMParser().parseFromString(
            value.toString(),
            'image/svg+xml',
          );
          // console.log(svgFile);
          svgFile.querySelectorAll('path').forEach((k) => {
            if (k.getAttribute('id')) {
              const s = prettifyPath(k.getAttribute('d')!!);
              if ('' !== s) {
                strokes.push(s);
                try {
                  // console.log(s);
                  const m = median_util.findStrokeMedian(s);
                  // console.log('m', m);
                  medians.push(m);
                } catch (error) {
                  console.log('call findStrokeMedian err:', f);
                  invalidFile.push(f);
                  // throw error;
                }
              }
            }
          });
          // console.log('medians', medians);
          const jsonFile: JsonBean = { strokes, medians };
          fs.writeJSON(`./data/kana/${f.replace('.svg', '.json')}`, jsonFile);
        })
        .catch((reason) => {
          // console.log(reason);
        });
      console.log('invalid:', invalidFile);
    });
  });
}

export function prettifyPath(path: string): string {
  let str: string[] = [];
  path.split(' ').forEach((k) => {
    if (k.match('[MCQZ]')) {
      let tmp = '';
      for (let i = 0; i < k.length; i++) {
        if (k[i].match('[MCQZ]')) {
          '' !== tmp && str.push(tmp);
          str.push(k[i]);
          tmp = '';
        } else {
          tmp += k[i];
        }
      }
      '' !== tmp && str.push(tmp);
    } else {
      str.push(k);
    }
  });
  return str.join(' ');
}
