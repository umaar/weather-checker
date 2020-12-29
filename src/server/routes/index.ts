import express from 'express';
import homePage from './home-page.js';
import resolveLocation from './resolve-location.js';
/* eslint-disable new-cap */
const router = express.Router();
/* eslint-enable new-cap */

export function wrapHandler(asyncFunction: Function) {
	const exceptionHandled = async (request: express.Request, res: express.Response, next?: express.NextFunction) => {
	  try {
			return await asyncFunction(request, res, next);
	  } catch (error) {
			return next!(error);
	  }
	};

	return exceptionHandled;
}

router.get('/resolve-location', wrapHandler(resolveLocation));
router.get('/', wrapHandler(homePage));

export default router;
