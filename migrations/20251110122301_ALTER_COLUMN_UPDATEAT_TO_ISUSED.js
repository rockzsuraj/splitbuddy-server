exports.up = async function(knex) {
  await knex.schema.alterTable('password_resets', function(table) {
    table.dropColumn('updated_at');
    table.boolean('is_used').notNullable().defaultTo(false).after('created_at');
  });
};

exports.down = async function(knex) {
  await  knex.schema.alterTable('password_resets', function(table) {
    table.dropColumn('is_used');
    table.timestamp('update_at').defaultTo(knex.fn.now());
  });
};