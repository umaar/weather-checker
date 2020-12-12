import knex from 'knex';
// @ts-expect-error
import * as knexConfig from '../../../knexfile.mjs';

const DBConnection = knex(knexConfig);

export default DBConnection;
