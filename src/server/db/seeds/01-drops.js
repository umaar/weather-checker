export function seed(knex) {
	return Promise.all([
		knex('weather').del()
	]);
}
