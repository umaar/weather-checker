/* global window, document */

function getCurrentLocation() {
	return new Promise((resolve, reject) => {
		window.navigator.geolocation.getCurrentPosition(({coords}) => {
			resolve(coords);
		}, reject);
	});
}

function hello() {
	const form = document.querySelector('form');
	if (!form) {
		return;
	}

	form.querySelector('.form-search-options').hidden = true;

	const button = document.createElement('button');
	button.textContent = 'Use current location';
	form.append(button);

	button.addEventListener('click', async event => {
		event.preventDefault();
		button.disabled = true;
		button.textContent = 'Please wait';
		document.querySelector('#coordinates').click();
		try {
			const {latitude, longitude} = await getCurrentLocation();
			document.querySelector('#query').value = `${latitude},${longitude}`;
			form.querySelector('[type="submit"]').click();
		} catch (error) {
			console.log('Error getting location', error);
			button.disabled = false;
			button.textContent = 'Use current location';
		}
	});
}

export default hello;
