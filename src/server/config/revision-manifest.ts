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
	return function (request: express.Request, response: express.Response, next: express.NextFunction) {
		try {
			manifest = getManifestFile();
		} catch (error: unknown) {
			console.log('Error getting revision manifest:', error);
			manifest = {};
		}

		response.locals.rev = function (path: string) {
			const assetPath: string = (manifest[path] || path);
			return `${rootPath}/${assetPath}`;
		};

		next();
	};
}

export default revisionManifest;
