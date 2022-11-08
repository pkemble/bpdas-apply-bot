const { EntitySchema } = require('typeorm');

module.exports = new EntitySchema({
    name: "denial_reasons",
    target: "denial_reasons",
    columns: {
        id: {
            primary: true,
            type: "int",
            generated: true
        },
        reason_title: {
            type: "text"
        },
        reason_text: {
            type: "text"
        },
    }

})