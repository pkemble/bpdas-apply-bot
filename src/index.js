
require('dotenv').config();
//import 'reflect-metadata';
const { Client, Intents, GatewayIntentBits } = require('discord.js');
const { registerCommands, registerEvents } = require('./utils/registry');
const config = require('../slappey.json');
const { createPool } = require('mysql2/promise');
const { GuildConfiguration } = require('./typeorm/entities/GuildConfiguration');
const client = new Client({ intents: [ GatewayIntentBits.Guilds, GatewayIntentBits.GuildMembers ] });

(async () => {
  client.commands = new Map();
  client.events = new Map();
  client.prefix = config.prefix;
  await registerCommands(client, '../commands');
  await registerEvents(client, '../events');
  await client.login(process.env.DJS_TOKEN);
  await createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_DATABASE,
    port: process.env.DB_PORT,
    entities: [GuildConfiguration],
  })
})
();
