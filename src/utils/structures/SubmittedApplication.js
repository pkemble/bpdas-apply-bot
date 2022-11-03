const ApplicationLog = require("../../typeorm/entities/ApplicationLog");

class SubmittedApplication  extends ApplicationLog {
    constructor(member, applicationQuestions, applicationDate) {
        this.member = member;
    }

    applicationQuestions = JSON.parse(applicationQuestions);
    applicationDate = applicationDate;
    formattedDate = new Date(applicationDate).toUTCString();

    retrievefromDb()
}