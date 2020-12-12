
export function up(knex) {
	return knex.schema.createTable('weather', table => {
		table.increments();

		table.json('current').notNullable();
		table.json('forecast').notNullable();

		table
			.integer('locationID')
			.notNullable()
			.unique()
			.references('id')
			.inTable('locations')
			.onUpdate('CASCADE')
			.onDelete('CASCADE') // if referenced Location is deleted, delete this weather entry

		table.timestamp('updatedAt').defaultTo(knex.fn.now()).notNullable();
		table.timestamp('createdAt').defaultTo(knex.fn.now()).notNullable();
	});
}

export function down(knex) {
	return knex.schema.dropTable('weather');
}
