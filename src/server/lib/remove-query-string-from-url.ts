import express from 'express';

import constructValidURLFromRequest from './construct-valid-url-from-request.js';

function removeQueryStringFromURL({
	request,
	queryStringParams: queryStringParameters
}: {
	request: express.Request;
	queryStringParams: string[];
}) {
	const requestURL = constructValidURLFromRequest(request);

	for (const queryStringParameter of queryStringParameters) {
		requestURL.searchParams.delete(queryStringParameter);
	}

	return requestURL.search;
}

export default removeQueryStringFromURL;
