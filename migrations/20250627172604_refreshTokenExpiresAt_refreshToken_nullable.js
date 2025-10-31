/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = async function (knex) {
    await knex.schema.alterTable('users', function (table) {
        table.string('refresh_token', 255).nullable().alter();
        table.timestamp('refreshTokenExpiresAt').nullable().alter();
    });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = async function (knex) {
    await knex.schema.alterTable('users', function (table) {
        table.string('refresh_token', 255).notNullable().alter();
        table.timestamp('refreshTokenExpiresAt').notNullable().alter();
    });
};