const express = require('express');
const { Client, GatewayIntentBits, SlashCommandBuilder, EmbedBuilder, Partials } = require('discord.js');
require('dotenv').config();

// ───── Serwer Express dla Render.com ─────
const app = express();
app.get('/', (req, res) => res.send('Bot działa ✅'));
app.listen(process.env.PORT || 3000, () => console.log('🌐 Serwer Express aktywny'));

// ───── Konfiguracja klienta Discord ─────
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.GuildMembers
  ],
  partials: [Partials.Channel],
});

// ───── Logowanie bota ─────
client.once('ready', async () => {
  console.log(`✅ Zalogowano jako ${client.user.tag}`);

  // ───── Rejestracja komendy /blacklista ─────
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

  const guildId = process.env.GUILD_ID;
  try {
    await client.application.commands.set([data], guildId);
    console.log('✅ Komenda /blacklista zarejestrowana w guild');
  } catch (err) {
    console.error('❌ Błąd przy rejestracji komendy:', err);
  }
});

// ───── Obsługa komendy /blacklista ─────
client.on('interactionCreate', async (interaction) => {
  if (!interaction.isChatInputCommand()) return;
  if (interaction.commandName !== 'blacklista') return;

  const ownerRoleId = process.env.OWNER_ROLE_ID;
  const member = interaction.member;

  // Sprawdzenie roli ownera
  if (!member.roles.cache.has(ownerRoleId)) {
    return interaction.reply({ content: '⛔ Nie masz uprawnień do użycia tej komendy.', flags: 64 });
  }

  const target = interaction.options.getUser('uzytkownik');
  const reason = interaction.options.getString('powod');

  if (!target) {
    return interaction.reply({ content: '❌ Nie znaleziono użytkownika.', flags: 64 });
  }

  // Embed
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

  try {
    // Defer — żeby uniknąć timeoutu Discorda
    await interaction.deferReply({ ephemeral: false });

    // Bezpieczne usunięcie wiadomości z / (bez crasha)
    try {
      await interaction.deleteReply();
    } catch (err) {
      console.warn('⚠️ Nie udało się usunąć wiadomości slash:', err.message);
    }

    // Wysłanie embedu publicznie
    await interaction.channel.send({ embeds: [embed] });

  } catch (error) {
    console.error('❌ Błąd przy wysyłaniu embed:', error);
  }
});

// ───── Logowanie bota ─────
client.login(process.env.TOKEN);
// ───── Keep-alive ping (Render fix) ─────
setInterval(() => {
  const http = require('http');
  const url = `http://localhost:${process.env.PORT || 3000}`;
  http.get(url, res => {
    console.log(`🔁 Keep-alive ping: ${res.statusCode}`);
  }).on('error', err => {
    console.warn('⚠️ Keep-alive ping error:', err.message);
  });
}, 4 * 60 * 1000); // co 4 minuty
