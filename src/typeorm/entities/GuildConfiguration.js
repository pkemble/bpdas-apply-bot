const { EntitySchema } = require('typeorm');

module.exports = new EntitySchema({
    name: "server_configuration",
    target: "server_configuration",
    columns: {
        id: {
            primary: true,
            type: "int",
            generated: true
        },
        prefix: {
            type: "varchar",
            default: "/apply",
        },
        welcome_channel_id:  {
            type: "varchar",
        },
        application_log_channel_id: {
            type: "varchar",
        },
        spa_channel_category: {
            type: "varchar",
        },
        newb_role_id: {
            type: "varchar",
        },
        accepted_role_id: {
            //profile-setup
            type: "varchar",
        },
        guild_id: {
            type: "varchar",
        },
        introduction_text: {
            type: "text",
        },
        application_outro: {
            type: "text",
        },
        spa_intro: {
            type: "text",
        },
    }
})