import express from 'express';
import constructValidURLFromRequest from './construct-valid-url-from-request.js'

type URLQueryStringParams = {
	[index: string]: string;
}

function addQueryStringToURL(
	{request, queryStringParams}:
	{
		request: express.Request;
		queryStringParams: URLQueryStringParams;
	}
) {
	const requestURL = constructValidURLFromRequest(request);
	for (const queryString of Object.entries(queryStringParams)) {
		requestURL.searchParams.set(...queryString);
	}

	return requestURL;
}

export default addQueryStringToURL;