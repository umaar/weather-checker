import fetch from 'node-fetch';
import {URLSearchParams} from 'url';
import config from 'config';

import timeFormatter from 'duration-relativetimeformat';

import express from 'express';
import weatherQueries from '../db/queries/weather.js';
import locationsQueries from '../db/queries/locationsQueries.js';
/* eslint-disable new-cap */
const router = express.Router();
/* eslint-enable new-cap */

const APIKey: string = config.get('ACCU_WEATHER_API_KEY');

const duration = timeFormatter('en');

async function fetchJSON({
	url,
	params
}: {
	url: string,
	params: {[index: string]: string}
}) {
	const queryString = new URLSearchParams({
		apikey: APIKey,
		...params
	});

	const baseURL = 'http://127.0.0.1:8080';
	const URLToFetch = `${baseURL}${url}?${queryString.toString()}`;
	console.log('Fetching:', URLToFetch);

	const response = await fetch(URLToFetch);
	return response.json();
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
		};
	});

	return locationsQueries.insertLocations(formattedResults);
}

async function fetchCurrentWeather(locationID: string) {
	return fetchJSON({
		url: '/current-conditions.json', // /currentconditions/v1/${locationKey}
		params: {
			details: String(true)
		}
	});
}

async function fetchAndSaveCurrentWeather(locationID: string) {
	const currentWeather = await fetchCurrentWeather(locationID);
	const latestForecast = await fetchLatestForecast(locationID);

	return weatherQueries.insertOrUpdateWeather({
		locationID,
		weather: currentWeather,
		forecast: latestForecast
	});
}

async function fetchLatestForecast(locationKey: string) {
	return fetchJSON({
		url: '/forecast-12-hours.json', // /forecasts/v1/hourly/12hour/${locationKey}
		params: {
			details: String(true),
			metric: String(true)
		}
	});
}

async function getLocationFromLatLon(query: string) {
	const result = await fetchJSON({
		url: '/location-based-on-lat-lon-v2.json', // /locations/v1/cities/geoposition/search
		params: {
			q: query,
			details: String(true)
		}
	});

	return locationsQueries.insertLocations([{
		name: result.LocalizedName,
		area: result.AdministrativeArea.LocalizedName,
		country: result.Country.LocalizedName,
		locationKey: result.Key
	}]);
}

router.get('/resolve-location', async (request, response) => {
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
		messages: request.flash('messages'),
		results
	};

	response.render('resolve-location', renderObject);
});

function isWeatherFresh(lastUpdatedRaw: any) {
	const ONE_MINUTE = 1000 * 60;
	const ONE_HOUR = ONE_MINUTE * 60;
	const THREE_HOURS = ONE_HOUR * 3;
	const lastUpdated = new Date(lastUpdatedRaw);
	const currentTime = new Date();
	return (currentTime.getTime() - lastUpdated.getTime()) < THREE_HOURS;
}

function removeQueryStringFromURL({
	request,
	queryStringParams: queryStringParameters
}: {
	request: express.Request,
	queryStringParams: string[]
}) {
	const requestURL = constructValidURLFromRequest(request);

	for (const queryStringParameter of queryStringParameters) {
		requestURL.searchParams.delete(queryStringParameter);
	}

	return requestURL.search;
}

function constructValidURLFromRequest(request: express.Request) {
	const baseURL = `${request.protocol}://${request.get('host')}`;
	const requestURL = new URL(request.url, baseURL);
	return requestURL;
}

type URLQueryStringParams = {
	[index: string]: string;
}

function addQueryStringToURL(
	{request, queryStringParams}:
	{
		request: express.Request;
		queryStringParams: URLQueryStringParams;
	}
) {
	const requestURL = constructValidURLFromRequest(request);
	for (const queryString of Object.entries(queryStringParams)) {
		requestURL.searchParams.set(...queryString);
	}

	return requestURL.search;
}

function generateFutureTimeOptions() {
	const currentTime = new Date();
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

		const label = new Intl.DateTimeFormat('default', {
			hour: 'numeric',
			minute: 'numeric'
		}).format(copiedTime);

		results.push({
			value: copiedTime.getTime(),
			label
		});
	}

	return results;
}

