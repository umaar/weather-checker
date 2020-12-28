import Express from 'express';
import config from 'config';

import routes from '../routes/index.js';

const rootPath: string = config.get('rootPath');

function init(app: Express.Application) {
	app.use(rootPath, routes);
}

export default init;
