exports.up = function(knex) {
  return knex.schema.alterTable('password_resets', function(table) {
    table.string('token_hash', 64).notNullable().after('token');
  });
};

exports.down = function(knex) {
  return knex.schema.alterTable('password_resets', function(table) {
    table.dropColumn('token_hash');
  });
};