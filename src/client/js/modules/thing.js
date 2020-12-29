function getCurrentLocation() {
	return new Promise((resolve, reject) => {
		navigator.geolocation.getCurrentPosition(({coords}) => {
			resolve(coords);
		}, reject);
	});
}

function hello() {
	const form = document.querySelector('form');
	if (!form) return;

	const btn = document.createElement('button');
	btn.textContent = 'Use current location';
	form.appendChild(btn);

	btn.addEventListener('click', async evt => {
		evt.preventDefault();
		btn.disabled = true;
		btn.textContent = 'Please wait';
		document.querySelector('#coordinates').click();
		try {
			const {latitude, longitude} = await getCurrentLocation();
			document.querySelector('#query').value = `${latitude},${longitude}`;
			form.querySelector('[type="submit"]').click();
		} catch(error) {
			console.log('Error getting location', error)
			btn.disabled = false;
			btn.textContent = 'Use current location';
		}
	});
}

export default hello;
