
require('dotenv').config();
//import 'reflect-metadata';
const { Client, GatewayIntentBits, InteractionCollector } = require('discord.js');
const { registerCommands, registerEvents } = require('./utils/registry');
const BpdasDataSource = require('./typeorm/BpdasDatasource');
const GuildConfiguration = require('./typeorm/entities/GuildConfiguration');
const { default: DiscordClient } = require('../client/client');
const ApplicationQuestions = require('./typeorm/entities/ApplicationQuestions');
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.DirectMessages,
    GatewayIntentBits.DirectMessageTyping,
  ]
});

(async () => {
  client.commands = new Map();
  client.events = new Map();
  await client.login(process.env.DJS_TOKEN);

  await BpdasDataSource.initialize();
  await registerCommands(client, '../commands');
  await registerEvents(client, '../events');

  const configRepo = BpdasDataSource.getRepository(GuildConfiguration);
  const guildConfigs = await configRepo.find();

  client.configs = guildConfigs;
})
();
