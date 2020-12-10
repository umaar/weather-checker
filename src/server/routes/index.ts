import fetch from 'node-fetch';
import {URLSearchParams} from 'url';
import config from 'config';

import timeFormatter from 'duration-relativetimeformat';

import express, { response } from 'express';
import currentWeatherQueries from '../db/queries/currentWeather.js';
import locationsQueries from '../db/queries/locationsQueries.js';
// import currentWeather from '../db/queries/currentWeather.js';
/* eslint-disable new-cap */
const router = express.Router();
/* eslint-enable new-cap */

const APIKey = config.get('ACCU_WEATHER_API_KEY');

const duration = timeFormatter('en', {
	numeric: 'auto', // those are the default options
	localeMatcher: 'best fit',
	style: 'long'
});

async function fetchJSON(data: any) {
	const queryString = new URLSearchParams({
		apikey: APIKey,
		...data.params
	});

	const baseURL = `http://127.0.0.1:8080`;
	const URLToFetch = `${baseURL}${data.url}?${queryString}`
	console.log('Fetching: ', URLToFetch);
	
	const response = await fetch(URLToFetch);
	const json = await response.json();
	
	return json;
}

async function searchForLocation(query: string) {
	const results = await fetchJSON({
		url: '/autocomplete-bright.json', // /locations/v1/cities/autocomplete
		params: {
			q: query
		}
	});

	const formattedResults = results.map((result: any) => {
		return {
			name: result.LocalizedName,
			area: result.AdministrativeArea.LocalizedName,
			country: result.Country.LocalizedName,
			locationKey: result.Key
		}
	});

	await locationsQueries.insertLocations(formattedResults);

	return results;
}

async function fetchCurrentWeather(locationKey: string) {
	return await fetchJSON({
		url: '/current-conditions.json', // /currentconditions/v1/${locationKey}
		params: {
			details: true
		}
	});
}

async function get12HourForecastForLocationKey(locationKey: string) {
	return fetchJSON({
		url: '/forecast-12-hours.json', // /forecasts/v1/hourly/12hour/${locationKey}
		params: {
			details: true,
			metric: true
		}
	});
}

async function getLocationFromLatLon(query: string) {
	const result = await fetchJSON({
		url: '/location-based-on-lat-lon-v2.json', // /locations/v1/cities/geoposition/search
		params: {
			q: query,
			details: true
		}
	});

	const locations = await locationsQueries.insertLocations([{
		name: result.LocalizedName,
		area: result.AdministrativeArea.LocalizedName,
		country: result.Country.LocalizedName,
		locationKey: result.Key
	}]);

	return result;
}

function extractLocationMetadata(location: any) {
	return {
		key: location.Key,
		name: location.LocalizedName,
		country: location.Country.LocalizedName,
		area: location.AdministrativeArea.LocalizedName,
		type: location.Type
	};
}


router.get('/resolve-location', async (request, res) => {
	const {
		query,
		'query-type': queryType
	} = request.query

	if (!query || !queryType) {
		throw new Error('Noooo no valid form data');
	}

	let results = [];

	if (queryType === 'coordinates') {
		const response = await getLocationFromLatLon(String(query));
		results = [extractLocationMetadata(response)];
	} else {
		// regular search string like 'brighton'
		const response = await searchForLocation(String(query));
		results = response.map(extractLocationMetadata);
	}
	
	const renderObject = {
		messages: request.flash('messages'),
		results
	};

	res.render('resolve-location', renderObject);
});

function isWeatherFresh(lastUpdatedRaw: any) {
	const ONE_MINUTE = 1000 * 60;
	const ONE_HOUR = ONE_MINUTE * 60;
	const lastUpdated = new Date(lastUpdatedRaw);
	const currentTime = new Date();
	const isFresh = (currentTime.getTime() - lastUpdated.getTime()) < ONE_HOUR;
	return isFresh;
}

function removeQueryStringFromURL({request, queryStringParams = []}) {
	const requestURL = constructValidURLFromRequest(request);
	for (const queryStringParam of queryStringParams) {
		requestURL.searchParams.delete(queryStringParam);
	}

	return requestURL.search;
}

function constructValidURLFromRequest(request) {
	const baseURL = `${request.protocol}://${request.get('host')}`;
	const requestURL = new URL(request.url, baseURL);
	return requestURL;
}

