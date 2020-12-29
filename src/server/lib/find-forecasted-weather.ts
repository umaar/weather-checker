function findForecastedWeather({
	forecasts,
	selectedTime
}: {
	forecasts: [];
	selectedTime: number;
}) {
	return forecasts.find(({time}) => {
		return selectedTime === Date.parse(time);
	});
}

export default findForecastedWeather;
