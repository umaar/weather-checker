/* global window, document */
import log from './log.js';

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

		let location;

		try {
			location = await getCurrentLocation();
		} catch (error) {
			log(error.message || error);
			button.disabled = false;
			button.textContent = 'Use current location';
			document.querySelector('#location').click();
			return;
		}

		const {latitude, longitude} = location;
		document.querySelector('#query').value = `${latitude},${longitude}`;
		form.querySelector('[type="submit"]').click();
	});
}

export default hello;
