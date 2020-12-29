import express from 'express';

import {
	searchForLocation,
	getLocationFromLatLon
} from '../lib/api.js';

import getBaseURL from '../lib/get-base-url.js';

interface Result {
	id: string;
}

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

	results = await (queryType === 'coordinates' ? getLocationFromLatLon(query) : searchForLocation(query));

	results = results.map((result: Result) => {
		const locationURL = `${getBaseURL(request)}?location=${result.id}`;
		return {
			...result,
			url: locationURL
		};
	});

	const renderObject = {
		results
	};

	response.render('resolve-location', renderObject);
}

export default resolveLocation;
