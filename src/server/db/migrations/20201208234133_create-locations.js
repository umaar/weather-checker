
export function up(knex) {
	return knex.schema.createTable('locations', table => {
		// IDs are exposed to the user, so prefer a...
		// ...custom rather than an auto-incrementing value
		table.string('id').primary().unique().notNullable();
		table.string('locationKey').unique().notNullable();

		table.string('name').notNullable();
		table.string('area').notNullable();
		table.string('country').notNullable();

		table.timestamp('updatedAt').defaultTo(knex.fn.now());
		table.timestamp('createdAt').defaultTo(knex.fn.now());
	});
}

export function down(knex) {
	return knex.schema.dropTable('locations');
}
