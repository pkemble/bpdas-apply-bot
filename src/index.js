
require('dotenv').config();
//import 'reflect-metadata';
const { Client, GatewayIntentBits, InteractionCollector, Routes, Collection } = require('discord.js');
const { registerCommands, registerEvents } = require('./utils/registry');
const BpdasDataSource = require('./typeorm/BpdasDatasource');
const GuildConfiguration = require('./typeorm/entities/GuildConfiguration');
const { default: DiscordClient } = require('../client/client');
const { applicationButtonInteraction } = require('./workflows/ApplicationWorkflow');
const { cleanSpas } = require('./utils/CleanSpasWorkflow');

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

client.on('interactionCreate', (interaction) => {

  const guildConfig = client.configs.find(c => c.guild_id == interaction.guildId);

  if (interaction.isChatInputCommand()) {
    const { commandName } = interaction;
    const cmd = client.slashCommands.get(commandName);

    console.log(commandName);

    if (cmd) {
      cmd.run(client, interaction);
    } else {
      interaction.reply({ content: `This command is ignoring you (no run method).` });
    }
  }
  if (interaction.isButton()) {
    //const { commandName } = interaction;
    //there has to be a better way to do this, but i need to grab the type of interaction based on the button clicked.
    //right now this will come from the button's 'customId' property.
    if (interaction.customId.startsWith('apply_button_')) {

      console.log('Application button clicked');
      applicationButtonInteraction(interaction, guildConfig);
    }
    if (interaction.customId.startsWith('cleanspas_')) {
      console.log('Spa cleaner button clicked')
      cleanSpas(client, interaction, guildConfig);
    }
  }
})

async function main() {
  client.slashCommands = new Collection();
  client.commands = new Map();
  client.events = new Map();
  await client.login(process.env.DJS_TOKEN);

  await BpdasDataSource.initialize();
  await registerCommands(client, '../commands');
  await registerEvents(client, '../events');

  const configRepo = BpdasDataSource.getRepository(GuildConfiguration);
  const guildConfigs = await configRepo.find();

  client.configs = guildConfigs;

  const slashCommandsJson = client.slashCommands.map((cmd) =>
    cmd.getSlashCommandJSON()
  );
  client.configs.map(async (conf) => {
    try {
      await client.rest.put(Routes.applicationGuildCommands(process.env.DJS_APP_ID, conf.guild_id), {
        body: [...slashCommandsJson],
      });
      const registeredSlashCommands = await client.rest.get(Routes.applicationGuildCommands(process.env.DJS_APP_ID, conf.guild_id))
      console.log(`Registered the following commands for ${conf.guild_id}`);
      console.log(registeredSlashCommands);
    } catch (error) {
      console.log(error);
    }

  })
}

main();
