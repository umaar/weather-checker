import knex from '../connection.js';
// import locationsQueries from './locationsQueries.js';

function formatForecasts(forecasts: string) {
	const parsedForcasts = JSON.parse(forecasts);
	return parsedForcasts.map((forecast: any) => {
		return {
			...formatWeather(forecast),
			time: forecast.DateTime
		};
	});
}

function handleMetricUnit(data: any) {
	if (data.Metric) {
		return data.Metric.Unit;
	} else {
		return data.Unit;
	}
}

function handleMetricValue(data: any) {
	if (data.Metric) {
		return data.Metric.Value;
	} else {
		return data.Value;
	}
}

function handleWeather(rawCurrentWeather: string) {
	const [currentWeather] = JSON.parse(rawCurrentWeather);
	return formatWeather(currentWeather)
}

interface foo {
	[index: string]: any;
};

function formatWeather(weather: foo) {
	return {
		weatherIcon: weather.WeatherIcon,
		weatherText: weather.WeatherText || '-',
		windDirection: weather.Wind.Direction.English,
		windGust: handleMetricValue(weather.WindGust.Speed) + handleMetricUnit(weather.WindGust.Speed),
		windSpeed: handleMetricValue(weather.Wind.Speed) + handleMetricUnit(weather.Wind.Speed),
		temperature: handleMetricValue(weather.Temperature),
		realFeelTemperature: handleMetricValue(weather.RealFeelTemperature),
		hasRain: weather.HasPrecipitation
	};
}

async function getWeatherForLocation(locationID: string) {
	const result = await knex
		.select('*')
		.from('weather')
		.where('locationID', locationID)
		.first();

	if (result) {
		return {
			updatedAt: result.updatedAt,
			current: handleWeather(result.current),
			forecast: formatForecasts(result.forecast),
		}
	}
}

async function insertOrUpdateWeather({
	locationID,
	weather: rawWeather,
	forecast: rawForecast
}: {
	locationID: string;
	weather: object;
	forecast: object;
}) {
	const weather = JSON.stringify(rawWeather);
	const forecast = JSON.stringify(rawForecast);

	const currentWeather = await getWeatherForLocation(locationID);
	
	if (currentWeather) {
		await knex('weather')
			.where({
				locationID: locationID
			}).update({
				current: weather,
				forecast,
				updatedAt: knex.raw('CURRENT_TIMESTAMP')
			});
	} else {
		// .join() would be better, however knex + SQLite have some restrictions with .returning() which makes this much trickier
		// const location = await locationsQueries.getLocation(locationID);

		await knex('weather')
			.insert({
				locationID: locationID,
				current: weather,
				forecast
			});
	}

	return getWeatherForLocation(locationID);
}

export default {
	getWeatherForLocation,
	insertOrUpdateWeather: insertOrUpdateWeather
};
