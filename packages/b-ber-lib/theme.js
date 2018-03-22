<<<<<<< HEAD
'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.setTheme = exports.theme = undefined;

var _regenerator = require('babel-runtime/regenerator');

var _regenerator2 = _interopRequireDefault(_regenerator);

var _asyncToGenerator2 = require('babel-runtime/helpers/asyncToGenerator');

var _asyncToGenerator3 = _interopRequireDefault(_asyncToGenerator2);

var _promise = require('babel-runtime/core-js/promise');

var _promise2 = _interopRequireDefault(_promise);

var _path = require('path');

var _path2 = _interopRequireDefault(_path);

var _fsExtra = require('fs-extra');

var _fsExtra2 = _interopRequireDefault(_fsExtra);

var _yargs = require('yargs');

var _yargs2 = _interopRequireDefault(_yargs);

var _bBerThemes = require('@canopycanopycanopy/b-ber-themes');

var _bBerThemes2 = _interopRequireDefault(_bBerThemes);

var _YamlAdaptor = require('./YamlAdaptor');

var _YamlAdaptor2 = _interopRequireDefault(_YamlAdaptor);

var _utils = require('./utils');

var _State = require('./State');

var _State2 = _interopRequireDefault(_State);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function getUserDefinedThemes() {
    return new _promise2.default(function (resolve) {
        var config = _State2.default.config;

        var cwd = process.cwd();

        var names = [];
        var userThemes = {};

        if (!{}.hasOwnProperty.call(config, 'themes_directory')) resolve({ names: names, themes: userThemes });

        _fsExtra2.default.readdirSync(_path2.default.join(cwd, config.themes_directory)).forEach(function (a) {
            var modulePath = _path2.default.resolve(cwd, config.themes_directory, a);

            if (!_fsExtra2.default.lstatSync(modulePath).isDirectory()) return;

            // `entryPoint` here is either a package.json file, or an index.js script that exports the theme object
            // theme object schema:
            //
            // {
            //      name: String        required
            //      entry: String       required
            //      fonts: Array        required
            //      images: Array       required
            //      npmPackage: Object  optional
            // }
            //
            var userModule = _fsExtra2.default.existsSync(_path2.default.join(modulePath, 'package.json')) ? require(_path2.default.join(modulePath)) : require(_path2.default.join(modulePath, 'index.js'));

            var moduleName = userModule.name;
            names.push(moduleName);
            userThemes[moduleName] = userModule;
        });

        resolve({ names: names, themes: userThemes });
    });
} /* eslint-disable global-require, import/no-dynamic-require */

var printThemeList = function printThemeList(themeList) {
    var currentTheme = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : '';
    return themeList.reduce(function (acc, curr) {
        var icon = currentTheme && currentTheme === curr ? '✔' : '-';
        return acc.concat('  ' + icon + ' ' + curr + '\n');
    }, '');
};

function setTheme(themeName, themeList, userThemes, cwd) {
    return new _promise2.default(function (resolve) {
        if (themeList.indexOf(themeName) < 0) {
            console.error('Could not find theme matching [' + themeName + '].');
            console.log('Select one from the list of available themes:');
            console.log(printThemeList(themeList));
            return;
        }

        var configPath = _path2.default.join(cwd, 'config.yml');
        var configObj = _YamlAdaptor2.default.load(configPath);
        var promises = [];

        // save the new theme name to the config.yml
        configObj.theme = themeName;

        // write the updated config file
        promises.push(new _promise2.default(function (resolve) {
            return _fsExtra2.default.writeFile(configPath, _YamlAdaptor2.default.dump(configObj), function (err) {
                if (err) throw err;
                console.log('Successfully set theme theme to [' + themeName + ']');
                return resolve();
            });
        }));

        // add a theme dir with the same name to the src dir, copy over
        // the `settings` file, and create an overrides file
        promises.push(new _promise2.default(function (resolve) {
            var themeObject = {}.hasOwnProperty.call(_bBerThemes2.default, themeName) ? _bBerThemes2.default[themeName] : userThemes.themes[themeName];

            var settingsFileName = '_settings.scss';
            var overridesFileName = '_overrides.scss';
            var settingsOutputPath = _path2.default.join(cwd, configObj.src || '_project', '_stylesheets', themeName);
            var settingsInputFile = _path2.default.join(_path2.default.dirname(themeObject.entry), settingsFileName);
            var settingsOutputFile = _path2.default.join(settingsOutputPath, settingsFileName);
            var overridesOutputFile = _path2.default.join(settingsOutputPath, overridesFileName);

            try {
                if (!_fsExtra2.default.existsSync(settingsOutputPath)) {
                    _fsExtra2.default.mkdirsSync(settingsOutputPath);
                }
            } catch (err) {
                console.error(err);
                process.exit(1);
            }

            try {
                if (_fsExtra2.default.existsSync(settingsOutputFile)) {
                    throw new Error('[' + settingsOutputFile + '] already exists');
                } else {
                    _fsExtra2.default.copySync(settingsInputFile, settingsOutputFile, {});
                    console.log('Created [' + settingsOutputFile + ']');
                }
                if (_fsExtra2.default.existsSync(overridesOutputFile)) {
                    throw new Error('[' + overridesOutputFile + '] already exists');
                } else {
                    _fsExtra2.default.writeFileSync(overridesOutputFile, '');
                }
            } catch (err) {
                if (/b-ber-lib/.test(err.message)) {
                    console.log(err.message);
                } else {
                    console.error(err);
                }
            }

            resolve();
        }));

        return _promise2.default.all(promises).then(resolve);
    });
}

