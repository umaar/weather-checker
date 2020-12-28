import express from 'express';
import getBaseURL from './get-base-url.js';

function constructValidURLFromRequest(request: express.Request) {
	const baseURL = getBaseURL(request);
	return new URL(request.originalUrl, baseURL);
}

export default constructValidURLFromRequest;