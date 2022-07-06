require('dotenv').config();
const aws = require('aws-sdk');
const fs = require('fs');
const tmp = require("tmp");
const { Client, Intents, MessageEmbed   } = require('discord.js');
const client = new Client({ intents: [Intents.FLAGS.GUILDS] });

const _embed_color='#d000e0';
let _voices = [];

const _polly_describeVoices = async () =>{
	let polly = new aws.Polly({ apiVersion: '2016-06-10', region: 'us-east-1'});
	return await polly.describeVoices({}).promise().then(x=>{return x;});
};

const _polly_speech = async(washa, engine, ipa) =>{
	let polly = new aws.Polly({ apiVersion: '2016-06-10', region: 'us-east-1'});
	let speechParams = {
		Engine : engine,// "neural","standard",
		OutputFormat: 'mp3',
		VoiceId:washa,// "Joanna",
		Text: "<phoneme alphabet='ipa' ph='" + ipa + "'></phoneme>",
		SampleRate: '22050',
		TextType: 'ssml'
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

client.once('ready', async () => {
	console.log('describeVoices');
	const data = await _polly_describeVoices();
	_voices = data["Voices"];
    console.log('ready');
});

client.on('interactionCreate', async interaction => { 
    if (interaction.isCommand()) {
		const { commandName } = interaction;

		if (commandName == "ipa") {
			const ipa = interaction.options.getString("ipa");
			const code = interaction.options.getString("speaker")
			const label = interaction.options.getString("label", false);
			await interaction.deferReply();
			const voice = _select_voice(code);
			const engines = voice["SupportedEngines"];
			console.log(voice);
			let stream;
			try {
				const data = await _polly_speech(voice["Id"], engines[engines.length-1], ipa);
				stream = data.AudioStream;
			} catch (ex) {
				console.log(ex);
				await interaction.followUp(
					{
						embeds: [
							new MessageEmbed()
							.setColor(_embed_color)
							.setTitle("音声変換に失敗しました。")
						],
					}
				);
				return;
			}
			const tmpobj = tmp.fileSync({ postfix: '.mp3' });
			if (tmpobj.err) {
				console.log(tmpobj.err);
				await interaction.followUp("tmpファイル作成に失敗しました。BOT管理者に連絡してください");
				return;
			}
			try {
				fs.writeFileSync(tmpobj.fd, stream);
				await interaction.followUp(
					{
						embeds: [
							new MessageEmbed()
							.setColor(_embed_color)
							.setTitle(label == null ? ipa : label)
						],
						files: [{ "attachment": tmpobj.name }]
					}
				);	
			} catch (ex) {
				console.log(ex);
				await interaction.followUp("mp3ファイル書き込みに失敗しました。BOT管理者に連絡してください");
				return;
			}
		}
	}
});

client.login(process.env.DISCORD_TOKEN);
