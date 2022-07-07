require('dotenv').config();
const { Client, Intents, ClientApplication } = require('discord.js');

const cmd_ipa_eng={
	type: "SUB_COMMAND",
	name: "eng",
	description: "英語圏",
	options: [
		{
			type:"STRING",
			name:"text",
			description:"IPA文字列",
			required:true,
		},
		{
			type: "STRING",
			name: "speaker",
			description: "英語圏の話者を選択",
			required: true,
			choices: [
				{ name: "Australian English", value: "en-AU" },
				{ name: "British English", value: "en-GB" },
				{ name: "Indian English", value: "en-IN" },
				{ name: "New Zealand Englis", value: "en-NZ" },
				{ name: "South African English", value: "en-ZA" },
				{ name: "US English", value: "en-US" },
				{ name: "Welsh English", value: "en-GB-WLS" },
			]
		},
		{
			type:"STRING",
			name:"label",
			description:"要約や説明",
			required:false,
		},
	],
};
const cmd_ipa_asia={
	type: "SUB_COMMAND",
	name: "asia",
	description: "アジア圏",
	options: [
		{
			type:"STRING",
			name:"text",
			description:"IPA文字列",
			required:true,
		},
		{
			type: "STRING",
			name: "speaker",
			description: "アジア圏の話者を選択",
			required: true,
			choices: [
				{ name: "Chinese Mandarin", value: "cmn-CN" },
				{ name: "Japanese", value: "ja-JP" },
				{ name: "Korean", value: "ko-KR" },
			]
		},
		{
			type:"STRING",
			name:"label",
			description:"要約や説明",
			required:false,
		}
	],
};
const cmd_ipa_others={
	type: "SUB_COMMAND",
	name: "others",
	description: "その他",
	options: [
		{
			type:"STRING",
			name:"text",
			description:"IPA文字列",
			required:true,
		},
		{
			type: "STRING",
			name: "speaker",
			description: "その他の話者を選択",
			required: true,
			choices: [
				{ name: "Arabic", value: "arb" },
				{ name: "Austrian Germa", value: "de-AT" },
				{ name: "Brazilian Portuguese", value: "pt-BR" },
				{ name: "Canadian French", value: "fr-CA" },
				{ name: "Castilian Spanish", value: "es-ES" },
				{ name: "Catalan", value: "ca-ES" },
				{ name: "Danish", value: "da-DK" },
				{ name: "Dutch", value: "nl-NL" },
				{ name: "French", value: "fr-FR" },
				{ name: "German", value: "de-DE" },
				{ name: "Icelandic", value: "is-IS" },
				{ name: "Italian", value: "it-IT" },
				{ name: "Mexican Spanish", value: "es-MX" },
				{ name: "Norwegian", value: "nb-NO" },
				{ name: "Polish", value: "pl-PL" },
				{ name: "Portuguese", value: "pt-PT" },
				{ name: "Romanian", value: "ro-RO" },
				{ name: "Russian", value: "ru-RU" },
				{ name: "Swedish", value: "sv-SE" },
				{ name: "Turkish", value: "tr-TR" },
				{ name: "US Spanish", value: "es-US" },
				{ name: "Welsh", value: "cy-GB" },
			]
		},
		{
			type:"STRING",
			name:"label",
			description:"要約や説明",
			required:false,
		}
	],
};
const cmd_ipa = {
	name: "ipa2s",
	description: "IPAを音声に変換",
	options: [
		cmd_ipa_eng,
		cmd_ipa_asia,
		cmd_ipa_others
	],
};
const cmd_word = {
	name: "txt2s",
	description: "テキストを音声に変換",
	options: [
		cmd_ipa_eng,
		cmd_ipa_asia,
		cmd_ipa_others
	],	
}
const commands=[
	cmd_ipa,
	cmd_word,
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