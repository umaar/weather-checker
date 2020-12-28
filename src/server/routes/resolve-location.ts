import express from 'express';

import {
	searchForLocation,
	getLocationFromLatLon
} from '../lib/api.js';

import getBaseURL from '../lib/get-base-url.js';

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

	results = results.map(result => {
		const locationURL = `${getBaseURL(request)}?location=${result.id}`;
		return {
			...result,
			url: locationURL
		}
	});

	const renderObject = {
		results
	};

	response.render('resolve-location', renderObject);
}

export default resolveLocation;