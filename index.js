require('dotenv').config();
const aws = require('aws-sdk');
const fs = require('fs');
const tmp = require("tmp");
const { Client, Intents, MessageEmbed  } = require('discord.js');

const client = new Client({ intents: [Intents.FLAGS.GUILDS] });

client.once('ready', () => {
    console.log('ready');
});

const _command_ipa = async (interaction) => {
    const ipa = interaction.options.getString("ipa_text");
    const label = interaction.options.getString("label_text", false);
    await interaction.deferReply();
    let polly = new aws.Polly({ apiVersion: '2016-06-10', region: 'us-east-1'});
    let speechParams = {
        OutputFormat: 'mp3',
        VoiceId: "Joanna",
        Text: "<phoneme alphabet='ipa' ph='" + ipa + "'></phoneme>",
        SampleRate: '22050',
        TextType: 'ssml'
    };
    await polly.synthesizeSpeech(speechParams).promise().then(data => {
        tmp.file( {  postfix: '.mp3' },async (err, name, fd, cleanupCallback) => {
            if (err) {
                console.log(err);
                await interaction.editReply("tmpファイル作成に失敗しました。BOT管理者に連絡してください");
                return;
            }
            fs.writeFile(fd, data.AudioStream,async  (err) => {
                if (err) {
                    console.log(err);
                    await interaction.editReply("mp3ファイル書き込みに失敗しました。BOT管理者に連絡してください");
                    return;
                }
                const embed = new MessageEmbed()
                    .setColor('#d000e0')
                    .setTitle(label == null ? ipa : label);
                await interaction.editReply(
                    {
                        embeds: [embed],
                        files: [{ "attachment": name }]
                    }
                );
            });
        });
    }).catch(async err => {
        console.log(err);
        const embed = new MessageEmbed()
            .setColor('#d000e0')
            .setTitle("音声変換に失敗しました。正しいIPA表記で入力してください");
        await interaction.editReply({ embeds: [embed]});
	});
};

client.on('interactionCreate', async interaction => { 
    if (!interaction.isCommand()) return;

    const { commandName } = interaction;

    if (commandName === 'ipa') {
        await _command_ipa(interaction);
    }
});

client.login(process.env.DISCORD_TOKEN);
