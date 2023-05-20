require('dotenv').config()
const cron = require('cron')
const fs = require("fs")
const { Client, GatewayIntentBits, SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, ModalBuilder, TextInputBuilder, TextInputStyle } = require('discord.js')

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildIntegrations,
        GatewayIntentBits.GuildMembers,
    ]
})

const config = require("./config/config.json")
const classe = require("./dat/classe.json")
const carnet = require("./dat/carnet.json")
let hasDoneCarnet = require("./dat/hasDoneCarnet.json")
let guild


client.login(process.env.TOKEN)

client.on("ready", async () => {

    guild = await client.guilds.fetch(process.env.GUILD)
    console.log("Polybot ready")

    let carnetJob = new cron.CronJob('0 12 * * 1', envoiCarnetdeSuivis)
    carnetJob.start()

    client.user.setPresence({ activities: [{ name: 'polycraft' }] })
    setInterval(() => {
        client.user.setPresence({ activities: [{ name: 'polycraft' }] })
    }, 60000 * 5)

    // register all the commands

    // créer une commande carnet qui pourr prendre l'argument toggle et trigger

    const commands = {
        "setup": new SlashCommandBuilder().setName("setup").setDescription("Mise en place du bot"),
        "carnet": new SlashCommandBuilder().setName("carnet")
            .setDescription("Commandes du carnet de suivis")
            .addSubcommand(subcommand =>
                subcommand
                    .setName("trigger")
                    .setDescription("Envoyer la notif de carnet de suivis")
                    .addStringOption(option =>
                        option
                            .setName('date')
                            .setDescription('Choisir une date dd/mm/yyyy')
                            .setRequired(false)
                    )
            )
            .addSubcommand(subcommand =>
                subcommand
                    .setName("toggle")
                    .setDescription("Activer ou désactiver l'envoi automatique de la notif de carnet de suivis")
            )
    }
    for (const [key, value] of Object.entries(commands)) {
        await client.application.commands.create(value)
    }
})


client.on("interactionCreate", async (interaction) => {
    if (interaction.isCommand()) {
        switch (interaction.commandName) {
            case "setup": {
                if (!interaction.member.permissions.has("ADMINISTRATOR")) break

                await interaction.reply(":white_check_mark: Setup en cours...")

                const carnetChannel = guild.channels.cache.find(channel => channel.name === "carnet-de-suivis")

                const CarnetdeSuivisEmbed = new EmbedBuilder()
                    .setColor(config.colors.color)
                    .setTitle('Choisi ton groupe de classe')
                    .setDescription(`Bienvenue dans le carnet de suivi !\nIci chaque lundi à 12h, la personne responsable du carnet de suivis sera ping ! :) \nUne fois le carnet complété, il suffira de cliquer sur le bouton "Marquer comme fait"
                    Un des délégués sera chargé d'activer ou non la fonctionnalité si vous êtes en entreprise ou non...
                    `)
                    .setThumbnail(client.user.displayAvatarURL())


                carnetChannel.send({ embeds: [CarnetdeSuivisEmbed] }).then(message => {
                    message.pin()
                })

                const groupesChannel = guild.channels.cache.find(channel => channel.name === "rejoindre")

                const groupeEmbed = new EmbedBuilder()
                    .setColor(config.colors.color)
                    .setTitle('Choisi ton groupe de classe')
                    .setDescription('Bienvenue à toi jeune alternant !\nVos groupes ont été déterminés à la suite de votre score au TOEIC, attends ton résultat pour rejoindre.')
                    .setThumbnail(client.user.displayAvatarURL())
                const buttons = new ActionRowBuilder()
                    .addComponents(
                        new ButtonBuilder()
                            .setCustomId('ModalJoindGroup_1')
                            .setLabel('Groupe 1')
                            .setStyle(ButtonStyle.Primary),
                    )
                    .addComponents(
                        new ButtonBuilder()
                            .setCustomId('ModalJoindGroup_2')
                            .setLabel('Groupe 2')
                            .setStyle(ButtonStyle.Primary),
                    )

                groupesChannel.send({ embeds: [groupeEmbed], components: [buttons] })


                config.channels.carnet = carnetChannel.id
                config.channels.groupes = groupesChannel.id


                // find the two groups roles 
                const delegue = guild.roles.cache.filter(role => role.name.includes("Délégué"))
                const groupes1 = guild.roles.cache.filter(role => role.name.includes("Groupe 1"))
                const groupes2 = guild.roles.cache.filter(role => role.name.includes("Groupe 2"))


                config.roles.delegue = delegue.map(role => role.id)[0]
                config.roles.gp1 = groupes1.map(role => role.id)[0]
                config.roles.gp2 = groupes2.map(role => role.id)[0]

                fs.writeFile("./config/config.json", JSON.stringify(config, null, 2), (err) => {
                    if (err) console.log(err)
                }
                )
                break
            }

            case "carnet": {
                if (!interaction.member.roles.cache.has(config.roles.delegue)) break
                switch (interaction.options.getSubcommand("commande")) {
                    case "trigger": {
                        await interaction.reply(":white_check_mark: Carnet de suivis envoyé !")
                        envoiCarnetdeSuivis(interaction.options.getString("date") ?? null, true)
                        break
                    }
                    case "toggle": {
                        if (carnet.toggle) {
                            carnet.toggle = false
                            await interaction.reply(":white_check_mark: Carnet de suivis désactivé !")
                        } else {
                            carnet.toggle = true
                            await interaction.reply(":white_check_mark: Carnet de suivis activé !")
                        }


                        break
                    }

                    default: {
                        console.log("Commande inconnue " + interaction.commandName)
                        break
                    }
                }
                break
            }

            default: {
                console.log("Commande inconnue " + interaction.commandName)
                break
            }
        }

        return
    } else if (interaction.isButton()) {
        const interactionId = interaction.customId.split("_")[0]
        const arg = interaction.customId.split("_")[1]

        switch (interactionId) {
            case "ModalJoindGroup": {
                const modal = new ModalBuilder()
                    .setCustomId('JoinGroupInput_' + arg)
                    .setTitle('Comment te nommes-tu ?')

                const prenom = new TextInputBuilder()
                    .setCustomId('prenom')
                    .setLabel("Prénom")
                    .setStyle(TextInputStyle.Short)

                const nom = new TextInputBuilder()
                    .setCustomId('nom')
                    .setLabel("Nom")
                    .setStyle(TextInputStyle.Short)

                const prenomRow = new ActionRowBuilder().addComponents(prenom)
                const nomRow = new ActionRowBuilder().addComponents(nom)

                modal.addComponents(prenomRow, nomRow)

                await interaction.showModal(modal)
                break
            }

            case "markCarnetDone": {
                try {
                    await interaction.deferUpdate()
                    const carnetEmbed = new EmbedBuilder()
                        .setColor(config.colors.color)
                        .setDescription(`${interaction.member} a complété le carnet de suivi`)
                        .addFields({ name: "Carnet de la semaine du ", value: arg })
                        .setFooter({ text: "Carnet Complété le" })
                        .setTimestamp()
                    interaction.message.edit({ embeds: [carnetEmbed], components: [] });
                } catch (error) {
                    console.log(error)
                }
                break
            }

        }
    } else if (interaction.isModalSubmit()) {
        const interactionId = interaction.customId.split("_")[0]
        const arg = interaction.customId.split("_")[1]

        switch (interactionId) {
            case "JoinGroupInput": {
                await interaction.deferUpdate()

                const prenom = interaction.fields.fields.get("prenom").value
                const nom = interaction.fields.fields.get("nom").value

                const eleve = {
                    id: interaction.member.id,
                    prenom: prenom,
                    nom: nom,
                    groupe: arg
                }

                classe.push(eleve)

                fs.writeFile("./dat/classe.json", JSON.stringify(classe, null, 2), (err) => {
                    if (err) console.log(err)
                })

                try {
                    await interaction.member.setNickname(`${prenom} - ${nom}`)
                } catch (error) {
                    console.log(error)
                    interaction.member.send("Impossible de changer ton pseudo, merci de le faire manuellement `" + prenom + " - " + nom + "`").catch(err => console.log(err))
                }

                switch (arg) {
                    case "1": {
                        await interaction.member.roles.add(config.roles.gp1)
                        break
                    }

                    case "2": {
                        await interaction.member.roles.add(config.roles.gp2)
                        break
                    }


                    default: {
                        break
                    }
                }
                break
            }

            default: {
                break
            }
        }



    }
})


