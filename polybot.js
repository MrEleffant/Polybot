require('dotenv').config()
const fs = require("fs");
const { Client, GatewayIntentBits, Partials, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, ModalBuilder, TextInputBuilder, TextInputStyle } = require('discord.js');

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildMembers,
    ], partials: [Partials.Channel]
});

let guild, groupeChannel
const config = require("./config/config.json")

client.login(process.env.TOKEN);

client.on("ready", async () => {
    guild = await client.guilds.fetch(config.guild)
    groupeChannel = await client.channels.fetch(config.channels.groupes)

    console.log("Polybot ready")
    client.user.setPresence({ activities: [{ name: 'polycraft' }] });
    setInterval(() => {
        client.user.setPresence({ activities: [{ name: 'polycraft' }] });
    }, 60000 * 5);
})

client.on("messageCreate", async (message) => {
    if (message.author.bot) return;
    if (message.channel.type === "dm") return;
    const args = message.content.substring(config.prefix.length).trim().split(" ");
    const command = args.shift().toLowerCase();
    if (!message.content.startsWith(config.prefix)) return;
    switch (command) {
        case "setupgroupes": {
            message.delete()
            if (!message.member.permissions.has('Administrator')) break
            const groupeEmbed = new EmbedBuilder()
                .setColor(config.color)
                .setTitle('Choisi ton groupe de classe')
                .setThumbnail(client.user.displayAvatarURL())
            const buttons = new ActionRowBuilder()
                .addComponents(
                    new ButtonBuilder()
                        .setCustomId('joingroupe_1')
                        .setLabel('Groupe 1')
                        .setStyle(ButtonStyle.Primary),
                )
                .addComponents(
                    new ButtonBuilder()
                        .setCustomId('joingroupe_2')
                        .setLabel('Groupe 2')
                        .setStyle(ButtonStyle.Primary),
                );
            groupeChannel.send({ embeds: [groupeEmbed], components: [buttons] });
        }
        default: {
            console.log(command)
            break;
        }
    }
})

client.on("interactionCreate", async (interaction) => {
    const interactionId = interaction.customId.split("_")[0];
    const arg = interaction.customId.split("_")[1];

    switch (interactionId) {
        case "joingroupe": {
            const modal = new ModalBuilder()
                .setCustomId('renameInput_' + arg)
                .setTitle('Comment te nommes-tu ?');

            const prenom = new TextInputBuilder()
                .setCustomId('prenom')
                .setLabel("Prénom")
                .setStyle(TextInputStyle.Short);

            const nom = new TextInputBuilder()
                .setCustomId('nom')
                .setLabel("Nom")
                .setStyle(TextInputStyle.Short);

            const prenomRow = new ActionRowBuilder().addComponents(prenom);
            const nomRow = new ActionRowBuilder().addComponents(nom);

            // Add inputs to the modal
            modal.addComponents(prenomRow, nomRow);

            // Show the modal to the user
            await interaction.showModal(modal);
            break;
        }

        case "renameInput": {
            try {
                await interaction.deferUpdate()
                const prenom = interaction.fields.fields.get("prenom").value
                const nom = interaction.fields.fields.get("nom").value

                interaction.member.setNickname(`${prenom} - ${nom}`)
                
                switch (arg) {
                    case "1": {
                        await interaction.member.roles.remove(config.groupes.roles[1])
                        await interaction.member.roles.add(config.groupes.roles[0])
                        break;
                    }
    
                    case "2": {
                        await interaction.member.roles.remove(config.groupes.roles[0])
                        await interaction.member.roles.add(config.groupes.roles[1])
                        break;
                    }
    
                    default: {
                        break;
                    }
                }
    
                break
            } catch (error) {
                console.log(error)
            }
        }

        default: {
            console.log("Other interaction id : " + interactionId)
            break;
        }
    }
})
