import express from 'express';

function constructValidURLFromRequest(request: express.Request) {
	const baseURL = `${request.protocol}://${request.get('host')}`;
	const requestURL = new URL(request.url, baseURL);
	return requestURL;
}

export default constructValidURLFromRequest;