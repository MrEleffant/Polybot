require('dotenv').config()
const cron = require('cron');
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
const carnet = require("./dat/carnet.json")

client.login(process.env.TOKEN);

client.on("ready", async () => {
    guild = await client.guilds.fetch(config.guild)
    groupeChannel = await client.channels.fetch(config.channels.groupes)
    console.log("Polybot ready")
    // cron eveery minute on sunday 
    let carnetJob = new cron.CronJob('0 0 * * 1', envoiCarnetdeSuivis);
    carnetJob.start();

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

        case "sendFormCarnet": {
            try {
                // récupération du message 
                // const message = await interaction.channel.messages.fetch(carnet.messages[arg])
                // message.edit({content: "test"});
                // show modal to fill carnet
                const modal = new ModalBuilder()
                    .setCustomId('fillCarnet_' + arg)
                    .setTitle('Remplis le carnet de suivi');

                const resume = new TextInputBuilder()
                    .setCustomId('resume')
                    .setLabel("Résumé de la semaine")
                    .setStyle(TextInputStyle.Paragraph);

                const resumeRow = new ActionRowBuilder().addComponents(resume);
                modal.addComponents(resumeRow);
                await interaction.showModal(modal);

            } catch (error) {
                console.log(error)
            }
            break;
        }

        case "fillCarnet": {
            try {
                await interaction.deferUpdate()
                const resume = interaction.fields.fields.get("resume").value
                const message = await interaction.channel.messages.fetch(carnet.messages[arg])

                const carnetEmbed = new EmbedBuilder()
                    .setColor(config.color)
                    .setTitle(interaction.member.displayName + " a compléter le carnet de suivi")
                    .setDescription('Carnet de la semaine du ' + arg)
                    .addFields({ name: "Résumé de la semaine", value: resume })
                    .setFooter({ text: "Carnet Complété le" })
                    .setTimestamp()
                const buttons = new ActionRowBuilder()
                    .addComponents(
                        new ButtonBuilder()
                            .setCustomId('sendFormCarnet_' + arg)
                            .setEmoji("✏️")
                            .setStyle(ButtonStyle.Secondary),
                    );
                message.edit({ embeds: [carnetEmbed], components: [buttons] });
            } catch (error) {
                console.log(error)
            }
            break
        }

        default: {
            console.log("Other interaction id : " + interactionId)
            break;
        }
    }
})


async function envoiCarnetdeSuivis() {
    console.log("Carnet de suivis")
    // récupération de tous les membres de la classe dans les deux groupes
    const guild = await client.guilds.fetch(config.guild)
    const carnetChannel = await client.channels.fetch(config.channels.carnet)
    const classe = (await guild.members.fetch()).filter(mem => mem.roles.cache.has(config.groupes.roles[0]) || mem.roles.cache.has(config.groupes.roles[1]))
    // check if everyone has done
    if (carnet.hasDone.length == classe.size) {
        // Toute la classe a fait le carnet remise a zero
        console.log("Toute la classe a fait le carnet")
        carnet.hasDone = []
        await fs.writeFileSync("./dat/carnet.json", JSON.stringify(carnet, null, 2));
    }

    // récupération des membres qui n'ont pas fait le carnet
    const notDone = classe.filter(mem => !carnet.hasDone.includes(mem.id))
    // peak a random member in the notDone list
    const randomMember = notDone.random()
    // add the member to the hasDone list
    carnet.hasDone.push(randomMember.id)
    await fs.writeFileSync("./dat/carnet.json", JSON.stringify(carnet, null, 2));

    // get date 
    const date = new Date()
    const dateStr = date.getDate() + "/" + (date.getMonth() + 1) + "/" + date.getFullYear()


    const carnetEmbed = new EmbedBuilder()
        .setColor(config.waitingcolor)
        .setTitle(randomMember.displayName + " doit compléter le carnet de suivi")
        .setDescription('Carnet de la semaine du ' + dateStr)

    const buttons = new ActionRowBuilder()
        .addComponents(
            new ButtonBuilder()
                .setCustomId('sendFormCarnet_' + dateStr)
                .setLabel('Ecrire le carnet')
                .setStyle(ButtonStyle.Success),
        );

    const message = await carnetChannel.send({ content: `Personne désignée : ${randomMember}`, embeds: [carnetEmbed], components: [buttons] });
    carnet.messages[dateStr] = await message.id
    await fs.writeFileSync("./dat/carnet.json", JSON.stringify(carnet, null, 2));
}