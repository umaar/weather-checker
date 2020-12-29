import express from 'express';

function getBaseURL(request: express.Request) {
	const protocol = request.protocol;
	const host = request.get('host') as string;
	const base = request.baseUrl;

	return `${protocol}://${host}${base}`;
}

export default getBaseURL;
