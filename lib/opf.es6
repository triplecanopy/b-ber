
import gulp from 'gulp';
import renderLayouts from 'layouts';
import templates from './templates';
import path from 'path';
import fs from 'fs';
import mkdirp from 'mkdirp';
import File from 'vinyl';
import rrdir from 'recursive-readdir';
import { topdir, cjoin } from './utils';

let manifest = done =>
  rrdir('./_output/OPS', (err, files) =>
    files.forEach((file, idx) => {
      files[idx] = {
        fullpath: file,
        toppath: topdir(file),
        name: path.basename(file)
      };
      if (idx === files.length - 1) {
        done(files);
      }
    })
  );

let stringify = (files, done) => {
  let strings = {
    manifest: [],
    spine: [],
    guide: []
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

let write = (str, done) =>
  fs.writeFile(path.join(
      __dirname,
      '../_output/OPS/',
      'content.opf'
    ), str, err => {
      if (err) { throw err; }
      done();
  });

let render = (strings, done) => {
  let opf = renderLayouts(new File({
    path: './.tmp',
    layout: 'opfPackage',
    contents: new Buffer([
      renderLayouts(new File({
        path: './.tmp',
        layout: 'opfManifest',
        contents: new Buffer(cjoin(strings.manifest))
      }), templates).contents.toString(),
      renderLayouts(new File({
        path: './.tmp',
        layout: 'opfSpine',
        contents: new Buffer(cjoin(strings.spine))
      }), templates).contents.toString(),
      renderLayouts(new File({
        path: './.tmp',
        layout: 'opfGuide',
        contents: new Buffer(cjoin(strings.guide))
      }), templates).contents.toString()
    ].join('\n'))
  }), templates).contents.toString();

  write(opf, done);
}

gulp.task('opf', done =>
  manifest(files => {
    let allfiles = [];
    files.forEach((file, idx) => {
      allfiles.push(file);
      if (idx == files.length - 1) {
        stringify(allfiles, strings => {
          render(strings, done);
        });
      }
    });
  })
);
