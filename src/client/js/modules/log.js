window.addEventListener('error', (message_, url, lineNo, columnNo, error) => {
	let message = '';
	if (typeof message_ !== 'string') {
		message_ = message_.message;
	}
	const string = message_.toLowerCase();
	const substring = 'script error';
	if (string.includes(substring)) {
		console.log('Script Error: See Browser Console for Detail');
		console.error(message_);
	} else {
		message = [
			'Message: ' + message_,
			'URL: ' + url,
			'Line: ' + lineNo,
			'Column: ' + columnNo,
			'Error object: ' + JSON.stringify(error)
		].join(' - ');

		try {
			log(message_);
		} catch (error_) {
			console.log('Couldn\'t log correctly', error_);
		}
	}
});

function log(message) {
	console.log(message);
	document.querySelector('#log').textContent += '\n' + message;
	fetch(`${window.location.href}/log`, {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json'
		},
		body: JSON.stringify({
			message
		})
	});
}

export default log;
