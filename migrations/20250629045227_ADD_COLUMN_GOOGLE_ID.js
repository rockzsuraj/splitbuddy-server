/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = async function (knex) {
    const hasColumn = await knex.schema.hasColumn('users', 'google_id');
    if (!hasColumn) {
        await knex.schema.alterTable('users', function (table) {
            table.string('google_id').nullable().unique();
        })
    }

    await knex.schema.alterTable('users', function (table) {
        table.index('google_id', 'idx_users_google_id')
    })
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = async function (knex) {
    await knex.schema.alterTable('users', function (table) {
        table.dropColumn('google_id');
    })

    await knew.schema.alterTable('users', function (table) {
        table.dropColumn('idx_users_google_id')
    })
};
