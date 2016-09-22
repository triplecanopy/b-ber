
import YAML from 'yamljs';
import fs from 'fs';

const settings = (() => {
  let res;
  try {
    if (fs.statSync('./config.yml')) {
      res = YAML.load('./config.yml');
      res.dist = res.output_path[res.environment];
    }
  } catch (e) {
    res = { dist: '_book' };
  }
  return res;
})();

// settings.gomez = 'https://github.com/triplecanopy/b-ber-boiler/archive/master.zip';
settings.gomez = 'http://maxwellsimmer.com/b-ber-boiler3.zip';
// settings.gomez = 'http://maxwellsimmer.com/test.zip';

export default settings;
