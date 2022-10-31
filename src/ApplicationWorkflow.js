const { Client, Message, Colors, ActionRowBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder, GuildMember } = require("discord.js");
const ApplicationForm = require('./utils/structures/ApplicationForm');

/**
 * 
 * @param {String} memberId
 * @param {Array} guildConfigs 
 * @param {Message} message 
 * @returns
 */
const acceptUser = async (memberId, guildConfig, message) => {
    const newbRole = message.guild.roles.cache.find(r => r.id == guildConfig.newb_role_id);
    const acceptRole = message.guild.roles.cache.find(a => a.id == guildConfig.accepted_role_id);
    const member = await message.guild.members.fetch(memberId);
    if (!newbRole || !acceptRole) {
        message.channel.send('check your db roles, bro');
        return false;
    }

    try {
        member.roles.add(acceptRole);
        member.roles.remove(newbRole);
    } catch (error) {
        console.log(error);
        return false;
    } finally {
        console.log(`${member} had roles changed`);
        return true;
    }

}

const denyUser = async () => {
    console.log('denyUser ran')
    return true;
}

const spaTimeUser = async () => {
    console.log('spaTimeUser ran')
    return true;
}
/**
 * 
 * @param {Client} client 
 * @param {Message} message 
 * @param {Array} answers 
 */
const submitApplication = async (client, message, answers) => {
    const applicant = client.users.cache.get(message.author.id);
    const guildConfig = client.configs.find(c => c.guild_id == message.guildId)
    const applicationForm = new ApplicationForm();
    applicationForm.applicantId = applicant.id;
    let finishedApplication = `${applicant} has submitted the following application: \n`;
    answers.forEach(a => {
        finishedApplication += `**${a.question}:** \n${a.answer}\n\n`
        let que = a.question, ans = a.answer.content;
        applicationForm.addAnswer({ question: que, answer: ans });
    });
    applicationForm.saveToDatabase();

    const memberApplicationChannelId = guildConfig.application_log_channel_id;
    if (memberApplicationChannelId) {
        const memberApplicationChannel = client.channels.cache.get(memberApplicationChannelId);
        if (memberApplicationChannel) {
            //memberApplicationChannel.send(finishedApplication);
            // const testId = "1035972676482760737" //testdoc
            //const testUser = message.guild.members.cache.find(m => m.id == testId);
            // const testUser = await message.guild.members.fetch(testId);
            const row = new ActionRowBuilder().setComponents(
                new ButtonBuilder()
                    .setCustomId(`button_accept`)
                    .setLabel('accept')
                    .setStyle(ButtonStyle.Success),
                new ButtonBuilder()
                    .setCustomId(`button_deny`)
                    .setLabel('deny')
                    .setStyle(ButtonStyle.Secondary),
                new ButtonBuilder()
                    .setCustomId(`button_spa`)
                    .setLabel('spa time')
                    .setStyle(ButtonStyle.Danger)
            );

            const embed = new EmbedBuilder()
                .setColor(Colors.Yellow)
                .setDescription(finishedApplication)

            message.channel.send({
                // content: finishedApplication,
                components: [row],
                embeds: [embed],
            });

            client.on('interactionCreate', (interaction) => {
                console.log(interaction);
                try {
                    const memberId = interaction.message.embeds[0].data.description.match(/\@([0-9]*?)\>/)[1]
                    switch (interaction.customId) {
                        case 'button_accept':
                            acceptUser(memberId, guildConfig, interaction);
                            break;
                        case 'button_deny':
                            ApplicationWorkflow.denyUser();

                            break;
                        case 'button_spa':
                            ApplicationWorkflow.spaTimeUser();

                            break;
                        default:
                            console.log(`I don't know what button ${interaction.customId} is...`)
                            break;
                    }
                } catch (err) {
                    console.log(err);

                }
            })
        }
    }
}

module.exports = { acceptUser, denyUser, spaTimeUser, submitApplication };