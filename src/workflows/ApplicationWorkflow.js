const { Client, Message, Colors, ActionRowBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder, GuildMember, ChannelType, PermissionFlagsBits, SelectMenuBuilder, SelectMenuOptionBuilder, SelectMenuComponent } = require("discord.js");
const BpdasDatasource = require("../typeorm/BpdasDatasource");
const DenialReasons = require("../typeorm/entities/DenialReasons");
const ApplicationForm = require('../utils/structures/ApplicationForm');

/**
 * 
 * @param {String} memberId
 * @param {Array} guildConfigs 
 * @param {Message} message 
 * @returns
 */
async function acceptUser(memberId, guildConfig, message) {
    const newbRole = await message.guild.roles.fetch(guildConfig.newb_role_id);
    const acceptRole = await message.guild.roles.fetch(guildConfig.accepted_role_id);
    const member = await message.guild.members.fetch(memberId).catch(async () => {
        const user = await message.client.users.fetch(memberId);
        message.channel.send(`**${user.username}** doesn't seem to be a part of the server anymore...`)
        return false;
    });

    if (!newbRole || !acceptRole) {
        message.channel.send('check your db roles, bro');
        return false;
    }

    try {
        member.roles.add(acceptRole);
        member.roles.remove(newbRole);
        console.log(`${member} had roles changed`);
        return true;
    } catch (error) {
        console.log(error);
        return false;
    }

}

const getDenialReason = async (memberId, guildConfig, interaction) => {
    try {

        const member = await interaction.guild.members.fetch(memberId);
        const selectMenuRow = await buildDenialReasons(memberId, guildConfig);

        const embed = new EmbedBuilder()
            .setColor(Colors.Red)
            .setTitle(`Denying Applicantion`)
            .setDescription(`This will deny ${member.displayName}'s application for the selected reason. The user will be kicked from the server and receive a message with the reason given.`);

        await interaction.message.edit({
            embeds: [interaction.message.embeds[0], embed],
            components: [selectMenuRow],
        });

    } catch (err) {
        console.log(err)
    }
}

const denyUser = async (interaction) => {
    try {
        if (interaction.isButton() && interaction.customId == 'denial_interaction_button_cancel') {
            //interaction cancelled
            //recreate the app
            // submitApplication(interaction.client, )
            interaction.reply("I still need to work on this part, sorry");
            return;
        }
        if (interaction.isSelectMenu() && interaction.values.length > 0) {
            const member = await interaction.guild.members.fetch(interaction.customId);
            const denialReason = await BpdasDatasource.getRepository(DenialReasons).findOneBy({
                id: interaction.values[0],
            });
            const embed = new EmbedBuilder()
                .setColor(Colors.Red)
                .setTitle(`${denialReason.reason_title}`)
                .setDescription(`The following DM will be sent to ${member}:\n\n${denialReason.reason_text}`);
            //add buttons
            const buttonRow = new ActionRowBuilder().addComponents(
                new ButtonBuilder()
                    .setCustomId(`denial_interaction_button_${interaction.customId}_reason_${denialReason.id}`)
                    .setLabel('Deny Application')
                    .setStyle(ButtonStyle.Danger),
                new ButtonBuilder()
                    .setCustomId('denial_interaction_button_cancel')
                    .setLabel('Cancel')
                    .setStyle(ButtonStyle.Secondary)
            );

            interaction.message.edit({
                embeds: [embed],
                components: [buttonRow],
            })
            await interaction.deferUpdate(false);
            return;
        }
        if (interaction.isButton() && interaction.customId.startsWith('denial_interaction_button_')) {
            //Reason selected, now to do the deed
            //get the member
            const memberReason = interaction.customId.match(/\d+/gm);
            const member = await interaction.guild.members.fetch(memberReason[0]);
            const denialReason = await BpdasDatasource.getRepository(DenialReasons).findOneBy({
                id: memberReason[1],
            });
            //get the denial reason
            console.log(`Attempting to deny ${member.id}, "${member.displayName}" with "${denialReason.reason_title}"`)

            //kick that bad larry out of the server and send a DM
            await member.user.send(denialReason.reason_text);
            const memberApp = await new ApplicationForm().getFromDatabase(member);
            const deniedApplication = new EmbedBuilder()
                .setColor(Colors.Red)
                .setDescription(memberApp.readableApp);

            const deniedCompleteEmbed = new EmbedBuilder()
                .setColor(Colors.Red)
                .setDescription(`Denied by ${interaction.member} on ${new Date().toUTCString()} for the following reason:\n\n**${denialReason.reason_title}**`);

            await member.kick(denialReason.reason_text);
            interaction.message.edit({
                components: [],
                embeds: [
                    deniedApplication,
                    deniedCompleteEmbed,
                ],
            })
        }
    } catch (error) {
        interaction.channel.send({
            content: '<@832955089496440862> something went wrong...',
        })
        console.log(error);
    }
}

const buildDenialReasons = async (memberId) => {

    const selectMenu = new SelectMenuBuilder()
        .setCustomId(memberId)
        .setPlaceholder('Select a reason for denial')
        .setMaxValues(1)
        .setMinValues(1)

    await BpdasDatasource.getRepository(DenialReasons).find()
        .then((res) => {
            res.forEach((reason) => {
                const menuOption = new SelectMenuOptionBuilder();

                menuOption
                    .setLabel(reason.reason_title)
                    // .setDescription(reason.reason_title)
                    .setValue(reason.id.toString());

                selectMenu.addOptions(menuOption);
            })
        })

    const selectDenialReason = new ActionRowBuilder().addComponents(selectMenu);
    return selectDenialReason;
}


