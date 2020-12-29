interface Forecast {
	time: string;
}

function findForecastedWeather({
	forecasts,
	selectedTime
}: {
	forecasts: Forecast[];
	selectedTime: number;
}) {
	return forecasts.find(({time}) => {
		return selectedTime === Date.parse(time);
	});
}

export default findForecastedWeather;
