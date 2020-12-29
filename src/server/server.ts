import http from 'http';
import debug from 'debug';

import config from 'config';

import app from './app.js';

function normalizePort(value: string) {
	const port = Number.parseInt(value, 10);
	if (Number.isNaN(port)) {
		return value;
	}

	if (port >= 0) {
		return port;
	}

	return false;
}

function onError(port: number | string) {
	return function (error: any) {
		if (error.syscall !== 'listen') {
			throw error;
		}

		const bind = typeof port === 'string' ? `Pipe ${port}` : `Port ${port}`;
		switch (error.code) {
			case 'EACCES':
				console.error(bind + ' requires elevated privileges');
				// eslint-disable-next-line unicorn/no-process-exit
				process.exit(1);
			case 'EADDRINUSE':
				console.error(bind + ' is already in use');
				// eslint-disable-next-line unicorn/no-process-exit
				process.exit(1);
			default:
				throw error;
		}
	};
}

function onListening(server: http.Server) {
	return function () {
		const addr = server.address();

		if (!addr || typeof addr === 'string') {
			throw new Error('Unexpected Server.address() result');
		}

		const bind = `port ${addr.port}`;
		debug(`Listening on ${bind}`);

		const domain: string = config.get('domain');
		const environment: string = config.get('environment');

		console.info(`${domain} (${environment})`);
	};
}

async function init() {
	debug('herman-express:server');

	const port = normalizePort(config.get('port'));

	if (Number.isInteger(port)) {
		app.set('port', port);

		const server = http.createServer(app);
		server.listen(port);
		server.on('error', onError(port as number));
		server.on('listening', onListening(server));
	}
}

init().catch(error => {
	console.log(error, '\nExiting...\n\n');
	process.exit(1); // eslint-disable-line unicorn/no-process-exit
});
