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

    try {
      const result = await play.search(query, { limit: 1 });

      if (!result.length) {
        return interaction.followUp('Nie znaleziono');
      }

      const video = result[0];

      // 🔴 FIX: zabezpieczenie streamu
      const stream = await play.stream(video.url, {
        discordPlayerCompatibility: true
      });

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

    } catch (error) {
      console.error(error);
      await interaction.followUp('❌ Błąd podczas odtwarzania');
    }
  }
});

client.login(TOKEN);
