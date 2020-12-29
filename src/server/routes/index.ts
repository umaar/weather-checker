import express from 'express';
import homePage from './home-page.js';
import resolveLocation from './resolve-location.js';
/* eslint-disable new-cap */
const router = express.Router();
/* eslint-enable new-cap */

type AsyncFunction = (request: express.Request, response: express.Response, next?: express.NextFunction) => Promise<void>;

export function wrapHandler(asyncFunction: AsyncFunction) {
	const exceptionHandled = async (request: express.Request, response: express.Response, next?: express.NextFunction) => {
		try {
			return await asyncFunction(request, response, next);
		} catch (error: unknown) {
			return next!(error);
		}
	};

	return exceptionHandled;
}

router.get('/resolve-location', wrapHandler(resolveLocation));
router.get('/', wrapHandler(homePage));

export default router;
