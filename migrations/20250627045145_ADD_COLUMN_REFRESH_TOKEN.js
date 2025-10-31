/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = async function (knex) {
    await knex.schema.alterTable('users', function (table) {
        table.string('refresh_token').notNullable().comment('JWT refresh token');
    })

    await knex.schema.alterTable('users', function (table) {
        table.index('refresh_token', 'idx_users_refresh_token', {
            storageEngineIndexType: 'hash'
        })
    })

    await knex('users').whereNull('refresh_token').update({
        refresh_token: ''
    });

    await knex.schema.alterTable('users', function (table) {
        table.string('refresh_token', 255).notNullable().alter();
    });

};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = async function (knex) {
    await knex.schema.alterTable('users', function (table) {
        table.dropIndex('', 'idx_users_refresh_token');
    });


    await knex.schema.alterTable('users', function (table) {
        table.dropColumn('refresh_token')
    })

};
