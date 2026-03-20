const { 
  Client, 
  GatewayIntentBits, 
  REST, 
  Routes, 
  SlashCommandBuilder 
} = require('discord.js');

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent
  ]
});

// 🔧 WSTAW SWOJE ID SERWERA
const GUILD_ID = '1476998304624672810';

// XP (tymczasowe)
const xp = {};
const levels = {};

// poziom
function getLevel(userXp) {
  return Math.floor(0.1 * Math.sqrt(userXp));
}

// komendy
const commands = [
  new SlashCommandBuilder()
    .setName('ping')
    .setDescription('Sprawdza czy bot działa'),

  new SlashCommandBuilder()
    .setName('level')
    .setDescription('Sprawdza twój poziom')
].map(cmd => cmd.toJSON());

const rest = new REST({ version: '10' }).setToken(process.env.TOKEN);

client.once('ready', async () => {
  console.log('Bot działa');

  try {
    // ❗ NAJWAŻNIEJSZE — tylko komendy serwerowe
    await rest.put(
      Routes.applicationGuildCommands(client.user.id, GUILD_ID),
      { body: commands }
    );

  } catch (error) {
    console.error(error);
  }
});

// XP za wiadomości
client.on('messageCreate', message => {
  if (message.author.bot) return;

  const userId = message.author.id;

  if (!xp[userId]) xp[userId] = 0;

  xp[userId] += 5;

  const newLevel = getLevel(xp[userId]);

  if (levels[userId] !== newLevel) {
    levels[userId] = newLevel;
    message.channel.send(`${message.author} awansował na poziom ${newLevel}!`);
  }
});

// komendy
client.on('interactionCreate', async interaction => {
  if (!interaction.isChatInputCommand()) return;

  if (interaction.commandName === 'ping') {
    await interaction.reply('Pong!');
  }

  if (interaction.commandName === 'level') {
    const userId = interaction.user.id;
    const userXp = xp[userId] || 0;
    const userLevel = getLevel(userXp);

    await interaction.reply(`Masz ${userXp} XP i poziom ${userLevel}`);
  }
});

client.login(process.env.TOKEN);
