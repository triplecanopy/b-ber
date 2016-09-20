
import gulp from 'gulp';
import renderLayouts from 'layouts';
import path from 'path';
import fs from 'fs';
import File from 'vinyl';
import rrdir from 'recursive-readdir';

import templates from './templates';
import { topdir, cjoin } from './utils';

const manifest = done =>
  rrdir('./_output/OPS', (err, files) => {
    let filearr = files;
    filearr.forEach((file, idx) => {
      filearr[idx] = {
        fullpath: file,
        toppath: topdir(file),
        name: path.basename(file),
      };
      if (idx === filearr.length - 1) {
        done(filearr);
      }
    });
  });

const stringify = (files, done) => {
  let strings = {
    manifest: [],
    spine: [],
    guide: [],
  };
  files.forEach((file, idx) => {
    strings.manifest.push(templates.item(file));
    strings.spine.push(templates.itemref(file));
    strings.guide.push(templates.reference(file));
    if (idx === files.length - 1) {
      done(strings);
    }
  });
};

const write = (str, done) =>
  fs.writeFile(path.join(
      __dirname,
      '../_output/OPS/',
      'content.opf'
    ), str, (err) => {
      if (err) { throw err; }
      done();
  });

const render = (strings, done) => {
  let opf = renderLayouts(new File({
    path: './.tmp',
    layout: 'opfPackage',
    contents: new Buffer([
      renderLayouts(new File({
        path: './.tmp',
        layout: 'opfManifest',
        contents: new Buffer(cjoin(strings.manifest)),
      }), templates).contents.toString(),
      renderLayouts(new File({
        path: './.tmp',
        layout: 'opfSpine',
        contents: new Buffer(cjoin(strings.spine)),
      }), templates).contents.toString(),
      renderLayouts(new File({
        path: './.tmp',
        layout: 'opfGuide',
        contents: new Buffer(cjoin(strings.guide)),
      }), templates).contents.toString(),
    ].join('\n')),
  }), templates).contents.toString();

  write(opf, done);
};

gulp.task('opf', done =>
  manifest((files) => {
    let allfiles = [];
    files.forEach((file, idx) => {
      allfiles.push(file);
      if (idx === files.length - 1) {
        stringify(allfiles, strings =>
          render(strings, done)
        );
      }
    });
  })
);
