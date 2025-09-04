const { getPrefix } = global.utils;
const { commands, aliases } = global.GoatBot;
const fontBaseUrl = "https://raw.githubusercontent.com/Saim12678/Saim69/1a8068d7d28396dbecff28f422cb8bc9bf62d85f/font";

const categoryEmojis = {
  "📛": "☣️ |",
  "ADMIN": "🛡️ |",
  "AI": "🤖 |",
  "AI-IMAGE": "🖼️ |",
  "ANIME": "😺 |",
  "AUTOMATION": "⚙️ |",
  "BOX CHAT": "🗃️ |",
  "CHAT": "💬 |",
  "CONFIG": "⚙️ |",
  "CONTACTS ADMIN": "📞 |",
  "CONVERT": "🔄 |",
  "CUSTOM": "✨ |",
  "DONT KNOW": "❓ |",
  "ECONOMY": "💰 |",
  "FIGHT": "🥊 |",
  "FUN": "😜 |",
  "GAME": "🎮 |",
  "GENERATOR": "⚙️ |",
  "GROUP CHAT": "👥 |",
  "IMAGE": "🖼️ |",
  "IMAGE GENERATOR": "🎨 |",
  "IMAGE GENERATOR 2": "🎨 |",
  "INFO": "ℹ️ |",
  "INFORMATION": "📰 |",
  "ISLAMIC": "🕌 |",
  "LOVE": "❤️ |",
  "MEDIA": "🎞️ |",
  "MUSIC": "🎵 |",
  "NO PREFIX": "🚫 |",
  "OWNER": "👑 |",
  "RANK": "🏆 |",
  "SONG LYRICS": "🎶 |",
  "SYSTEM": "⚙️ |",
  "TEXT": "✍️ |",
  "TOOLS": "🛠️ |",
  "UTILITY": "🧰 |",
  "ECONOMY (BANK)": "🏦 |"
};

module.exports = {
  config: {
    name: "help",
    version: "2.1",
    author: "Ew’r Saim",
    countDown: 5,
    role: 0,
    shortDescription: { en: "View command usage and list all commands directly" },
    longDescription: { en: "View command usage and list all commands directly" },
    category: "info",
    guide: { en: "{pn} / help [category] or help commandName" },
    priority: 1,
  },

  onStart: async function({ message, args, event, role }) {
    const { threadID } = event;
    const prefix = getPrefix(threadID);
    const categories = {};

    let categoryFont = {}, commandFont = {};
    try {
      const [catRes, cmdRes] = await Promise.all([
        (await fetch(`${fontBaseUrl}/16.json`)).json(),
        (await fetch(`${fontBaseUrl}/20.json`)).json()
      ]);
      categoryFont = catRes;
      commandFont = cmdRes;
    } catch (e) {
      console.error(e);
    }

    const applyFont = (text, map) => [...text].map(ch => map[ch] || ch).join("");

    for (const [name, cmd] of commands) {
      if (!cmd?.config || typeof cmd.onStart !== "function") continue;
      if (cmd.config.role > 1 && role < cmd.config.role) continue;
      const catName = cmd.config.category?.toUpperCase() || "UNCATEGORIZED";
      if (!categories[catName]) categories[catName] = [];
      categories[catName].push(name);
    }

    if (!args.length) {
      let msg = "━━━━━━━━━━━━━━\n";
      msg += "𝘈𝘷𝘢𝘪𝘭𝘢𝘣𝘭𝘦 𝘊𝘰𝘮𝘮𝘢𝘯𝘥𝘴:\n";
      const sortedCats = Object.keys(categories).sort();
      for (const cat of sortedCats) {
        const cmdList = categories[cat].sort((a, b) => a.localeCompare(b));
        const emojiPrefix = categoryEmojis[cat] || "";
        const styledCat = applyFont(cat, categoryFont);
        msg += "╭─╼━━━━━━━━╾─╮\n";
        msg += `│ ${emojiPrefix} ${styledCat}\n`;
        for (const cmdName of cmdList) {
          msg += `│ ⤜ ${applyFont(cmdName, commandFont)}\n`;
        }
        msg += "╰─━━━━━━━━━╾─╯\n";
      }

      const totalCommandCount = commands.size;
      msg += `• 𝙽𝚎𝚎𝚍 𝚑𝚎𝚕𝚙 𝚠𝚒𝚝𝚑 𝚊 𝚌𝚘𝚖𝚖𝚊𝚗𝚍? 𝚄𝚜𝚎 ${prefix}help <commandName> to get full details.\n`;
      msg += "━━━━━━━━━━━━━━\n";
      msg += `🔢 Total Commands: ${totalCommandCount}\n`;
      msg += `⚡️ Prefix: ${prefix}\n`;
      msg += `👑 Owner: ${applyFont("RaiHan", commandFont)}\n`; // permanently styled RaiHan
      msg += "━━━━━━━━━━━━━━";

      return message.reply(msg);
    }

    const input = args[0].toLowerCase();
    const command = commands.get(input) || commands.get(aliases.get(input));
    if (!command || !command.config) {
      return message.reply(`❌ Command or category "${input}" not found.\nUse ${prefix}help to see the full list.`);
    }

    const config = command.config;
    const usage = (config.guide?.en || "No guide available.").replace(/{pn}/g, prefix + config.name);
    const roleText = (() => {
      switch (config.role) {
        case 0: return "All users";
        case 1: return "Group Admins";
        case 2: return "Bot Admins";
        default: return "Unknown";
      }
    })();

    let info = "━━━━━━━━━━━━━━\n";
    info += applyFont("Command Info", categoryFont) + ":\n";
    info += "╭─╼━━━━━━━━╾─╮\n";
    info += `│ Name : ${applyFont(config.name, commandFont)}\n`;
    info += `│ Category : ${config.category || "Uncategorized"}\n`;
    info += `│ Version : ${config.version || "1.0"}\n`;
    info += `│ Author : ${applyFont("RaiHan", commandFont)}\n`; // permanently styled RaiHan
    info += `│ Permission : ${config.role} (${roleText})\n`;
    info += `│ Cooldown : ${config.countDown || 5}s\n`;
    info += `│ Description: ${config.longDescription?.en || "No description available."}\n`;
    info += `│ Usage : ${usage}\n`;
    info += "╰─━━━━━━━━━╾─╯\n";
    info += "━━━━━━━━━━━━━━";

    return message.reply(info);
  },
};
