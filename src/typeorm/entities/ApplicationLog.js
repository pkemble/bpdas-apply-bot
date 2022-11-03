const { EntitySchema } = require('typeorm');

module.exports = new EntitySchema({
    name: "application_logs",
    target: "application_logs",
    columns: {
        id: {
            primary: true,
            type: "int",
            generated: true
        },
        user_id: {
            type: "varchar",
        },
        application_text: {
            type: "varchar",
            length: "2048",
        },
        application_date: {
            type: "varchar",
        }
    }
})

class ApplicationLog {

}