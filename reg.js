require('dotenv').config();
const { Client, Intents, ClientApplication } = require('discord.js');
const commands = [
    {
        name: "ipa",
        description: "IPA文字列を音声に変換",
        options: [
            {
                type: "STRING",
                name: "ipa_text",
				nameLocalizations :[],
                description: "IPA文字列",
                required: true
            },
            {
                type: "STRING",
                name: "label_text",
                description: "IPA文字列の要約",
                required: false 
            },
        ]
    }
];
const guildId = process.argv[2];
const client = new Client({ intents: [Intents.FLAGS.GUILDS] });
client.token = process.env.DISCORD_TOKEN;

(async () => {
    client.application = new ClientApplication(client, {});
    await client.application.fetch();
    await client.application.commands.set([], guildId);
	
    await client.application.fetch();
    await client.application.commands.set(commands, guildId);
    console.log("success!");
})().catch(console.error);