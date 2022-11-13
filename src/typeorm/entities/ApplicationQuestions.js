const { EntitySchema } = require('typeorm');

module.exports = new EntitySchema({
    name : "application_questions",
    target : "application_questions",
    columns : {
        id: {
            primary : true,
            type : "int",
            generated : true
        },
        question : {
            type : "text"
        },
        guild_id: {
            type: "varchar"
        },
    }
    
})