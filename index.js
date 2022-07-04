require('dotenv').config();
const aws = require('aws-sdk');
const fs = require('fs');
const tmp = require("tmp");
const { Client, Intents, MessageEmbed   } = require('discord.js');
const client = new Client({ intents: [Intents.FLAGS.GUILDS] });
const discordModals = require('discord-modals');
const { Modal, TextInputComponent, SelectMenuComponent,showModal  } = discordModals; 

discordModals(client);

const _embed_color='#d000e0';
const _modal_id='modal-customid';
let _mymodal=null;
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

const _create_options = (voices)=>{
	let arr= voices.map(_ => {
		return {
			label: _["LanguageName"],
			value: _["Id"],
		};
	});
	return arr;
};
client.once('ready', async () => {
	console.log('describeVoices');
	const data = await _polly_describeVoices();
	_voices = data["Voices"];
	const codes = Array.from(new Set( _voices.map(_ => _["LanguageCode"])));
	const voices = codes.map(code=> _voices.find(_ => _["LanguageCode"] == code));
	const options_en = _create_options(voices.filter(_=>_["LanguageCode"].startsWith("en-")));
	const options_other = _create_options(voices.filter(_=>!_["LanguageCode"].startsWith("en-")));	
	options_en.unshift({
		label:"英語はここで選択",
		value:"*",
		default:true,
	});
	options_other.unshift({
		label:"英語以外はここで選択",
		value:"*",
		default:true,
	});
	const txtIpa=new TextInputComponent() 
		.setCustomId('ipa')
		.setLabel('IPA文字列')
		.setStyle('SHORT') 
		.setRequired(true);
	const cmbWasha_en=new SelectMenuComponent() 
		.setCustomId('washa_en')
		.addOptions(options_en.slice(0,25));
	const cmbWasha_other=new SelectMenuComponent() 
		.setCustomId('washa_other')
		.addOptions(options_other.slice(0,25));
	const txtMemo=new TextInputComponent() 
		.setCustomId('memo')
		.setLabel('説明や要約')
		.setStyle('SHORT')
		.setRequired(false);
	_mymodal = new Modal()
		.setCustomId(_modal_id)
		.setTitle('Yuru-Text-To-Speech')
		.addComponents(txtIpa, cmbWasha_en, cmbWasha_other, txtMemo);
    console.log('ready');
});

client.on('interactionCreate', async interaction => { 
    if (interaction.isCommand()) {
		const { commandName } = interaction;

		if (commandName == "ipa") {
			await showModal(_mymodal, {client:client, interaction:interaction});
		}
	}
});

client.on("modalSubmit", async(modal)=>{
	if(modal.customId === _modal_id) {
		await modal.deferReply();
		const ipa = modal.getTextInputValue('ipa');
		const washa_en = modal.getSelectMenuValues('washa_en')[0];
		const washa_other = modal.getSelectMenuValues('washa_other')[0];
		const memo = modal.getTextInputValue("memo");
		if (washa_en == "*" && washa_other == "*") {
			await modal.followUp(
				{
					embeds: [
						new MessageEmbed()
						.setColor(_embed_color)
						.setTitle("話者が選択されていません。")
					],
				}
			);
			return;
		}
		let washa = washa_en;
		if (washa_other != "*") {
			washa = washa_other;
		}
		const voice = _voices.find(_=> _["Id"] == washa);
		if (voice == undefined) {
			await modal.followUp(
				{
					embeds: [
						new MessageEmbed()
						.setColor(_embed_color)
						.setTitle("無効な話者です。")
					],
				}
			);
			return;
		}
		console.log(voice);
		const engine = voice["SupportedEngines"][0];
		let stream;
		try {
			const data = await _polly_speech(washa, engine, ipa);
			stream = data.AudioStream;
		} catch (ex) {
			console.log(ex);
			await modal.followUp(
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
		const tmpobj = tmp.fileSync({  postfix: '.mp3' });
		if (tmpobj.err) {
			console.log(tmpobj.err);
			await modal.followUp("tmpファイル作成に失敗しました。BOT管理者に連絡してください");
			return;
		}
		try {
			fs.writeFileSync(tmpobj.fd, stream);
			await modal.followUp(
				{
					embeds: [
						new MessageEmbed()
						.setColor(_embed_color)
						.setTitle(memo == null ? ipa : memo)
					],
					files: [{ "attachment": tmpobj.name }]
				}
			);	
		} catch (ex) {
			console.log(ex);
			await modal.followUp("mp3ファイル書き込みに失敗しました。BOT管理者に連絡してください");
			return;
		}
	}
});

client.login(process.env.DISCORD_TOKEN_DEV);