const spaTimeUser = async (memberId, guildConfig, interaction) => {
    try {
        console.log('spaTimeUser ran')
        //create a spa for the user
        const memberApplicationChannel = await interaction.guild.channels.fetch(guildConfig.application_log_channel_id);
        const spaUser = await interaction.guild.members.fetch(memberId)
        const spaChannelName = `🛌🏾・Spa for ${spaUser.displayName}`
        const spaChannel = await interaction.guild.channels.create({
            name: spaChannelName,
            type: ChannelType.GuildText,
            parent: guildConfig.spa_channel_category,
        })
        await spaChannel.permissionOverwrites.create(spaUser, { ViewChannel: true, SendMessages: true, AttachFiles: true, EmbedLinks: true })

        await memberApplicationChannel.send(`${spaChannel} created for ${spaUser}`);
        await spaChannel.send(`${spaUser}\n${guildConfig.spa_intro}`);

    } catch (err) {
        console.log(err);
    }

}
/**
 * 
 * @param {Client} client 
 * @param {Message} message 
 * @param {Array} answers 
 */
const submitApplication = async (client, member, applicationForm) => {

    try {
        //set the application to pending
        applicationForm.result = 1;
        await applicationForm.saveToDatabase();
        const guildConfig = client.configs.find(c => c.guild_id == applicationForm.guildId) //get the guild ID with this breakpoint
        const memberApplicationChannelId = guildConfig.application_log_channel_id;
        if (memberApplicationChannelId) {
            const memberApplicationChannel = client.channels.cache.get(memberApplicationChannelId);
            if (memberApplicationChannel) {

                const row = new ActionRowBuilder().setComponents(
                    new ButtonBuilder()
                        .setCustomId(`apply_button_accept_${applicationForm.applicantId}`)
                        .setLabel('accept')
                        .setStyle(ButtonStyle.Success),
                    new ButtonBuilder()
                        .setCustomId(`apply_button_deny_${applicationForm.applicantId}`)
                        .setLabel('deny')
                        .setStyle(ButtonStyle.Danger),
                    new ButtonBuilder()
                        .setCustomId(`apply_button_spa_${applicationForm.applicantId}`)
                        .setLabel('spa time')
                        .setStyle(ButtonStyle.Primary)
                );

                const embed = new EmbedBuilder()
                    .setColor(Colors.Yellow)
                    .setDescription(applicationForm.readableApp)

                memberApplicationChannel.send({
                    // content: finishedApplication,
                    components: [row],
                    embeds: [embed],
                });
            }
        }
    } catch (err) {
        console.log(err);
    } finally {
    }
}


const applicationButtonInteraction = (async (interaction, guildConfig) => { //interaction.commandName 'apply', 
    try {
        const memberId = interaction.customId.match(/\d+/gm)[0]
        const applicationForm = new ApplicationForm();
        await applicationForm.getFromDatabase(memberId);
        switch (interaction.customId) {
            case `apply_button_accept_${memberId}`:
                const acceptSuccess = await acceptUser(memberId, guildConfig, interaction)
                acceptSuccess === true ?
                    await editButton(0, interaction) : await editButton(3, interaction);
                applicationForm.result = 2;
                await applicationForm.saveToDatabase();
                break;
            case `apply_button_deny_${memberId}`:
                await getDenialReason(memberId, guildConfig, interaction);
                await editButton(1, interaction);
                applicationForm.result = 3;
                await applicationForm.saveToDatabase();
                break;
            case `apply_button_spa_${memberId}`:
                await spaTimeUser(memberId, guildConfig, interaction);
                await editButton(2, interaction);
                applicationForm.result = 4;
                await applicationForm.saveToDatabase();
                break;
            default:
                console.log(`I don't know what button ${interaction.customId} is...`)
                break;
        }
    } catch (error) {
        console.log(error);
    } finally {
        if (!interaction.deferred && !interaction.replied) {
            try {
                await interaction.deferUpdate();
            } catch (error) {
                console.log(error);
            }
        }
    }
})

const editButton = async (res, interaction) => {
    let options = {};
    const appText = interaction.message.embeds[0].data.description;
    switch (res) {
        case 0: //accept
            const acceptEmbeds = new EmbedBuilder()
                .setColor(Colors.Green)
                .setDescription(`${appText}\n\n**Application Accepted**\nby ${interaction.user} on ${new Date().toUTCString()}`)

            options = {
                embeds: [acceptEmbeds],
                components: []
            }

            break;
        case 1: //deny
            const denyEmbeds = new EmbedBuilder()
                .setColor(Colors.Red)
                .setDescription(appText)
            options = {
                embeds: [denyEmbeds],
                // components: []
            }
            break;
        case 2: //spa
            const spaEmbeds = new EmbedBuilder()
                .setColor(Colors.DarkGold)
                .setDescription(`${appText}\n\n**Spa time!**\nby ${interaction.user} on ${new Date().toUTCString()}`)

            options = {
                embeds: [spaEmbeds],
                components: [
                    interaction.message.components[0]
                ]
            }
            break;
        case 3: //wtf acceptance fail
            const errEmbeds = new EmbedBuilder()
                .setColor(Colors.NotQuiteBlack)
                .setDescription(`${appText}\n\n**Either this user left, or something went wrong applying roles. Check the lawgs**\nby ${interaction.user} on ${new Date().toUTCString()}`)
            options = {
                embeds: [errEmbeds],
                components: [],
            }
            break;
        default:
            break;
    }
    console.log(`Updating interaction with message options\n${JSON.stringify(options)}`)
    await interaction.message.edit(options);
    //await interaction.deferUpdate();
}

module.exports = { acceptUser, denyUser, getDenialReason, spaTimeUser, submitApplication, editButton, applicationButtonInteraction };