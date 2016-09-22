
import YAML from 'yamljs';

const settings = YAML.load('./config.yml');
settings.dist = settings.output_path[settings.environment];
// settings.gomez = 'https://github.com/triplecanopy/b-ber-boiler/archive/master.zip';
settings.gomez = 'http://maxwellsimmer.com/foo.zip';

export default settings;
