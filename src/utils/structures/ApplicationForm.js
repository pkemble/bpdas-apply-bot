const BpdasDatasource = require("../../typeorm/BpdasDatasource");
const ApplicationLog = require("../../typeorm/entities/ApplicationLog");

module.exports = class ApplicationForm {
    constructor(applicantId) {
        this.applicantId = applicantId;
        this.date = Date.now();
        this.answers = [];
        this.readableApp = '';


        // constructor(member, applicationQuestions, applicationDate) {
        //     this.member = member;
        //     this.applicationQuestions = JSON.parse(applicationQuestions);
        //     this.applicationDate = applicationDate;
        //     this.formattedDate = new Date(applicationDate).toUTCString();
            
        // }
    }

    // set readableApp {
    //     if(this.answers.length > 0){
    //         this.answers.forEach(a => {
    //             finishedApplication += `**${a.question}:** \n${a.answer}\n\n`
    //             let que = a.question, ans = a.answer.content;
    //             applicationForm.addAnswer({ question: que, answer: ans });
    //             applicationForm.readableApp = finishedApplication;
    //           });
    //     }
    // }

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