async function envoiCarnetdeSuivis(dateInput, force) {
    console.log("Carnet de suivis")

    if (!carnet.toggle && !force) return

    // récupération de tous les membres de la classe dans les deux groupes
    const carnetChannel = await guild.channels.fetch(config.channels.carnet)

    const listClasse = classe.sort((a, b) => {
        const prenomA = a.prenom.toLowerCase()
        const prenomB = b.prenom.toLowerCase()
        const nomA = a.nom.toLowerCase()
        const nomB = b.nom.toLowerCase()

        if (prenomA < prenomB) {
            return -1
        }
        if (prenomA > prenomB) {
            return 1
        }

        if (nomA < nomB) {
            return -1
        }
        if (nomA > nomB) {
            return 1
        }

        return 0
    }).map(mem => mem.id)

    if (hasDoneCarnet.length >= listClasse.length) {
        // Toute la classe a fait le carnet remise a zero
        console.log("Toute la classe a fait le carnet")
        hasDoneCarnet = []
        await fs.writeFileSync("./dat/hasDoneCarnet.json", JSON.stringify("[]", null, 2))
    }
    const notDone = listClasse.filter(mem => !hasDoneCarnet.includes(mem))
    const eleve = notDone[0]

    hasDoneCarnet.push(eleve)
    await fs.writeFileSync("./dat/hasDoneCarnet.json", JSON.stringify(hasDoneCarnet, null, 2))

    let dateStr
    if (!dateInput) {
        // get date 
        const date = new Date()
        dateStr = date.getDate() + "/" + (date.getMonth() + 1) + "/" + date.getFullYear()
        // const dateStr = "10/10/2022"
    } else {
        dateStr = dateInput
    }

    const carnetEmbed = new EmbedBuilder()
        .setColor(config.colors.waitingcolor)
        .setDescription(`<@${eleve}> doit compléter le carnet de suivi`)
        .addFields({ name: "Carnet de la semaine du ", value: dateStr })

    const buttons = new ActionRowBuilder()
        .addComponents(
            new ButtonBuilder()
                .setCustomId('markCarnetDone_' + dateStr)
                .setLabel('Marquer comme fait')
                .setEmoji("✅")
                .setStyle(ButtonStyle.Success),
        )
    carnetChannel.send({ content: `Personne désignée : <@${eleve}>`, embeds: [carnetEmbed], components: [buttons] })
}