var theme = function theme(_) {
    return new _promise2.default(function () {
        var _ref = (0, _asyncToGenerator3.default)( /*#__PURE__*/_regenerator2.default.mark(function _callee(resolve) {
            var cwd, config, themeList, userThemes, i, currentTheme, themeName;
            return _regenerator2.default.wrap(function _callee$(_context) {
                while (1) {
                    switch (_context.prev = _context.next) {
                        case 0:
                            cwd = process.cwd();
                            config = _State2.default.config;
                            themeList = [];


                            (0, _utils.forOf)(_bBerThemes2.default, function (a) {
                                return themeList.push(a);
                            });

                            // get user themes dir, if any, and merge with built-in b-ber themes
                            _context.next = 6;
                            return getUserDefinedThemes();

                        case 6:
                            userThemes = _context.sent;

                            for (i = 0; i < userThemes.names.length; i++) {
                                themeList.push(userThemes.names[i]);
                            }

                            currentTheme = config.theme || '';

                            if (!_yargs2.default.argv.list) {
                                _context.next = 14;
                                break;
                            }

                            console.log();
                            console.log('The following themes are available:');
                            console.log(printThemeList(themeList, currentTheme));
                            return _context.abrupt('return', resolve());

                        case 14:
                            if (!_yargs2.default.argv.set) {
                                _context.next = 17;
                                break;
                            }

                            themeName = _yargs2.default.argv.set;
                            return _context.abrupt('return', setTheme(themeName, themeList, userThemes, cwd).then(resolve));

                        case 17:
                            return _context.abrupt('return', resolve(_yargs2.default.showHelp()));

                        case 18:
                        case 'end':
                            return _context.stop();
                    }
                }
            }, _callee, undefined);
        }));

        return function (_x2) {
            return _ref.apply(this, arguments);
        };
    }());
};

exports.theme = theme;
exports.setTheme = setTheme;
||||||| parent of 832bbc7... Restructuring
=======
'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.setTheme = exports.theme = undefined;

var _regenerator = require('babel-runtime/regenerator');

var _regenerator2 = _interopRequireDefault(_regenerator);

var _asyncToGenerator2 = require('babel-runtime/helpers/asyncToGenerator');

var _asyncToGenerator3 = _interopRequireDefault(_asyncToGenerator2);

var _promise = require('babel-runtime/core-js/promise');

var _promise2 = _interopRequireDefault(_promise);

var _path = require('path');

var _path2 = _interopRequireDefault(_path);

var _fsExtra = require('fs-extra');

var _fsExtra2 = _interopRequireDefault(_fsExtra);

var _yargs = require('yargs');

var _yargs2 = _interopRequireDefault(_yargs);

var _bBerThemes = require('@canopycanopycanopy/b-ber-themes');

var _bBerThemes2 = _interopRequireDefault(_bBerThemes);

var _YamlAdaptor = require('./YamlAdaptor');

var _YamlAdaptor2 = _interopRequireDefault(_YamlAdaptor);

var _utils = require('./utils');

var _State = require('./State');

var _State2 = _interopRequireDefault(_State);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function getUserDefinedThemes() {
    return new _promise2.default(function (resolve) {
        var config = _State2.default.config;

        var cwd = process.cwd();

        var names = [];
        var userThemes = {};

        if (!{}.hasOwnProperty.call(config, 'themes_directory')) resolve({ names: names, themes: userThemes });

        _fsExtra2.default.readdirSync(_path2.default.join(cwd, config.themes_directory)).forEach(function (a) {
            var modulePath = _path2.default.resolve(cwd, config.themes_directory, a);

            if (!_fsExtra2.default.lstatSync(modulePath).isDirectory()) return;

            // `entryPoint` here is either a package.json file, or an index.js script that exports the theme object
            // theme object schema:
            //
            // {
            //      name: String        required
            //      entry: String       required
            //      fonts: Array        required
            //      images: Array       required
            //      npmPackage: Object  optional
            // }
            //
            var userModule = _fsExtra2.default.existsSync(_path2.default.join(modulePath, 'package.json')) ? require(_path2.default.join(modulePath)) : require(_path2.default.join(modulePath, 'index.js'));

            var moduleName = userModule.name;
            names.push(moduleName);
            userThemes[moduleName] = userModule;
        });

        resolve({ names: names, themes: userThemes });
    });
} /* eslint-disable global-require, import/no-dynamic-require */

