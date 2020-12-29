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

export default generateFutureTimeOptions;