function addQueryStringToURL({request, queryStringParams}) {
	const requestURL = constructValidURLFromRequest(request);
	for (const queryString of Object.entries(queryStringParams)) {
		requestURL.searchParams.set(...queryString);
	}

	return requestURL.search;
}

function generateTimeOptions(currentTime) {
	const results = [];
	// Even they offer a 12 hour forecast, we only display...
	// ...11 hours since the 11th hour must display a...
	// ...no rain for at least 60 mins style message
	const maxHours = 11;

	for (let index = 1; index <= maxHours; index++) {
		const copiedTime = new Date(currentTime.getTime());
		copiedTime.setHours(copiedTime.getHours() + index);
		copiedTime.setMinutes(0);
		copiedTime.setSeconds(0);
		copiedTime.setMilliseconds(0);

		const paddedHours = String(copiedTime.getHours()).padStart(2, '0');
		const paddedMinutes = String(copiedTime.getMinutes()).padStart(2, '0');
		const label = `${paddedHours}:${paddedMinutes}`;

		results.push({
			value: copiedTime.getTime(),
			label
		});
	}

	return results;
}

function normaliseTime(time = 'now') {
	time = time || 'now';

	if (time === 'now') {
		return 'now';
	}

	const currentTime = Date.now();

	if (currentTime >= new Date(Number.parseInt(time, 10)).getTime()) {
		console.log('Old time provided, defaulting to `now`');
		return 'now';
	}

	return time;
}

router.get('/', async (request, res) => {
	const locationKey = request.query['location-key'] ? String(request.query['location-key']) : undefined;

	const isSelectedTimeDefined = Object.prototype.hasOwnProperty.call(request.query, 'selected-time');

	let selectedTime = normaliseTime(request.query['selected-time']);

	if (isSelectedTimeDefined) {
		if (request.query['selected-time'] !== selectedTime) {
			// Mismatch in the query string, so reset to be same
			const redirectURL = removeQueryStringFromURL({
				request,
				queryStringParams: ['selected-time']
			});
			console.log('redirecting to:', redirectURL);
			return res.redirect(redirectURL);
		}
	}

	const forceReload = request.query['force-reload'];

	let currentWeather;
	if (locationKey) {
		currentWeather = await currentWeatherQueries.getCurrentWeather(locationKey);
		const shouldUpdateCurrentWeather = forceReload || !currentWeather || !isWeatherFresh(currentWeather.updatedAt);

		if (shouldUpdateCurrentWeather) {
			console.log('Weather is stale, fetching new...');
			// const forecast = await get12HourForecastForLocationKey(String(locationKey));
			const currentWeatherRaw = await fetchCurrentWeather(String(locationKey));
			
			currentWeather = await currentWeatherQueries.insertOrUpdateCurrentWeather({
				locationKey,
				weather: currentWeatherRaw
			});

			if (forceReload) {
				// Remove the force-reload query string from the URL
				// otherwise every page load will force a reload!

				const redirectURL = removeQueryStringFromURL({
					request,
					queryStringParams: ['force-reload']
				});

				return res.redirect(redirectURL);
			}
		}
	}

	let forceWeatherUpdateLink;

	let dataLastUpdated = {};

	if (currentWeather) {
		dataLastUpdated.rawTime = currentWeather.updatedAt;
		const lastUpdatedAt = new Date(currentWeather.updatedAt);
		dataLastUpdated.friendlyTime = duration(lastUpdatedAt);

		forceWeatherUpdateLink = addQueryStringToURL({
			request,
			queryStringParams: {
				'force-reload': true
			}
		});
	}

	const timeOptions = [{
		label: 'Now',
		value: 'now'
	}, ...generateTimeOptions(new Date())].map(timeOption => {
		const timeOptionURL = addQueryStringToURL({
			request,
			queryStringParams: {
				'selected-time': timeOption.value
			}
		});

		return {
			url: timeOptionURL,
			...timeOption
		};
	}).map(timeOption => {
		if (selectedTime !== 'now') {
			selectedTime = Number.parseInt(selectedTime, 10);
		}

		if (timeOption.value === selectedTime) {
			timeOption.selected = true;
		}

		return timeOption;
	});

	const renderObject = {
		messages: request.flash('messages'),
		isHome: true,
		currentWeather,
		dataLastUpdated,
		forceWeatherUpdateLink,
		timeOptions
	};

	res.render('index', renderObject);
});

export default router;
