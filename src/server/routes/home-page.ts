import express from 'express';
import timeFormatter from 'duration-relativetimeformat';
import locationsQueries from '../db/queries/locations-queries.js';
import weatherQueries from '../db/queries/weather-queries.js';
import constructValidURLFromRequest from '../lib/construct-valid-url-from-request.js';
import findForecastedWeather from '../lib/find-forecasted-weather.js';
import removeQueryStringFromURL from '../lib/remove-query-string-from-url.js';
import isWeatherFresh from '../lib/is-weather-fresh.js';
import fetchAndSaveCurrentWeather from '../lib/fetch-and-save-current-weather.js';
import addQueryStringToURL from '../lib/add-query-string-to-url.js';
import generateFutureTimeOptions from '../lib/generate-future-time-options.js';
import calculateClothes from '../lib/calculate-clothes.js';
import getBaseURL from '../lib/get-base-url.js';

const duration = timeFormatter('en');

async function homePage(request: express.Request, response: express.Response) {
	const locationID = request.query.location ? String(request.query.location) : '';
	const locationInfo = await locationsQueries.getLocation(locationID);

	if (locationID) {
		if (!locationInfo) {
			const redirectTo = getBaseURL(request);
			console.log('redirecting to:', redirectTo);
			return response.redirect(redirectTo);
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
		return response.redirect(redirectURL);
	}

	const forceReload = request.query['force-reload'];

	let weather: any;
	let weatherUpdatedAt;
	let fullWeatherInfo;
	let clothes;

	if (locationID) {
		fullWeatherInfo = await weatherQueries.getWeatherForLocation(locationID);
		weatherUpdatedAt = fullWeatherInfo?.updatedAt;

		weather = selectedTime ? findForecastedWeather({
			forecasts: fullWeatherInfo?.forecast,
			selectedTime
		}) : fullWeatherInfo?.current;

		const shouldUpdateCurrentWeather = forceReload || !weather || !(isWeatherFresh(weatherUpdatedAt));

		if (shouldUpdateCurrentWeather) {
			console.log('Weather is stale, fetching new...');

			fullWeatherInfo = await fetchAndSaveCurrentWeather({
				locationID: String(locationID),
				locationKey: locationInfo.locationKey
			});

			weather = fullWeatherInfo?.current;
			weatherUpdatedAt = fullWeatherInfo?.updatedAt;

			if (forceReload) {
				// Remove the force-reload query string from the URL
				// otherwise every page load will force a reload!
				const redirectURL = removeQueryStringFromURL({
					request,
					queryStringParams: ['force-reload']
				});

				return response.redirect(redirectURL);
			}
		}
	}

	let forceWeatherUpdateLink;

	type DataLastUpdated = {
		rawTime?: number;
		friendlyTime?: string;
	};

	const dataLastUpdated: DataLastUpdated = {};

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
			const selectedForecastIndex: number = fullWeatherInfo?.forecast.findIndex(({time}: {time: string}) => {
				return time === weather.time;
			});

			nextHourWeather = fullWeatherInfo?.forecast[selectedForecastIndex + 1];
		} else {
			// Weather = fullWeatherInfo?.current;
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

		clothes = calculateClothes(weather?.temperature);
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

	const locationSearchFormURL = `${getBaseURL(request)}/resolve-location`;

	const timeOptions = [nowTimeOption, ...futureTimeOptions];

	const renderObject = {
		isHome: true,
		weather,
		dataLastUpdated,
		forceWeatherUpdateLink,
		timeOptions,
		locationInfo,
		clothes,
		locationSearchFormURL
	};

	response.render('index', renderObject);
}

export default homePage;
