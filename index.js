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

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent
  ]
});

// 🔧 WSTAW ID SERWERA
const GUILD_ID = '1476998304624672810';

// XP (proste, tymczasowe)
const xp = {};
const levels = {};

function getLevel(userXp) {
  return Math.floor(0.1 * Math.sqrt(userXp));
}

// KOMENDY
const commands = [
  new SlashCommandBuilder()
    .setName('ping')
    .setDescription('Sprawdza czy bot działa'),

  new SlashCommandBuilder()
    .setName('level')
    .setDescription('Sprawdza poziom'),

  new SlashCommandBuilder()
    .setName('play')
    .setDescription('Odtwarza muzykę')
    .addStringOption(option =>
      option.setName('query')
        .setDescription('Nazwa piosenki')
        .setRequired(true)
    )
].map(cmd => cmd.toJSON());

const rest = new REST({ version: '10' }).setToken(process.env.TOKEN);

// READY
client.once('ready', async () => {
  console.log('Bot działa');

  try {
    // usuń globalne komendy (żeby nie było duplikatów)
    await rest.put(
      Routes.applicationCommands(client.user.id),
      { body: [] }
    );

    // ustaw komendy tylko na serwerze
    await rest.put(
      Routes.applicationGuildCommands(client.user.id, GUILD_ID),
      { body: commands }
    );

  } catch (error) {
    console.error(error);
  }
});

// XP SYSTEM
client.on('messageCreate', message => {
  if (message.author.bot) return;

  const userId = message.author.id;

  if (!xp[userId]) xp[userId] = 0;

  xp[userId] += 5;

  const newLevel = getLevel(xp[userId]);

  if (levels[userId] !== newLevel) {
    levels[userId] = newLevel;
    message.channel.send(`${message.author} awansował na poziom ${newLevel}`);
  }
});

// KOMENDY
client.on('interactionCreate', async interaction => {
  if (!interaction.isChatInputCommand()) return;

  // PING
  if (interaction.commandName === 'ping') {
    await interaction.reply('Pong!');
  }

  // LEVEL
  if (interaction.commandName === 'level') {
    const userId = interaction.user.id;
    const userXp = xp[userId] || 0;
    const userLevel = getLevel(userXp);

    await interaction.reply(`XP: ${userXp}, poziom: ${userLevel}`);
  }

  // MUZYKA
  if (interaction.commandName === 'play') {
    const query = interaction.options.getString('query');

    const voiceChannel = interaction.member.voice.channel;

    if (!voiceChannel) {
      return interaction.reply('Wejdź na kanał głosowy');
    }

    await interaction.reply('Szukam...');

    let result = await ytSearch(query);
    let video = result.videos[0];

    if (!video) {
      return interaction.followUp('Nie znaleziono utworu');
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

client.login(process.env.TOKEN);
