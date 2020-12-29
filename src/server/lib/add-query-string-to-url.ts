import express from 'express';
import constructValidURLFromRequest from './construct-valid-url-from-request.js';

type URLQueryStringParameters = Record<string, string>;

function addQueryStringToURL(
	{request, queryStringParams}:
	{
		request: express.Request;
		queryStringParams: URLQueryStringParameters;
	}
) {
	const requestURL = constructValidURLFromRequest(request);
	for (const queryString of Object.entries(queryStringParams)) {
		requestURL.searchParams.set(...queryString);
	}

	return requestURL;
}

export default addQueryStringToURL;
