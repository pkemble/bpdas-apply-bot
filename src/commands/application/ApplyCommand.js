const BpdasDatasource = require('../../typeorm/BpdasDatasource');
const ApplicationQuestions = require('../../typeorm/entities/ApplicationQuestions');
const BaseCommand = require('../../utils/structures/BaseCommand');
const ApplicationForm = require('../../utils/structures/ApplicationForm');
const { submitApplication } = require('../../ApplicationWorkflow');
const answers = [];
const client = null;

module.exports = class ApplyCommand extends BaseCommand {
  constructor() {
    super('apply', 'application', []);
  }

  async run(client, message, args) {
    if (message.author.bot) return;
    this.client = client;
    //const guildConfig = client.getCurrentConfig(message.guildId);
    const guildConfig = client.configs.find(c => c.guild_id == message.guildId);
    const intro = guildConfig.introduction_text;
    const questionRepo = BpdasDataSource.getRepository(ApplicationQuestions);
    const guildApplicationQuestions = await questionRepo.find();
    client.applicationQuestions = guildApplicationQuestions;
    const questions = client.applicationQuestions; //redundant...
    const appDm = await client.users.cache.get(message.author.id).send(intro);

    await this.interrogate(0, questions, appDm, message)

  }

  async interrogate(i, questions, appDm, message) {
    const filter = m => m.author.id === message.author.id;
    const question = questions[i].question;
    await appDm.channel.send(question).then(async () => {
      await appDm.channel
        .awaitMessages({
          filter,
          max: 1,
          time: 60_000,
          errors: ['time']
        }).then((collected) => {
          // console.log(collected);
          answers.push({
            question: questions[i].question,
            answer: collected.first(),
          });
          if (i === questions.length - 1) {
            // console.log(`Answers: \n ${answers}`)
            //this.sendApplication(this.client, message, answers);
            submitApplication(this.client, message, answers);
            return;
          } else {
            i++;
            this.interrogate(i, questions, appDm, message)
          }
        }).catch((err) => {
          console.log(err);
        });
    });
  };

  // async sendApplication(client, message, answers) {
  //   const applicant = client.users.cache.get(message.author.id);
  //   const applicationForm = new ApplicationForm();
  //   applicationForm.applicantId = applicant.id;
  //   let finishedApplication = `${applicant} has submitted the following application: \n`;
  //   answers.forEach(a => {
  //     finishedApplication += `**${a.question}:** \n${a.answer}\n\n`
  //     let que = a.question, ans = a.answer.content;
  //     applicationForm.addAnswer({question: que, answer: ans });
  //   });
  //   applicationForm.saveToDatabase();
  //   const memberApplicationChannelId = client.configs.find(c => c.guild_id == message.guildId).welcome_channel_id;
  //   if (memberApplicationChannelId) {
  //     const memberApplicationChannel = client.channels.cache.get(memberApplicationChannelId);
  //     if (memberApplicationChannel) {
  //       memberApplicationChannel.send(finishedApplication);
  //     }
  //   }
  // }
}