function findForecastedWeather({
	forecasts,
	selectedTime
}: {
	forecasts: [],
	selectedTime: number
}) {
	return forecasts.find(({time}) => {
		return selectedTime === Date.parse(time);
	});
}

const clothesIdentifiers = Object.freeze({
	"cap": "Cap",
	"shoe-covers": "Shoe covers",
	"winter-gloves": "Winter gloves" ,
	"jacket": "Jacket",
	"thick-long-sleeved-jersey": "Thick long sleeved jersey",
	"long-sleeve-base-layer": "Long sleeve base layer",
	"bib-tights": "Bib tights",
	"bib-shorts-leg-warmers": "Bib shorts + leg warmers",
	"thin-long-sleeved-jersey": "Thin long sleeved jersey",
	"mid-weight-gloves": "Mid weight gloves",
	"base-layer": "Base layer",
	"bib-shorts": "Bib shorts",
	"thin-gloves": "Thin gloves",
	"thick-short-sleeved-jersey": "Thick short sleeved jersey",
	"thin-short-sleeved-jersey": "Thin short sleeved jersey"
});

interface Temperatures {
	from: number;
	to: number;
}

interface ClothesTemperatureRange {
	temperatures: Temperatures;
	clothesIDs: Array<keyof typeof clothesIdentifiers>;
};

const clothesMapping: ClothesTemperatureRange[] = [{
	temperatures: {
		from: 19,
		to: Infinity
	},
	clothesIDs: [
		"bib-shorts",
		"thin-short-sleeved-jersey"
	]
}, {
	temperatures: {
		from: 17,
		to: 18
	},
	clothesIDs: [
		"bib-shorts",
		"thick-short-sleeved-jersey"
	]
}, {
	temperatures: {
		from: 15,
		to: 16
	},
	clothesIDs: [
		"bib-shorts",
		"thick-short-sleeved-jersey"
	]
}, {
	temperatures: {
		from: 13,
		to: 14
	},
	clothesIDs: [
		"bib-shorts",
		"thick-long-sleeved-jersey",
		"thin-gloves"
	]
}, {
	temperatures: {
		from: 10,
		to: 12
	},
	clothesIDs: [
		"bib-shorts",
		"base-layer",
		"thin-long-sleeved-jersey",
		"mid-weight-gloves"
	]
}, {
	temperatures: {
		from: 8,
		to: 9
	},
	clothesIDs: [
		"bib-shorts-leg-warmers",
		"base-layer",
		"thick-long-sleeved-jersey",
		"mid-weight-gloves"
	]
}, {
	temperatures: {
		from: 6,
		to: 7
	},
	clothesIDs: [
		"bib-tights",
		"long-sleeve-base-layer",
		"thick-long-sleeved-jersey",
		"winter-gloves"
	]
}, {
	temperatures: {
		from: 4,
		to: 5
	},
	clothesIDs: [
		"bib-tights",
		"long-sleeve-base-layer",
		"thick-long-sleeved-jersey",
		"winter-gloves",
		"cap"
	]
}, {
	temperatures: {
		from: 3,
		to: -Infinity
	},
	clothesIDs: [
		"bib-tights",
		"long-sleeve-base-layer",
		"thick-long-sleeved-jersey",
		"jacket",
		"winter-gloves",
		"shoe-covers",
		"cap"
	]
}];

function calculateClothes(currentTemperature: number) {
	currentTemperature = Math.round(currentTemperature);

	const rangeSelection = clothesMapping.find(({temperatures}) => {
		const isInRange =
			currentTemperature >= temperatures.from 
			&& currentTemperature <= temperatures.to;
		
		return isInRange;
	});
	
	return rangeSelection?.clothesIDs.map(clothesID => {
		return [clothesID, clothesIdentifiers[clothesID]]
	});
}

