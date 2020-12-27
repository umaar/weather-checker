import weatherQueries from '../db/queries/weather-queries.js';

import {
	fetchCurrentWeather,
	fetchLatestForecast
} from './api.js';

async function fetchAndSaveCurrentWeather(locationID: string) {
	const currentWeather = await fetchCurrentWeather(locationID);
	const latestForecast = await fetchLatestForecast(locationID);

	return weatherQueries.insertOrUpdateWeather({
		locationID,
		weather: currentWeather,
		forecast: latestForecast
	});
}

export default fetchAndSaveCurrentWeather;