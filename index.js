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
  createAudioResource
} = require('@discordjs/voice');

const play = require('play-dl');
const ytSearch = require('@distube/yt-search');

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
        .setDescription('Nazwa piosenki')
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

    await interaction.reply('Szukam...');

    const result = await ytSearch(query);
    const video = result.videos[0];

    if (!video) {
      return interaction.followUp('Nie znaleziono');
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

    await interaction.followUp(`▶️ Gram: ${video.title}`);
  }
});

client.login(TOKEN);
