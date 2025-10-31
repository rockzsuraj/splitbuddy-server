/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = async function(knex) {
    await knex.schema.alterTable('users', function(table) {
        table.renameColumn('refreshTokenExpiresAt', 'refresh_token_expires_at');
    })
  
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = async function(knex) {
    await knex.schema.alterTable('users', function(table){
        table.renameColumn('refresh_token_expires_at', 'refreshTokenExpiresAt');
    })
  
};
