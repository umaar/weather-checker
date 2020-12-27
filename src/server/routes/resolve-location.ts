import express from 'express';

import {
	searchForLocation,
	getLocationFromLatLon
} from '../lib/api.js';

async function resolveLocation(request: express.Request, response: express.Response) {
	const {
		query,
		'query-type': queryType
	} = request.query;

	if (!query || !queryType) {
		throw new Error('Noooo no valid form data');
	}

	let results = [];

	if (queryType === 'coordinates') {
		results = await getLocationFromLatLon(String(query));
	} else {
		// Regular search string like 'brighton'
		results = await searchForLocation(String(query));
	}

	const renderObject = {
		results
	};

	response.render('resolve-location', renderObject);
}

export default resolveLocation;