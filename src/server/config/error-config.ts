import express from 'express';

function init(app: express.Application) {
	// Catch 404 and forward to error handler
	app.use((request, response) => {
		response.status(404).render('error', {
			message: 'Not found'
		});
	});

	interface SomeErrorObject {
		status?: number;
	}

	app.use((
		error: SomeErrorObject,
		request: express.Request,
		response: express.Response,
		next: express.NextFunction
	) => {
		console.log('Express error handler:', error);

		if (response.headersSent) {
			next(error);
			return;
		}

		response.status(500).render('error', {
			message: 'Something went wrong'
		});
	});
}

export default init;
