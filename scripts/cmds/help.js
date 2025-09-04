const { getPrefix } = global.utils;
const { commands, aliases } = global.GoatBot;

// ------------------- Fonts embedded directly -------------------
// Category font (bold/full-width)
const categoryFont = {
  A:"𝗔",B:"𝗕",C:"𝗖",D:"𝗗",E:"𝗘",F:"𝗙",G:"𝗚",H:"𝗛",I:"𝗜",J:"𝗝",
  K:"𝗞",L:"𝗟",M:"𝗠",N:"𝗡",O:"𝗢",P:"𝗣",Q:"𝗤",R:"𝗥",S:"𝗦",T:"𝗧",
  U:"𝗨",V:"𝗩",W:"𝗪",X:"𝗫",Y:"𝗬",Z:"𝗭",
  a:"𝗮",b:"𝗯",c:"𝗰",d:"𝗱",e:"𝗲",f:"𝗳",g:"𝗴",h:"𝗵",i:"𝗶",j:"𝗷",
  k:"𝗸",l:"𝗹",m:"𝗺",n:"𝗻",o:"𝗼",p:"𝗽",q:"𝗾",r:"𝗿",s:"𝘀",t:"𝘁",
  u:"𝘂",v:"𝘃",w:"𝘄",x:"𝘅",y:"𝘆",z:"𝘇"
};

// Command font (small caps / readable)
const commandFont = {
  A:"ᴀ",B:"ʙ",C:"ᴄ",D:"ᴅ",E:"ᴇ",F:"ғ",G:"ɢ",H:"ʜ",I:"ɪ",J:"ᴊ",
  K:"ᴋ",L:"ʟ",M:"ᴍ",N:"ɴ",O:"ᴏ",P:"ᴘ",Q:"ǫ",R:"ʀ",S:"s",T:"ᴛ",
  U:"ᴜ",V:"ᴠ",W:"ᴡ",X:"x",Y:"ʏ",Z:"ᴢ",
  a:"ᴀ",b:"ʙ",c:"ᴄ",d:"ᴅ",e:"ᴇ",f:"ғ",g:"ɢ",h:"ʜ",i:"ɪ",j:"ᴊ",
  k:"ᴋ",l:"ʟ",m:"ᴍ",n:"ɴ",o:"ᴏ",p:"ᴘ",q:"ǫ",r:"ʀ",s:"s",t:"ᴛ",
  u:"ᴜ",v:"ᴠ",w:"ᴡ",x:"x",y:"ʏ",z:"ᴢ"
};

// ------------------- Category emojis -------------------
const categoryEmojis = {
  "📛":"☣️ |","ADMIN":"🛡️ |","AI":"🤖 |","AI-IMAGE":"🖼️ |","ANIME":"😺 |",
  "AUTOMATION":"⚙️ |","BOX CHAT":"🗃️ |","CHAT":"💬 |","CONFIG":"⚙️ |","CONTACTS ADMIN":"📞 |",
  "CONVERT":"🔄 |","CUSTOM":"✨ |","DONT KNOW":"❓ |","ECONOMY":"💰 |","FIGHT":"🥊 |",
  "FUN":"😜 |","GAME":"🎮 |","GENERATOR":"⚙️ |","GROUP CHAT":"👥 |","IMAGE":"🖼️ |",
  "IMAGE GENERATOR":"🎨 |","IMAGE GENERATOR 2":"🎨 |","INFO":"ℹ️ |","INFORMATION":"📰 |",
  "ISLAMIC":"🕌 |","LOVE":"❤️ |","MEDIA":"🎞️ |","MUSIC":"🎵 |","NO PREFIX":"🚫 |",
  "OWNER":"👑 |","RANK":"🏆 |","SONG LYRICS":"🎶 |","SYSTEM":"⚙️ |","TEXT":"✍️ |",
  "TOOLS":"🛠️ |","UTILITY":"🧰 |","ECONOMY (BANK)":"🏦 |"
};

// ------------------- Command export -------------------
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

    const applyFont = (text, map) => [...text].map(ch => map[ch] || ch).join("");

    // Categorize commands
    for (const [name, cmd] of commands) {
      if (!cmd?.config || typeof cmd.onStart !== "function") continue;
      if (cmd.config.role > 1 && role < cmd.config.role) continue;
      const catName = cmd.config.category?.toUpperCase() || "UNCATEGORIZED";
      if (!categories[catName]) categories[catName] = [];
      categories[catName].push(name);
    }

    // If no arguments, list all categories with commands
    if (!args.length) {
      let msg = "━━━━━━━━━━━━━━\n";
      msg += "𝘈𝘷𝘢𝘪𝘭𝘢𝘣𝘭𝘦 𝘊𝘰𝘮𝘮𝘢𝘯𝘥𝘴:\n";

      const sortedCats = Object.keys(categories).sort();
      for (const cat of sortedCats) {
        const cmdList = categories[cat].sort((a,b) => a.localeCompare(b));
        const emojiPrefix = categoryEmojis[cat] || "";
        const styledCat = applyFont(cat, categoryFont);

        msg += "╭─╼━━━━━━━━╾─╮\n";
        msg += `│ ${styledCat}\n`;
        for (const cmdName of cmdList) {
          msg += `│ ⤜ ${applyFont(cmdName, commandFont)}\n`;
        }
        msg += "╰─━━━━━━━━━╾─╯\n";
      }

      const totalCommandCount = commands.size;
      msg += `• Use ${prefix}help <commandName> for details.\n`;
      msg += "━━━━━━━━━━━━━━\n";
      msg += `🔢 Total Commands: ${totalCommandCount}\n`;
      msg += `⚡️ Prefix: ${prefix}\n`;
      msg += `👑 Owner: ${applyFont("RaiHan", commandFont)}\n`;
      msg += "━━━━━━━━━━━━━━";

      return message.reply(msg);
    }

    // Show individual command info
    const input = args[0].toLowerCase();
    const command = commands.get(input) || commands.get(aliases.get(input));
    if (!command || !command.config) {
      return message.reply(`❌ Command or category "${input}" not found.\nUse ${prefix}help to see the full list.`);
    }

    const config = command.config;
    const usage = (config.guide?.en || "No guide available.").replace(/{pn}/g, prefix + config.name);
    const roleText = (() => {
      switch(config.role){
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
    info += `│ Author : ${applyFont("RaiHan", commandFont)}\n`;
    info += `│ Permission : ${config.role} (${roleText})\n`;
    info += `│ Cooldown : ${config.countDown || 5}s\n`;
    info += `│ Description: ${config.longDescription?.en || "No description available."}\n`;
    info += `│ Usage : ${usage}\n`;
    info += "╰─━━━━━━━━━╾─╯\n";
    info += "━━━━━━━━━━━━━━";

    return message.reply(info);
  }
};