router.get('/', async (request, res) => {
	const locationID = request.query['location'] ? String(request.query['location']) : '';
	const locationInfo = await locationsQueries.getLocation(locationID);
	
	if (locationID) {
		if (!locationInfo) {
			const {origin} = constructValidURLFromRequest(request);
			console.log('redirecting to:', origin);
			return res.redirect(origin);
		}
	}

	const parsedSelectedTime = Number.parseInt(String(request.query['selected-time']), 10);
	const selectedTime = Number.isNaN(parsedSelectedTime) ? null : parsedSelectedTime;

	const currentTime = Date.now();

	if (selectedTime && currentTime >= new Date(selectedTime).getTime()) {
		const redirectURL = removeQueryStringFromURL({
			request,
			queryStringParams: ['selected-time']
		});
		console.log('redirecting to:', redirectURL);
		return res.redirect(redirectURL);
	}

	const forceReload = request.query['force-reload'];

	let weather;
	let weatherUpdatedAt;
	let fullWeatherInfo;

	if (locationID) {
		fullWeatherInfo = await weatherQueries.getWeatherForLocation(locationID);
		weatherUpdatedAt = fullWeatherInfo?.updatedAt;
		
		if (selectedTime) {
			weather = findForecastedWeather({
				forecasts: fullWeatherInfo?.forecast,
				selectedTime
			});
		} else {
			weather = fullWeatherInfo?.current;
		}
		
		const shouldUpdateCurrentWeather = forceReload || !weather || !isWeatherFresh(weatherUpdatedAt);

		if (shouldUpdateCurrentWeather) {
			console.log('Weather is stale, fetching new...');
			fullWeatherInfo = await fetchAndSaveCurrentWeather(String(locationID));
			weather = fullWeatherInfo?.current;
			weatherUpdatedAt = fullWeatherInfo?.updatedAt;

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

	type DataLastUpdated = {
		rawTime: number;
		friendlyTime: string;
	};

	const dataLastUpdated = {} as DataLastUpdated;

	if (weather) {
		const lastUpdatedAt = new Date(Date.parse(weatherUpdatedAt));

		dataLastUpdated.rawTime = weatherUpdatedAt;
		dataLastUpdated.friendlyTime = duration(lastUpdatedAt);

		forceWeatherUpdateLink = addQueryStringToURL({
			request,
			queryStringParams: {
				'force-reload': String(true)
			}
		});

		let rainInfoText = 'No rain for at least 60 min';
		let nextHourWeather;

		if (selectedTime) {
			const selectedForecastIndex = fullWeatherInfo?.forecast.findIndex(({time}) => {
				return time === weather.time;
			});

			nextHourWeather = fullWeatherInfo?.forecast[selectedForecastIndex + 1];
		} else {
			// weather = fullWeatherInfo?.current;
			const copiedTime = new Date();
			copiedTime.setHours(copiedTime.getHours() + 1);
			copiedTime.setMinutes(0);
			copiedTime.setSeconds(0);
			copiedTime.setMilliseconds(0);

			nextHourWeather = findForecastedWeather({
				forecasts: fullWeatherInfo?.forecast,
				selectedTime: copiedTime.getTime()
			});
		}

		if (weather.hasRain || nextHourWeather?.hasRain) {
			rainInfoText = 'Rain within 60 min';
		}

		weather.rainInfoText = rainInfoText;
	}

	const futureTimeOptions = generateFutureTimeOptions().map(timeOption => {
		const timeOptionURL = addQueryStringToURL({
			request,
			queryStringParams: {
				'selected-time': String(timeOption.value)
			}
		});

		return {
			...timeOption,
			url: timeOptionURL,
			selected: timeOption.value === selectedTime
		};
	});

	const nowTimeOption = {
		label: 'Now',
		value: 'now',
		url: removeQueryStringFromURL({
			request,
			queryStringParams: ['selected-time']
		}),
		selected: !selectedTime
	};

	const clothes = calculateClothes(weather?.temperature);
	
	const timeOptions = [nowTimeOption, ...futureTimeOptions];
	
	const renderObject = {
		messages: request.flash('messages'),
		isHome: true,
		weather,
		dataLastUpdated,
		forceWeatherUpdateLink,
		timeOptions,
		locationInfo,
		clothes
	};

	res.render('index', renderObject);
});

export default router;
