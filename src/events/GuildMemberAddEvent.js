// https://discord.js.org/#/docs/main/stable/class/Client?scrollTo=e-guildMemberAdd
const BaseEvent = require('../utils/structures/BaseEvent');
const bpdasDataSource = require('../typeorm/BpdasDatasource');
const GuildConfiguration = require('../typeorm/entities/GuildConfiguration');
const guildConfigRepository = bpdasDataSource.getRepository(GuildConfiguration);

module.exports = class GuildMemberAddEvent extends BaseEvent {
  constructor() {
    super('guildMemberAdd');
  }
  
  async run(client, member) {
    const config = guildConfigRepository;

    console.log(`${member.user.username} has joined.`)

  }
}