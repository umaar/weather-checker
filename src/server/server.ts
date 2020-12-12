import http from 'http';
import debug from 'debug';

import config from 'config';

import app from './app.js';

async function init() {
	debug('herman-express:server');

	const port = normalizePort(config.get('port'));
	app.set('port', port);

	const server = http.createServer(app);
	server.listen(port);
	server.on('error', onError);
	server.on('listening', onListening);

	function normalizePort(value: string) {
		const port = Number.parseInt(value, 10);
		if (isNaN(port)) {
			return value;
		}

		if (port >= 0) {
			return port;
		}

		return false;
	}

	function onError(error: any) {
		if (error.syscall !== 'listen') {
			throw error;
		}

		const bind = typeof port === 'string' ? 'Pipe ' + port : 'Port ' + port;
		switch (error.code) {
			case 'EACCES':
				console.error(bind + ' requires elevated privileges');
				process.exit(1);
				break;
			case 'EADDRINUSE':
				console.error(bind + ' is already in use');
				process.exit(1);
				break;
			default:
				throw error;
		}
	}

	function onListening() {
		const addr = server.address();

		if (!addr || typeof addr === 'string') {
			throw new Error('Unexpected Server.address() result');
		}

		const bind = typeof addr === 'string' ? 'pipe ' + addr : 'port ' + addr.port;
		debug('Listening on ' + bind);
		console.info(`${config.get('domain')} (${config.get('environment')})`);
	}
}

init().catch(error => {
	console.log(error, '\nExiting...\n\n');
	process.exit(1); // eslint-disable-line unicorn/no-process-exit
});