var printThemeList = function printThemeList(themeList) {
    var currentTheme = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : '';
    return themeList.reduce(function (acc, curr) {
        var icon = currentTheme && currentTheme === curr ? '✔' : '-';
        return acc.concat('  ' + icon + ' ' + curr + '\n');
    }, '');
};

function setTheme(themeName, themeList, userThemes, cwd) {
    return new _promise2.default(function (resolve) {
        if (themeList.indexOf(themeName) < 0) {
            console.error('Could not find theme matching [' + themeName + '].');
            console.log('Select one from the list of available themes:');
            console.log(printThemeList(themeList));
            return;
        }

        var configPath = _path2.default.join(cwd, 'config.yml');
        var configObj = _YamlAdaptor2.default.load(configPath);
        var promises = [];

        // save the new theme name to the config.yml
        configObj.theme = themeName;

        // write the updated config file
        promises.push(new _promise2.default(function (resolve) {
            return _fsExtra2.default.writeFile(configPath, _YamlAdaptor2.default.dump(configObj), function (err) {
                if (err) throw err;
                console.log();
                console.log('Successfully set theme theme to [' + themeName + ']');
                console.log();
                return resolve();
            });
        }));

        // add a theme dir with the same name to the src dir, copy over
        // the `settings` file, and create an overrides file
        promises.push(new _promise2.default(function (resolve) {
            var themeObject = {}.hasOwnProperty.call(_bBerThemes2.default, themeName) ? _bBerThemes2.default[themeName] : userThemes.themes[themeName];

            var settingsFileName = '_settings.scss';
            var overridesFileName = '_overrides.scss';
            var settingsOutputPath = _path2.default.join(cwd, configObj.src || '_project', '_stylesheets', themeName);
            var settingsInputFile = _path2.default.join(_path2.default.dirname(themeObject.entry), settingsFileName);
            var settingsOutputFile = _path2.default.join(settingsOutputPath, settingsFileName);
            var overridesOutputFile = _path2.default.join(settingsOutputPath, overridesFileName);

            try {
                if (!_fsExtra2.default.existsSync(settingsOutputPath)) {
                    _fsExtra2.default.mkdirsSync(settingsOutputPath);
                }
            } catch (err) {
                console.error(err);
                process.exit(1);
            }

            try {
                if (_fsExtra2.default.existsSync(settingsOutputFile)) {
                    throw new Error('[' + settingsOutputFile + '] already exists');
                } else {
                    _fsExtra2.default.copySync(settingsInputFile, settingsOutputFile, {});
                    console.log('Created [' + settingsOutputFile + ']');
                }
                if (_fsExtra2.default.existsSync(overridesOutputFile)) {
                    throw new Error('[' + overridesOutputFile + '] already exists');
                } else {
                    _fsExtra2.default.writeFileSync(overridesOutputFile, '');
                }
            } catch (err) {
                if (/b-ber-lib/.test(err.message)) {
                    console.log(err.message);
                } else {
                    console.error(err);
                }
            }

            resolve();
        }));

        return _promise2.default.all(promises).then(resolve);
    });
}

var theme = function theme(_) {
    return new _promise2.default(function () {
        var _ref = (0, _asyncToGenerator3.default)( /*#__PURE__*/_regenerator2.default.mark(function _callee(resolve) {
            var cwd, config, themeList, userThemes, i, currentTheme, themeName;
            return _regenerator2.default.wrap(function _callee$(_context) {
                while (1) {
                    switch (_context.prev = _context.next) {
                        case 0:
                            cwd = process.cwd();
                            config = _State2.default.config;
                            themeList = [];


                            (0, _utils.forOf)(_bBerThemes2.default, function (a) {
                                return themeList.push(a);
                            });

                            // get user themes dir, if any, and merge with built-in b-ber themes
                            _context.next = 6;
                            return getUserDefinedThemes();

                        case 6:
                            userThemes = _context.sent;

                            for (i = 0; i < userThemes.names.length; i++) {
                                themeList.push(userThemes.names[i]);
                            }

                            currentTheme = config.theme || '';

                            if (!_yargs2.default.argv.list) {
                                _context.next = 14;
                                break;
                            }

                            console.log();
                            console.log('The following themes are available:');
                            console.log(printThemeList(themeList, currentTheme));
                            return _context.abrupt('return', resolve());

                        case 14:
                            if (!_yargs2.default.argv.set) {
                                _context.next = 17;
                                break;
                            }

                            themeName = _yargs2.default.argv.set;
                            return _context.abrupt('return', setTheme(themeName, themeList, userThemes, cwd).then(resolve));

                        case 17:
                            return _context.abrupt('return', resolve(_yargs2.default.showHelp()));

                        case 18:
                        case 'end':
                            return _context.stop();
                    }
                }
            }, _callee, undefined);
        }));

        return function (_x2) {
            return _ref.apply(this, arguments);
        };
    }());
};

exports.theme = theme;
exports.setTheme = setTheme;
>>>>>>> 832bbc7... Restructuring
