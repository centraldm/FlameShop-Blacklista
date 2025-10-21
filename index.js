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
    GatewayIntentBits.GuildMembers // potrzebne do sprawdzania ról
  ],
  partials: [Partials.Channel],
});

// ───── Logowanie bota ─────
client.once('ready', async () => {
  console.log(`✅ Zalogowano jako ${client.user.tag}`);

  // ───── Rejestracja komendy guild (działa natychmiast) ─────
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

  const guildId = process.env.GUILD_ID; // ID Twojego serwera z .env
  try {
    await client.application.commands.set([data], guildId);
    console.log('✅ Komenda /blacklista zarejestrowana w guild');
  } catch (err) {
    console.error('❌ Błąd przy rejestracji komendy:', err);
  }
});

// ───── Obsługa komendy slash ─────
client.on('interactionCreate', async (interaction) => {
  console.log('🔥 Interaction received'); // debug
  if (!interaction.isChatInputCommand()) return;
  console.log('✅ Slash command received:', interaction.commandName);

  if (interaction.commandName !== 'blacklista') return;

  const ownerRoleId = process.env.OWNER_ROLE_ID; // ID roli ownera z .env
  const member = interaction.member;

  // Sprawdzenie uprawnień po ID roli
  if (!member.roles.cache.has(ownerRoleId)) {
    return interaction.reply({ content: '⛔ Nie masz uprawnień do użycia tej komendy.', flags: 64 }); // ephemeral
  }

  const target = interaction.options.getUser('uzytkownik');
  const reason = interaction.options.getString('powod');

  if (!target) {
    return interaction.reply({ content: '❌ Nie znaleziono użytkownika.', flags: 64 });
  }

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
    // 🔹 Deferujemy odpowiedź (ale nie ephemeral)
    await interaction.deferReply({ ephemeral: false });

    // 🔹 Usuwamy automatyczną odpowiedź slash command
    await interaction.deleteReply();

    // 🔹 Wysyłamy embed do kanału
    await interaction.channel.send({ embeds: [embed] });
  } catch (error) {
    console.error('❌ Błąd przy wysyłaniu embed:', error);
  }
});

// ───── Logowanie bota na token z .env ─────
client.login(process.env.TOKEN);
