import express from 'express';

import {
	searchForLocation,
	getLocationFromLatLon
} from '../lib/api.js';

import getBaseURL from '../lib/get-base-url.js';

async function resolveLocation(request: express.Request, response: express.Response) {
	let {
		query = '',
		'query-type': queryType
	} = request.query;

	query = String(query).trim();

	if (!query || !queryType) {
		throw new Error('Noooo no valid form data');
	}

	let results = [];

	if (queryType === 'coordinates') {
		results = await getLocationFromLatLon(query);
	} else {
		// Regular search string like 'brighton'
		results = await searchForLocation(query);
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