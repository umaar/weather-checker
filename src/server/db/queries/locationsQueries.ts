import knex from '../connection.js';
import {customAlphabet} from 'nanoid';

const nanoid = customAlphabet('abcdefghijklmnopqrstuvwxyz', 8);

interface Location {
	locationKey: string;
	name: string;
	area: string;
	country: string;
}

async function insertLocations(locations: Location[]) {
	const existingLocations = await knex.select('*').from('locations');

	const updatedLocations = [];

	for (const location of locations) {
		const matchingLocation = existingLocations.find(({locationKey}) => {
			return locationKey === location.locationKey;
		});

		if (matchingLocation) {
			await knex('locations')
				.where({
					locationKey: location.locationKey
				}).update({
					name: location.name,
					area: location.area,
					country: location.country,
					updatedAt: knex.raw('CURRENT_TIMESTAMP')
				});

				updatedLocations.push(matchingLocation);
		} else {
			const newLocation = {
				...location,
				id: nanoid()
			};
			await knex('locations').insert(newLocation)
			updatedLocations.push(newLocation);
		}
	}

	return updatedLocations
}

async function getLocation(locationID: string) {
	return knex('locations')
		.where({
			id: locationID
		})
		.first();
}

export default {
	insertLocations,
	getLocation
};
