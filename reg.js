require('dotenv').config();
const { Client, Intents, ClientApplication } = require('discord.js');
const { SlashCommandBuilder } = require('@discordjs/builders');

const commands=[
	new SlashCommandBuilder().setName("ipa").setDescription("IPAを音声に変換")
];
const guildId = process.argv[2];
const client = new Client({ intents: [Intents.FLAGS.GUILDS] });
client.token = process.env.DISCORD_TOKEN;

(async () => {
    client.application = new ClientApplication(client, {});
    await client.application.fetch();
    await client.application.commands.set(commands, guildId);
    console.log("success!");
})().catch(console.error);