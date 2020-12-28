import weatherQueries from '../db/queries/weather-queries.js';

import {
	fetchCurrentWeather,
	fetchLatestForecast
} from './api.js';

async function fetchAndSaveCurrentWeather({
	locationID,
	locationKey
}: {
	locationID: string;
	locationKey: string;
}) {
	const currentWeather = await fetchCurrentWeather(locationKey);
	const latestForecast = await fetchLatestForecast(locationKey);

	return weatherQueries.insertOrUpdateWeather({
		locationID,
		weather: currentWeather,
		forecast: latestForecast
	});
}

export default fetchAndSaveCurrentWeather;