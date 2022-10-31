// https://discord.js.org/#/docs/main/stable/class/Client?scrollTo=e-guildCreate
const { Guild } = require('discord.js');
const GuildConfiguration = require('../typeorm/entities/GuildConfiguration');
const bpdasDataSource = require('../typeorm/BpdasDatasource');
const BaseEvent = require('../utils/structures/BaseEvent');
const guildConfigRepository = bpdasDataSource.getRepository(GuildConfiguration);

module.exports = class GuildCreateEvent extends BaseEvent {
  constructor() {
    super('guildCreate');
  }
  

  async run(client, guild) {
    // const config = await guildConfigRepository.findOne({
    //   guild_id: guild.id
    // });
    console.log(`Joined ${guild.name}`)
    console.log(config);
  }
}