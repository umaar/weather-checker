window.onerror = function(msg, url, lineNo, columnNo, error) {
	let message = '';
	const string = msg.toLowerCase();
	const substring = "script error";
	if (string.indexOf(substring) > -1){
		console.log('Script Error: See Browser Console for Detail');
		console.error(msg);
	} else {
		message = [
			'Message: ' + msg,
			'URL: ' + url,
			'Line: ' + lineNo,
			'Column: ' + columnNo,
			'Error object: ' + JSON.stringify(error)
		].join(' - ');
		
		try {
			log(msg);
		} catch (err) {
			console.log(`Couldn't log correctly`, err);
		}
		
		console.error(msg)
	}
};

function log(message) {
	console.log(message);
	document.querySelector('#log').textContent += '\n' + message;
	fetch(`${window.location.href}/log`, {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json',
		},
		body: JSON.stringify({
			message
		}),
	});
}

export default log;