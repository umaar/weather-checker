import express from 'express';

async function resolveLocation(request: express.Request, response: express.Response) {
	if (request.body && request.body.message) {
		const message = request.body.message;
		console.log('Error Log: ', message);
	} else {
		console.log('Express log handler called, but without a message!');
	}

	response.sendStatus(200);
}

export default resolveLocation;
