import Express from 'express';

import routes from '../routes/index.js';

function init(app: Express.Application) {
	app.use('/', routes);
}

export default init;
