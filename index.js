require('dotenv').config();
const aws = require('aws-sdk');
const fs = require('fs');
const tmp = require("tmp");
const { Client, Intents, MessageEmbed   } = require('discord.js');
const client = new Client({ intents: [Intents.FLAGS.GUILDS] });

const _embed_color='#d000e0';
let _voices = [];
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
async function _set_command(guild) {
	console.log("コマンドを登録しました:" + guild.id + "(" + guild.name + ")" );
	await client.application.commands.set(commands, guild.id);
}

const _polly_describeVoices = async () =>{
	let polly = new aws.Polly({ apiVersion: '2016-06-10', region: 'us-east-1'});
	return await polly.describeVoices({}).promise().then(x=>{return x;});
};

const _polly_speech = async(washa, engine, text, text_type) =>{
	let polly = new aws.Polly({ apiVersion: '2016-06-10', region: 'us-east-1'});
	let speechParams = {
		Engine : engine,
		OutputFormat: 'mp3',
		VoiceId:washa,
		Text: text,
		SampleRate: '22050',
		TextType: text_type
	};
	return await polly.synthesizeSpeech(speechParams).promise().then(z=>{ return z;});
};

const _select_voice = (code) => {
	const list = _voices.filter(_=> _["LanguageCode"] == code);
	let voice = list.find(_=> _["SupportedEngines"].findIndex(a => a=="standard")!=-1);
	if (voice != undefined) {
		return voice;
	}
	return list[0];
};

const _command = async (text, code, text_type) =>{
	const voice = _select_voice(code);
	const engines = voice["SupportedEngines"];
	console.log(voice);
	let stream;
	try {
		let text2;
		if (text_type=="ssml") {
			text2 = "<phoneme alphabet='ipa' ph='" + text + "'></phoneme>";
		} else if (text_type=="text") {
			text2 = text;
		}
		const data = await _polly_speech(voice["Id"], engines[engines.length-1], text2, text_type);
		stream = data.AudioStream;
	} catch (ex) {
		console.log(ex);
		throw "音声変換に失敗しました。";
	}
	const tmpobj = tmp.fileSync({ postfix: '.mp3' });
	if (tmpobj.err) {
		console.log(tmpobj.err);
		throw "tmpファイル作成に失敗しました。BOT管理者に連絡してください";
	}
	try {
		fs.writeFileSync(tmpobj.fd, stream);
		return tmpobj.name;
	} catch (ex) {
		console.log(ex);
		throw "mp3ファイル書き込みに失敗しました。BOT管理者に連絡してください";
	}
};

client.once('ready', async () => {
	for (let guild of client.guilds.cache.values()) {
		await _set_command(guild);
	}
	console.log('describeVoices');
	const data = await _polly_describeVoices();
	_voices = data["Voices"];
	console.log('ready');
});

client.on('interactionCreate', async interaction => { 
	if (interaction.isCommand()) {
		const { commandName } = interaction;
		if (commandName == "ipa2s") {
			const ipa = interaction.options.getString("text");
			const code = interaction.options.getString("speaker")
			const label = interaction.options.getString("label", false);
			await interaction.deferReply();
			try {
				const filepath = await _command(ipa, code, "ssml");
				await interaction.followUp(
					{
						content:label,
						files: [{ "attachment": filepath}]
					}
				);
			} catch (err) {
				await interaction.followUp(
					{
						content:err
					}
				);
			}
		}
		if (commandName == "txt2s") {
			const word = interaction.options.getString("text");
			const code = interaction.options.getString("speaker")
			const label = interaction.options.getString("label", false);
			await interaction.deferReply();
			try {
				const filepath = await _command(word, code, "text");
				await interaction.followUp(
					{
						content:label == null ? word : label,
						files: [{ "attachment": filepath}]
					}
				);
			} catch (err) {
				await interaction.followUp(
					{
						content:err,
					}
				);
			}
		}
	}
});

client.on("guildCreate", async guild=>{
	await _set_command(guild);
});

client.login(process.env.DISCORD_TOKEN);
