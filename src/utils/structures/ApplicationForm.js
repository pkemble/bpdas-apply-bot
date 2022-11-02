const BpdasDatasource = require("../../typeorm/BpdasDatasource");
const ApplicationLog = require("../../typeorm/entities/ApplicationLog");

module.exports = class ApplicationForm {
    constructor(applicantId) {
        this.applicantId = applicantId;
        this.date = Date.now();
        this.answers = [];
        this.readableApp = '';
    }

    addAnswer(qaObj) {
        this.answers.push(qaObj)
    }

    async saveToDatabase() {
        try {
            const dataSource = BpdasDatasource.getRepository(ApplicationLog);
            await dataSource.createQueryBuilder()
                .insert()
                .into(ApplicationLog)
                .values([
                    {
                        user_id: this.applicantId,
                        application_text: JSON.stringify(this.answers),
                        application_date: this.date,
                    }
                ]).execute();
        } catch (error) {
            console.log(error);
            return;
        }
        console.log(`Saved ${this.applicantId}'s application` );
    }
}