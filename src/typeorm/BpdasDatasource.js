const { DataSource } = require("typeorm");

module.exports = BpdasDataSource = new DataSource({
    type: 'mysql',
    //url: process.env.DB_HOST,
    host: process.env.DB_HOST,
    username: process.env.DB_USERNAME,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_DATABASE,
    port: process.env.DB_PORT,
    synchronize: true,
    entities: [
        require('./entities/GuildConfiguration'),
        require('./entities/ApplicationQuestions'),
        require('./entities/ApplicationLog'),
    ],
})

//export default BpdasDataSource;