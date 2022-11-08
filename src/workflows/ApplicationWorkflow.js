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

const getDenialReason = async (memberId, guildConfig, interaction) => {
    try {
        const member = interaction.guild.members.cache.get(memberId);

        //create an interaction
        const memberApplicationChannel = await interaction.guild.channels.fetch(guildConfig.application_log_channel_id);
        const buttonRow = new ActionRowBuilder().addComponents(
            new ButtonBuilder()
                .setCustomId(`denial_interaction_button_${memberId}`)
                .setLabel('Deny Application')
                .setStyle(ButtonStyle.Danger),
            new ButtonBuilder()
                .setCustomId('denial_interaction_cancel')
                .setLabel('Cancel')
                .setStyle(ButtonStyle.Secondary)
        );

        const selectMenuRow = await buildDenialReasons(memberId, guildConfig);


        const embed = new EmbedBuilder()
            .setColor(Colors.Red)
            .setTitle(`Denying Applicant ${member}`)
            .setDescription('This will deny the application for the selected reason. The user will be kicked from the server and receive a message with the reason given.');

        await interaction.reply({
            embeds: [embed],
            components: [selectMenuRow, buttonRow],
        });

    } catch (err) {
        console.log(err)

    }
}

const denyUser = async (interaction) => {   
    //get memberId, etc...
    const user = member.user.send()
    member.kick({ reason: guildConfig.ban_reason })
    console.log(`denying ${member}`)
}

const buildDenialReasons = async (memberId, guildConfig) => {

    const selectMenu = new SelectMenuBuilder()
        .setCustomId('denial_interaction_reasons')
        .setPlaceholder('Select a reason for denial')

    await BpdasDatasource.getRepository(DenialReasons).find()
        .then((res) => {
            res.forEach((reason) => {
                const menuOption = new SelectMenuOptionBuilder();

                menuOption
                    .setLabel(reason.reason_title)
                    // .setDescription(reason.reason_title)
                    .setValue(`denial_interaction_button_${reason.id.toString()}`);

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
const submitApplication = async (client, interaction, applicationForm) => {

    try {
        //        const applicant = client.users.cache.get(message.author.id);
        const guildConfig = client.configs.find(c => c.guild_id == interaction.guildId)
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
        const memberId = interaction.message.embeds[0].data.description.match(/\@([0-9]*?)\>/)[1]
        switch (interaction.customId) {
            case `apply_button_accept_${memberId}`:
                await acceptUser(memberId, guildConfig, interaction);
                await editButton(0, interaction);
                break;
            case `apply_button_deny_${memberId}`:
                await getDenialReason(memberId, guildConfig, interaction);
                //await editButton(1, interaction);
                break;
            case `apply_button_spa_${memberId}`:
                await spaTimeUser(memberId, guildConfig, interaction);
                await editButton(2, interaction);
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
                .setDescription(`${appText}\n\n**Application Denied**\nby ${interaction.user} on ${new Date().toUTCString()}`)
            options = {
                embeds: [denyEmbeds],
                components: []
            }
            break;
        case 2: //spa
            const spaEmbeds = new EmbedBuilder()
                .setColor(Colors.DarkGold)
                .setDescription(`${appText}\n\n**Spa time, mother fucker!**\nby ${interaction.user} on ${new Date().toUTCString()}`)

            options = {
                embeds: [spaEmbeds],
                components: [
                    interaction.message.components[0]
                ]
            }
            break;
        default:
            break;
    }
    console.log(`Updating interaction with message options\n${JSON.stringify(options)}`)
    await interaction.message.edit(options);
    //await interaction.deferUpdate();
}

module.exports = { acceptUser, denyUser: getDenialReason, spaTimeUser, submitApplication, editButton, applicationButtonInteraction };