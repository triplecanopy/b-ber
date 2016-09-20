#!/usr/bin/env node

require('require-dir')('lib', { recurse: true });

import config from './.config';
import gulp from 'gulp';
import yargs from 'yargs';

let checkCommands = function (yarg, argv, required, sequence) {
  if (argv._.length < required) {
    yarg.showHelp();
  } else {
    sequence = !sequence || sequence.length < 1 ? sequence = argv._ : sequence;
    sequence.forEach(function (task, idx) {
      if (!gulp.tasks[task]) {
        sequence.splice(idx, 1);
        console.log(`Task \`${task}\` does not exist.`);
      }
    });
    gulp.task('exec', sequence, function() {
      console.log('Done!');
    });
    gulp.start('exec');
  }
};

let {
  argv
} = yargs.fail(function (msg, err) {
    console.log(msg);
    yargs.showHelp();
  }).epilog(`For more information on a command, enter $0 <command> --help`)
  .usage('\nUsage: $0 <command> [options]')
  .demand(1)
  .example('$0 create [options]')
  .command('create', 'Create an Epub dir structure', function (yargs) {
    ({
        argv
      } = yargs.fail(function (msg, err) {
        console.log(msg);
        yargs.showHelp();
      })
      .usage('\nUsage: $0 create [options]')
      .alias('h', 'help')
      .help('help')
      .wrap(null));
    checkCommands(yargs, argv, 1);
  })
  .command('markit', 'Convert markdown to HTML', function (yargs) {
    ({
        argv
      } = yargs.fail(function (msg, err) {
        console.log(msg);
        yargs.showHelp();
      })
      .usage('\nUsage: $0 markit')
      .alias('h', 'help')
      .help('help')
      .wrap(null));
    checkCommands(yargs, argv, 1);
  })
  .command('serve', 'Start a development server', function (yargs) {
    ({
        argv
      } = yargs.fail(function (msg, err) {
        console.log(msg);
        yargs.showHelp();
      })
      .usage('\nUsage: $0 serve')
      .alias('h', 'help')
      .help('help')
      .wrap(null));
    checkCommands(yargs, argv, 1);
  })
  .command('sass', 'Compile the sass', function (yargs) {
    ({
        argv
      } = yargs.fail(function (msg, err) {
        console.log(msg);
        yargs.showHelp();
      })
      .usage('\nUsage: $0 sass')
      .alias('h', 'help')
      .help('help')
      .wrap(null));
    checkCommands(yargs, argv, 1);
  })
  .command('scripts', 'Compile the scripts', function (yargs) {
    ({
        argv
      } = yargs.fail(function (msg, err) {
        console.log(msg);
        yargs.showHelp();
      })
      .usage('\nUsage: $0 scripts')
      .alias('h', 'help')
      .help('help')
      .wrap(null));
    checkCommands(yargs, argv, 1);
  })
  .command('render', 'Render layouts', function (yargs) {
    ({
        argv
      } = yargs.fail(function (msg, err) {
        console.log(msg);
        yargs.showHelp();
      })
      .usage('\nUsage: $0 render')
      .alias('h', 'help')
      .help('help')
      .wrap(null));
    checkCommands(yargs, argv, 1);
  });
