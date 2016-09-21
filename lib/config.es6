
import YAML from 'yamljs';

const settings = YAML.load('./config.yml');
settings.dist = settings.output_path[settings.environment];

export default settings;
