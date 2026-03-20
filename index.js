const { REST, Routes } = require('discord.js');

const rest = new REST({ version: '10' }).setToken(process.env.TOKEN);

(async () => {
  try {
    console.log('Usuwanie komend...');

    await rest.put(
      Routes.applicationCommands('1484585251408842852'),
      { body: [] }
    );

    console.log('Usunięto globalne komendy.');
  } catch (error) {
    console.error(error);
  }
})();
