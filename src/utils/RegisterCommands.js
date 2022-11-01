const { REST, Routes } = require('discord.js');
//const { clientId, guildId, token } = require('./config.json');
const fs = require('node:fs');
const clientId = '1035913655667130468';
const guildId = '960355160570331177'; //sausage server
const token = 'MTAzNTkxMzY1NTY2NzEzMDQ2OA.GBHRJR.UtNXlJYTg_VvmJxT-govv5E_xj30g2q22XUuP8';

const commands = [];
// Grab all the command files from the commands directory you created earlier
const commandFiles = fs.readdirSync('c:/Users/pkemb/Documents/dev/bpdas-apply-bot/src/commands/application').filter(file => file.endsWith('.js'));

// Grab the SlashCommandBuilder#toJSON() output of each command's data for deployment
for (const file of commandFiles) {
	const command = require(`c:/Users/pkemb/Documents/dev/bpdas-apply-bot/src/commands/application/${file}`);
	commands.push(command.data.toJSON());
}

// Construct and prepare an instance of the REST module
const rest = new REST({ version: '10' }).setToken(token);

// and deploy your commands!
(async () => {
	try {
		console.log(`Started refreshing ${commands.length} application (/) commands.`);

		// The put method is used to fully refresh all commands in the guild with the current set
		const data = await rest.put(
			Routes.applicationGuildCommands(clientId, guildId),
			{ body: commands },
		);

		console.log(`Successfully reloaded ${data.length} application (/) commands.`);
	} catch (error) {
		// And of course, make sure you catch and log any errors!
		console.error(error);
	}
})();