import path from 'path';
import express from 'express';
import fs from 'fs';

let manifest: any = {};

function getManifestFile() {
	const manifestPath = path.resolve(process.cwd(), 'dist/client/rev-manifest.json');
	const rawManifest = fs.readFileSync(manifestPath);
	return JSON.parse(rawManifest as any);
}

function revisionManifest(rootPath: string) {
	// TODO: In production, don't invoke getManifestFile() each time
	return function (request: express.Request, res: express.Response, next: express.NextFunction) {
		try {
			manifest = getManifestFile();
		} catch (error) {
			console.log('Error getting revision manifest:', error);
			manifest = {};
		}

		res.locals.rev = function (path: string) {
			return `${rootPath}/${(manifest[path] || path)}`;
		};

		next();
	};
}

export default revisionManifest;
