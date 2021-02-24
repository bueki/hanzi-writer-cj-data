// Import here Polyfills if needed. Recommended core-js (npm i -D core-js)
// import "core-js/fn/array.find"
import * as fs from 'fs-extra';
import * as path from 'path';

// ...
import { median_util } from './utils/median_util';

interface JsonBean {
  strokes: string[]
  medians: number[][]
}


export function readDir(dir: string) {
  console.log('----in-----')
  const dirPath = path.resolve(dir);
  console.log(dirPath);

  fs.readdir(dirPath, function (err, files) {
    if (err) {
      return console.log("err" + err);
    }
    files.forEach(f => {
      if (f !== 'a.h.svg') {
        return
      }
      console.log("handle file :", f);
      fs.readFile(`${dirPath}/${f}`).then(value => {
        console.log('file ', value.toString())
        const svgFile = new window.DOMParser().parseFromString(value.toString(), 'image/svg+xml')
        console.log(svgFile)
        svgFile.querySelectorAll('path').forEach(k => {
          if (k.getAttribute('id')) {
            console.log('d', k.getAttribute('d'))
          }
        })
        console.log('svg path', svgFile.querySelector('path'))
      })
    })
  })
}

export function strtifyPath(path: string) {
  let str:string[]=[]
  path.split(" ").forEach(k => {
    if (k.match('[MCQZ]')) {
      
    } else {
      str.push(k)
    }
  })
}