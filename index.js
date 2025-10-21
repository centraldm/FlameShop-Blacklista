const { Client, GatewayIntentBits, SlashCommandBuilder, EmbedBuilder, Partials } = require('discord.js');
require('dotenv').config(); // ← wczytuje zmienne z pliku .env (lokalnie)

const client = new Client({
  intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages],
  partials: [Partials.Channel],
});

client.once('ready', () => {
  console.log(`✅ Zalogowano jako ${client.user.tag}`);
});

// Rejestracja komendy /blacklista
client.on('ready', async () => {
  const data = new SlashCommandBuilder()
    .setName('blacklista')
    .setDescription('Dodaje użytkownika do blacklisty (dostęp tylko dla ownera)')
    .addUserOption(option =>
      option.setName('uzytkownik')
        .setDescription('Użytkownik do zblacklistowania')
        .setRequired(true))
    .addStringOption(option =>
      option.setName('powod')
        .setDescription('Powód dodania do blacklisty')
        .setRequired(true));

  await client.application.commands.set([data]);
});

// Obsługa komendy
client.on('interactionCreate', async (interaction) => {
  if (!interaction.isChatInputCommand()) return;
  if (interaction.commandName !== 'blacklista') return;

  const member = interaction.member;
  const ownerRole = member.roles.cache.find(r => r.name.toLowerCase() === 'owner');
  if (!ownerRole) {
    return interaction.reply({ content: '⛔ Nie masz uprawnień do użycia tej komendy.', ephemeral: true });
  }

  const target = interaction.options.getUser('uzytkownik');
  const reason = interaction.options.getString('powod');

  await interaction.deferReply({ ephemeral: true });
  await interaction.deleteReply();

  const embed = new EmbedBuilder()
    .setTitle('🏴 𝐅𝐋𝐀𝐌𝐄 𝐒𝐇✠𝐏 × BLACKLISTA')
    .setColor('Orange')
    .setThumbnail(target.displayAvatarURL({ dynamic: true }))
    .setDescription(
      `**NICK:** <@${target.id}>\n` +
      `**ID:** ${target.id}\n\n` +
      `**POWÓD:** ${reason}\n\n` +
      `Wystawione przez: **${interaction.user.username}**`
    )
    .setTimestamp();

  await interaction.channel.send({ embeds: [embed] });
});

client.login(process.env.TOKEN);
