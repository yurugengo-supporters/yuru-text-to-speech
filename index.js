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
						embeds: [
							new MessageEmbed()
							.setColor(_embed_color)
							.setTitle(label == null ? ipa : label)
						],
						files: [{ "attachment": filepath}]
					}
				);
			} catch (err) {
				await interaction.followUp(
					{
						embeds: [
							new MessageEmbed()
							.setColor(_embed_color)
							.setTitle(err)
						],
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
						embeds: [
							new MessageEmbed()
							.setColor(_embed_color)
							.setTitle(label == null ? word : label)
						],
						files: [{ "attachment": filepath}]
					}
				);
			} catch (err) {
				await interaction.followUp(
					{
						embeds: [
							new MessageEmbed()
							.setColor(_embed_color)
							.setTitle(err)
						],
					}
				);
			}
		}
	}
});

client.login(process.env.DISCORD_TOKEN);
