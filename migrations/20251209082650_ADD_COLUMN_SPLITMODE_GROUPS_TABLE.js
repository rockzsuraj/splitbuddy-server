/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = async function(knex) {
  return knex.schema.table('user_groups', function(table) {
    table.enum('split_mode', ['splitwise', 'tricount']).defaultTo('splitwise');
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = async function(knex) {
  return knex.schema.table('user_groups', function(table) {
    table.dropColumn('split_mode');
  });
}