import express from 'express';

function getBaseURL(request: express.Request) {
	const baseURL = `${request.protocol}://${request.get('host')}${request.baseUrl}`;
	return baseURL;
}

export default getBaseURL;
