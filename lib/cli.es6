#!/usr/bin/env node

import gulp from 'gulp';
import yargs from 'yargs';
import requiredir from 'require-dir';

requiredir('./', { recurse: true }); // Load gulp tasks

const checkCommands = (yarg, argv, required, sequence) => {
  if (argv._.length < required) {
    yarg.showHelp();
  } else {
    let seq = !sequence || sequence.length < 1 ? argv._ : sequence;
    seq.forEach((task, idx) => {
      if (!gulp.tasks[task]) {
        seq.splice(idx, 1);
        console.log(`Task \`${task}\` does not exist.`);
      }
    });
    gulp.task('exec', seq, _ => _);
    gulp.start('exec');
  }
};

let { argv } = yargs.fail((msg, err) => {
  if (err) { throw err; }
  console.log(msg);
  yargs.showHelp();
}).epilog('For more information on a command, enter $0 <command> --help')
  .usage('\nUsage: $0 <command> [options]')
  .demand(1)
  .example('$0 create [options]')
  .command('create', 'Create an Epub dir structure', (yargs) => {
    ({ argv } = yargs.fail((msg, err) => {
      if (err) { throw err; }
      console.log(msg);
      yargs.showHelp();
    })
    .usage('\nUsage: $0 create [options]')
    .alias('h', 'help')
    .help('help')
    .wrap(null));
    checkCommands(yargs, argv, 1);
  })
  .command('markit', 'Convert markdown to HTML', (yargs) => {
    ({ argv } = yargs.fail((msg, err) => {
      if (err) { throw err; }
      console.log(msg);
      yargs.showHelp();
    })
    .usage('\nUsage: $0 markit')
    .alias('h', 'help')
    .help('help')
    .wrap(null));
    checkCommands(yargs, argv, 1);
  })
  .command('serve', 'Start a development server', (yargs) => {
    ({ argv } = yargs.fail((msg, err) => {
      if (err) { throw err; }
      console.log(msg);
      yargs.showHelp();
    })
    .usage('\nUsage: $0 serve')
    .alias('h', 'help')
    .help('help')
    .wrap(null));
    checkCommands(yargs, argv, 1);
  })
  .command('sass', 'Compile the sass', (yargs) => {
    ({ argv } = yargs.fail((msg, err) => {
      if (err) { throw err; }
      console.log(msg);
      yargs.showHelp();
    })
    .usage('\nUsage: $0 sass')
    .alias('h', 'help')
    .help('help')
    .wrap(null));
    checkCommands(yargs, argv, 1);
  })
  .command('scripts', 'Compile the scripts', (yargs) => {
    ({ argv } = yargs.fail((msg, err) => {
      if (err) { throw err; }
      console.log(msg);
      yargs.showHelp();
    })
    .usage('\nUsage: $0 scripts')
    .alias('h', 'help')
    .help('help')
    .wrap(null));
    checkCommands(yargs, argv, 1);
  })
  .command('render', 'Render layouts', (yargs) => {
    ({ argv } = yargs.fail((msg, err) => {
      if (err) { throw err; }
      console.log(msg);
      yargs.showHelp();
    })
    .usage('\nUsage: $0 render')
    .alias('h', 'help')
    .help('help')
    .wrap(null));
    checkCommands(yargs, argv, 1);
  })
  .command('sass', 'Compile SCSS', (yargs) => {
    ({ argv } = yargs.fail((msg, err) => {
      if (err) { throw err; }
      console.log(msg);
      yargs.showHelp();
    })
    .usage('\nUsage: $0 sass')
    .alias('h', 'help')
    .help('help')
    .wrap(null));
    checkCommands(yargs, argv, 1);
  })
  .command('inject', 'Inject scripts and styles', (yargs) => {
    ({ argv } = yargs.fail((msg, err) => {
      if (err) { throw err; }
      console.log(msg);
      yargs.showHelp();
    })
    .usage('\nUsage: $0 inject')
    .alias('h', 'help')
    .help('help')
    .wrap(null));
    checkCommands(yargs, argv, 1);
  })
  .command('copy', 'Copy static assets to output dir', (yargs) => {
    ({ argv } = yargs.fail((msg, err) => {
      if (err) { throw err; }
      console.log(msg);
      yargs.showHelp();
    })
    .usage('\nUsage: $0 copy')
    .alias('h', 'help')
    .help('help')
    .wrap(null));
    checkCommands(yargs, argv, 1);
  })
  .command('opf', 'Generate the opf', (yargs) => {
    ({ argv } = yargs.fail((msg, err) => {
      if (err) { throw err; }
      console.log(msg);
      yargs.showHelp();
    })
    .usage('\nUsage: $0 opf')
    .alias('h', 'help')
    .help('help')
    .wrap(null));
    checkCommands(yargs, argv, 1);
  })
  .command('clean', 'Remove the _output dir', (yargs) => {
    ({ argv } = yargs.fail((msg, err) => {
      if (err) { throw err; }
      console.log(msg);
      yargs.showHelp();
    })
    .usage('\nUsage: $0 clean')
    .alias('h', 'help')
    .help('help')
    .wrap(null));
    checkCommands(yargs, argv, 1);
  })
  .command('build', 'Build the _output dir', (yargs) => {
    ({ argv } = yargs.fail((msg, err) => {
      if (err) { throw err; }
      console.log(msg);
      yargs.showHelp();
    })
    .usage('\nUsage: $0 build')
    .alias('h', 'help')
    .help('help')
    .wrap(null));
    checkCommands(yargs, argv, 1);
  })
  .command('site', 'Clone Gomez', (yargs) => {
    ({ argv } = yargs.fail((msg, err) => {
      if (err) { throw err; }
      console.log(msg);
      yargs.showHelp();
    })
    .usage('\nUsage: $0 site')
    .alias('h', 'help')
    .help('help')
    .wrap(null));
    checkCommands(yargs, argv, 1);
  });
