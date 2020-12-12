import bcrypt from 'bcryptjs';

export async function seed(knex) {
	await knex('weather').insert({
		fill_me_in: 'abc',
		created_at: Number(new Date())
	});
}
