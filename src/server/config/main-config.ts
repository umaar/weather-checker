import path from 'path';
import cookieParser from 'cookie-parser';
import forceDomainModule from 'forcedomain';
import bodyParser from 'body-parser';
import nunjucks from 'nunjucks';
import config from 'config';

import express from 'express';
import revisionManifest from './revision-manifest.js';

function init(app: express.Application) {
	const viewFolders = [
		path.join(process.cwd(), 'dist', 'server', 'views')
	];

	app.disable('x-powered-by');

	const nunjucksEnvironment = nunjucks.configure(viewFolders, {
		express: app,
		autoescape: true,
		// TODO: Configure noCache based on development environments
		noCache: true
	});

	const isDevelopmentMode = config.get('environment') === 'development';
	const useLiveReload = isDevelopmentMode && config.get('shouldEnableDevelopmentLiveReloadScript');
	const analyticsTrackingCode: string = config.get('analyticsTrackingCode') ?? '';

	app.locals.config = {
		productName: config.get('productName'),
		shouldEnableDevelopmentLiveReloadScript: useLiveReload,
		analyticsTrackingCode: analyticsTrackingCode.length ? analyticsTrackingCode : undefined
	};

	app.set('view engine', 'html');

	// *** Middlewares *** //

	app.use(forceDomainModule.forceDomain({
		hostname: config.get('hostname'),
		protocol: 'https'
	}));

	app.use(revisionManifest());

	app.use(cookieParser());
	app.use(bodyParser.json());
	app.use(bodyParser.urlencoded({
		extended: false
	}));

	if (config.get('hideRobotsTxt')) {
		app.use((request, res, next) => {
			if (request.url === '/robots.txt') {
				return res.status(404).send('Not found');
			}

			next();
		});
	}

	app.use(express.static('dist/client', {
		maxAge: '1y'
	}));
}

export default init;
