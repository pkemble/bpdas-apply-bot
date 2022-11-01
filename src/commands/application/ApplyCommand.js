const BpdasDatasource = require('../../typeorm/BpdasDatasource');
const ApplicationQuestions = require('../../typeorm/entities/ApplicationQuestions');
const BaseCommand = require('../../utils/structures/BaseCommand');
const ApplicationForm = require('../../utils/structures/ApplicationForm');
const { submitApplication } = require('../../ApplicationWorkflow');
const client = null;
let answers = [];

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
    const applicationOutro = guildConfig.application_outro;
    const questionRepo = BpdasDataSource.getRepository(ApplicationQuestions);
    const guildApplicationQuestions = await questionRepo.find();
    client.applicationQuestions = guildApplicationQuestions;
    const questions = client.applicationQuestions; //redundant...
    const appDm = await client.users.cache.get(message.author.id).send(intro);

    await this.interrogate(0, questions, appDm, message, applicationOutro)

  }

  async interrogate(i, questions, appDm, message, applicationOutro) {
    const filter = m => m.author.id === message.author.id;
    const question = questions[i].question;

    await appDm.channel.send(question).then(async () => {
      await appDm.channel
        .awaitMessages({
          filter,
          max: 1,
          time: 60_000 * 60 * 24,
          errors: ['application timed out']
        }).then((collected) => {
          answers.push({
            question: questions[i].question,
            answer: collected.first(),
          });
          if (i === questions.length - 1) {
            appDm.channel.send(applicationOutro);
            submitApplication(this.client, message, answers);
            answers = [] //for some reason these are persisting. maybe collector related.
            return;
          } else {
            i++;
            this.interrogate(i, questions, appDm, message, applicationOutro)
          }
        }).catch((err) => {
          console.log(err);
        });
    });
  };
}