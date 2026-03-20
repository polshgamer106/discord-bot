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
  AudioPlayerStatus
} = require('@discordjs/voice');

const play = require('play-dl');
const ytSearch = require('@distube/yt-search');

// 🔧 KONFIGURACJA
const TOKEN = process.env.TOKEN;
const CLIENT_ID = '1484585251408842852';
const GUILD_ID = '1476998304624672810';

// 🔧 KLIENT
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildVoiceStates
  ]
});

// 🔧 KOMENDY
const commands = [
  new SlashCommandBuilder()
    .setName('play')
    .setDescription('Odtwarza muzykę')
    .addStringOption(option =>
      option.setName('query')
        .setDescription('Nazwa piosenki lub link')
        .setRequired(true)
    )
].map(cmd => cmd.toJSON());

// 🔧 REJESTRACJA KOMEND
const rest = new REST({ version: '10' }).setToken(TOKEN);

client.once('ready', async () => {
  console.log(`Bot zalogowany jako ${client.user.tag}`);

  try {
    await rest.put(
      Routes.applicationGuildCommands(CLIENT_ID, GUILD_ID),
      { body: commands }
    );

    console.log('Komendy zostały zarejestrowane');
  } catch (err) {
    console.error('Błąd rejestracji komend:', err);
  }
});

// 🔧 PLAY
client.on('interactionCreate', async interaction => {
  if (!interaction.isChatInputCommand()) return;

  if (interaction.commandName === 'play') {
    const query = interaction.options.getString('query');

    const voiceChannel = interaction.member.voice.channel;

    if (!voiceChannel) {
      return interaction.reply({
        content: 'Musisz być na kanale głosowym',
        ephemeral: true
      });
    }

    await interaction.reply('🔎 Szukam...');

    try {
      const result = await ytSearch(query);
      const video = result.videos[0];

      if (!video) {
        return interaction.followUp('❌ Nie znaleziono');
      }

      const stream = await play.stream(video.url);

      const player = createAudioPlayer();

      const connection = joinVoiceChannel({
        channelId: voiceChannel.id,
        guildId: interaction.guild.id,
        adapterCreator: interaction.guild.voiceAdapterCreator
      });

      const resource = createAudioResource(stream.stream, {
        inputType: stream.type
      });

      player.play(resource);
      connection.subscribe(player);

      player.on(AudioPlayerStatus.Idle, () => {
        connection.destroy();
      });

      await interaction.followUp(`▶️ Teraz gra: **${video.title}**`);
    } catch (err) {
      console.error(err);
      await interaction.followUp('❌ Błąd podczas odtwarzania');
    }
  }
});

// 🔧 START
client.login(TOKEN);
