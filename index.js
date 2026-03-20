const ffmpegPath = require('ffmpeg-static');
process.env.FFMPEG_PATH = ffmpegPath;

const {
  Client,
  GatewayIntentBits,
  REST,
  Routes,
  SlashCommandBuilder
} = require('discord.js');

const {
  joinVoiceChannel,
  createAudioPlayer,
  createAudioResource,
  AudioPlayerStatus,
  NoSubscriberBehavior
} = require('@discordjs/voice');

const ytdl = require('@distube/ytdl-core');

// 🔧 UZUPEŁNIJ
const TOKEN = process.env.TOKEN;
const CLIENT_ID = '1484585251408842852';
const GUILD_ID = '1476998304624672810';

const client = new Client({
  intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildVoiceStates]
});

// KOMENDY
const commands = [
  new SlashCommandBuilder()
    .setName('play')
    .setDescription('Odtwarza muzykę')
    .addStringOption(option =>
      option.setName('query')
        .setDescription('Link YouTube')
        .setRequired(true)
    )
].map(cmd => cmd.toJSON());

// REJESTRACJA
const rest = new REST({ version: '10' }).setToken(TOKEN);

client.once('ready', async () => {
  console.log('Bot działa');

  await rest.put(
    Routes.applicationGuildCommands(CLIENT_ID, GUILD_ID),
    { body: commands }
  );
});

// PLAY
client.on('interactionCreate', async interaction => {
  if (!interaction.isChatInputCommand()) return;

  if (interaction.commandName === 'play') {
    const query = interaction.options.getString('query');

    const voiceChannel = interaction.member.voice.channel;

    if (!voiceChannel) {
      return interaction.reply('Wejdź na kanał głosowy');
    }

    await interaction.reply('Łączę...');

    try {
      const url = query;

      if (!ytdl.validateURL(url)) {
        return interaction.followUp('Podaj poprawny link YouTube');
      }

      const connection = joinVoiceChannel({
        channelId: voiceChannel.id,
        guildId: interaction.guild.id,
        adapterCreator: interaction.guild.voiceAdapterCreator
      });

      const stream = ytdl(url, {
        filter: 'audioonly',
        highWaterMark: 1 << 25
      });

      // 🔴 POPRAWKA: BEZ StreamType.Arbitrary
      const resource = createAudioResource(stream);

      const player = createAudioPlayer({
        behaviors: {
          noSubscriber: NoSubscriberBehavior.Play
        }
      });

      connection.subscribe(player);
      player.play(resource);

      player.on(AudioPlayerStatus.Idle, () => {
        console.log('Koniec utworu');
        connection.destroy();
      });

      player.on('error', error => {
        console.error('PLAYER ERROR:', error);
        connection.destroy();
      });

      await interaction.followUp('▶️ Odtwarzam muzykę');

    } catch (error) {
      console.error('BŁĄD:', error);
      await interaction.followUp(`❌ Błąd: ${error.message}`);
    }
  }
});

client.login(TOKEN);
