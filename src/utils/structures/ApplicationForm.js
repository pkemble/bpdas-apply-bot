const { User } = require("discord.js");
const BpdasDatasource = require("../../typeorm/BpdasDatasource");
const ApplicationLog = require("../../typeorm/entities/ApplicationLog");

module.exports = class ApplicationForm {
    constructor(applicantId) {
        this.applicantId = applicantId;
        this.guildId = '';
        this.date = Date.now();
        this.answers = [];
        this.readableApp = '';
        this.result = 0; // 0 = default (not started), 1 = pending, 2 = accepted, 3 = denied, 4 = spa time
        this.forced = false;
    }

    addAnswer(qaObj) {
        this.answers.push(qaObj)
    }

    /**
     * Gets the application from the database
     * @param {User} user 
     */
    async getFromDatabase(user) {
        const appLogs = BpdasDatasource.getRepository(ApplicationLog);

        try {
            const dbApp = await appLogs.findOne({
                where: { user_id: user.id },
                order: { application_date: 'DESC' },
            })

            if (dbApp === null) {
                console.log(`No Application exists for ${user.username}.`)
                return this;
            } else {
                const qaArray = JSON.parse(dbApp.application_text);
                this.applicantId = dbApp.user_id;
                this.guildId = dbApp.guild_id;
                this.date = dbApp.application_date;
                this.answers = qaArray;
                this.result = dbApp.result;
                let readableApp = `${user.username} has submitted the following application: \n`;
                for (var qa in qaArray) {
                    readableApp += `**${qaArray[qa].question}:** \n${qaArray[qa].answer}\n\n`
                };
    
                this.readableApp = readableApp;
                console.log(`I found an application with the ID of ${dbApp.id} for user with ID: ${dbApp.user_id}`)
                return this;
            }
        } catch (err) {
            console.log(`** Problem retrieving application for user ${user.username} with id: ${user.id} **`)
        }
    }

    async saveToDatabase() {
        const dataSource = BpdasDatasource.getRepository(ApplicationLog);
        var application = await dataSource.findOneBy({ user_id: this.applicantId })

        try {
            if (!application) {
                application = {
                    user_id: this.applicantId,
                    guild_id: this.guildId,
                    application_date: this.date,
                    application_text: JSON.stringify(this.answers),
                    result: this.result,
                    forced: this.forced,
                }
                await dataSource.upsert(application, ['user_id']);
                console.log(`Application for ID ${this.applicantId} was upsert'd to the database.`)

            } else {
                application.application_text = JSON.stringify(this.answers);
                application.result = this.result;
                await dataSource.update(application.id, application);
                console.log(`Application for ID ${this.applicantId} was updated in the database.`)
            }

        } catch (error) {
            console.log(`****\nError saving application for ${this.applicantId}\n****\n${error}\n****`)
        }
    }
}