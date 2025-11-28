exports.up = async function(knex) {
  await knex.schema.alterTable('users', function(table) {
    table.timestamp('password_changed_at', { useTz: true }).nullable();
  });
};

exports.down = async function(knex) {
  await knex.schema.alterTable('users', function(table) {
    table.dropColumn('password_changed_at');
  });
};
