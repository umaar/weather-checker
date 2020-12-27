function isWeatherFresh(lastUpdatedRaw: any) {
	const ONE_MINUTE = 1000 * 60;
	const ONE_HOUR = ONE_MINUTE * 60;
	const THREE_HOURS = ONE_HOUR * 3;
	const lastUpdated = new Date(lastUpdatedRaw);
	const currentTime = new Date();
	return (currentTime.getTime() - lastUpdated.getTime()) < THREE_HOURS;
}

export default isWeatherFresh;