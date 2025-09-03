const LIMIT_INTERVAL_HOURS = 12;
const MAX_PLAYS = 20;
const MAX_BET = 6_000_000;

// Function to convert numbers to fancy superscript
function toFancyNumber(num) {
  const superscripts = ['⁰', '¹', '²', '³', '⁴', '⁵', '⁶', '⁷', '⁸', '⁹'];
  return num.toString().split('').map(digit => 
    superscripts[parseInt(digit)] || digit
  ).join('');
}

// Function to format numbers with commas and superscript
function formatFancyNumber(num) {
  return toFancyNumber(num.toLocaleString());
}

module.exports = {
  config: {
    name: "wheel",
    version: "4.2",
    author: "xnil6x",
    shortDescription: "🎡 Ultimate Wheel Game Experience",
    longDescription: "Spin the wheel with enhanced visuals, daily bonuses, achievements, and multiplayer features!",
    category: "game",
    guide: {
      en: "{p}wheel <bet amount> | {p}wheel stats | {p}wheel leaderboard | {p}wheel daily"
    }
  },

  onStart: async function ({ api, event, args, usersData }) {
    const { senderID, threadID, messageID } = event;
    const command = args[0]?.toLowerCase();

    // Check for subcommands
    if (!command || command === 'stats') {
      return await showStats(api, event, usersData);
    }
    
    if (command === 'leaderboard') {
      return await showLeaderboard(api, event, usersData);
    }
    
    if (command === 'daily') {
      return await claimDailyBonus(api, event, usersData);
    }

    // Original wheel spin functionality
    if (!args[0]) {
      return api.sendMessage(
        `❌ Please enter your bet amount. Example: wheel 10000\n\nOther commands:\n• wheel stats - Show your statistics\n• wheel leaderboard - Show top players\n• wheel daily - Claim daily bonus`, 
        threadID, messageID
      );
    }

    const bet = parseInt(args[0].replace(/\D/g, ''));
    if (isNaN(bet) || bet <= 0) {
      return api.sendMessage("❌ Invalid bet amount. Please enter a valid number.", threadID, messageID);
    }

    if (bet > MAX_BET) {
      return api.sendMessage(`❌ Maximum bet is ${MAX_BET.toLocaleString()}.`, threadID, messageID);
    }

    // Load user data
    const user = await usersData.get(senderID);
    const userData = user.data || {};
    const now = Date.now();
    const lastSpins = userData.lastWheelTimes || [];

    // Filter old spins
    const validSpins = lastSpins.filter(time => now - time < LIMIT_INTERVAL_HOURS * 3600 * 1000);

    if (validSpins.length >= MAX_PLAYS) {
      return api.sendMessage(
        `⛔ You've used all ${MAX_PLAYS} spins in the last ${LIMIT_INTERVAL_HOURS} hours.`,
        threadID, messageID
      );
    }

    if (user.money < bet) {
      return api.sendMessage(
        `❌ You need ${(bet - user.money).toLocaleString()} more to bet ${bet.toLocaleString()}.`,
        threadID, messageID
      );
    }

    // Check for lucky hour bonus (random 2-hour window with 1.5x multiplier)
    const LUCKY_HOUR_START = 18; // 6 PM
    const isLuckyHour = new Date().getHours() >= LUCKY_HOUR_START && 
                        new Date().getHours() < LUCKY_HOUR_START + 2;
    
    // Check for consecutive day bonus
    const lastPlayDate = userData.lastPlayDate ? new Date(userData.lastPlayDate) : null;
    const today = new Date().toDateString();
    const consecutiveDays = lastPlayDate && lastPlayDate.toDateString() === today ? 
                            userData.consecutiveDays || 0 : 
                            (lastPlayDate && (new Date() - lastPlayDate) < 86400000 * 2 ? 
                            userData.consecutiveDays || 0 : 0);
    
    // Deduct bet and update spin log
    const updatedMoney = user.money - bet;
    validSpins.push(now);
    
    const updateData = {
      money: updatedMoney,
      data: {
        ...userData,
        lastWheelTimes: validSpins,
        lastPlayDate: now,
        consecutiveDays: lastPlayDate && (new Date() - lastPlayDate) < 86400000 * 2 ? 
                         consecutiveDays + 1 : 1
      }
    };

    await usersData.set(senderID, updateData);

    // Wheel segments with enhanced visuals
    const wheelSegments = [
      { label: "💥 ᴊᴀᴄᴋᴘᴏᴛ x10", multiplier: 10, probability: 0.05, color: "#FFD700" },
      { label: "🎉 ʙɪɢ ᴡɪɴ x5", multiplier: 5, probability: 0.1, color: "#FF6347" },
      { label: "🔥 ᴡɪɴ x3", multiplier: 3, probability: 0.15, color: "#FF4500" },
      { label: "👍 ᴡɪɴ x2", multiplier: 2, probability: 0.2, color: "#32CD32" },
      { label: "✨ sᴍᴀʟʟ ᴡɪɴ x1.5", multiplier: 1.5, probability: 0.2, color: "#1E90FF" },
      { label: "😐 ɴᴏ ᴡɪɴ x0", multiplier: 0, probability: 0.15, color: "#A9A9A9" },
      { label: "😞 ʟᴏsᴇ ʜᴀʟғ", multiplier: -0.5, probability: 0.1, color: "#696969" },
      { label: "💸 ʙᴀɴᴋʀᴜᴘᴛ", multiplier: -1, probability: 0.05, color: "#8B0000" }
    ];

    // Send initial spinning message
    let spinningMsg;
    try {
      spinningMsg = await api.sendMessage("🎡 | Preparing wheel...", threadID);
    } catch (e) {
      console.error("Initial message failed:", e);
      return;
    }

    // Simulate spinning with minimal edits
    const spinMessages = [
      "🎡 | Spinning /",
      "🪅 | Spinning -",
      "🕹️ | Spinning ^_^",
      "🪄 | Spinning 🎆"
    ];
    
    for (let i = 0; i < 4; i++) {
      await new Promise(resolve => setTimeout(resolve, 400));
      try {
        await api.editMessage(spinMessages[i], spinningMsg.messageID);
      } catch (e) {
        console.error("Edit error during spin:", e);
      }
    }

    await new Promise(resolve => setTimeout(resolve, 800));

    // Result logic with consecutive day and lucky hour bonuses
    const random = Math.random();
    let cumulativeProb = 0;
    let result;

    for (const segment of wheelSegments) {
      cumulativeProb += segment.probability;
      if (random < cumulativeProb) {
        result = segment;
        break;
      }
    }

    // Apply consecutive day bonus (up to 20% for 7+ days)
    const consecutiveBonus = Math.min(consecutiveDays, 7) * 0.03;
    
    // Apply lucky hour bonus if applicable
    const luckyBonus = isLuckyHour ? 0.5 : 0;
    
    // Calculate final multiplier with bonuses
    let finalMultiplier = result.multiplier;
    if (finalMultiplier > 0) {
      finalMultiplier += consecutiveBonus + luckyBonus;
    }

    const winnings = Math.floor(bet * finalMultiplier);
    let finalMoney = updatedMoney;

    if (winnings > 0) {
      finalMoney += winnings;
      // Update achievements
      const bigWinCount = userData.bigWins || 0;
      if (finalMultiplier >= 5) {
        updateData.data.bigWins = bigWinCount + 1;
      }
      
      // Update total winnings
      updateData.data.totalWinnings = (userData.totalWinnings || 0) + winnings;
    } else if (winnings < 0) {
      // Handle losses with negative multipliers
      finalMoney -= Math.abs(winnings);
    }

    // Update user data with new balance and stats
    updateData.money = finalMoney;
    updateData.data.totalSpins = (userData.totalSpins || 0) + 1;
    
    await usersData.set(senderID, updateData);

    // Build result message with fancy font
    const resultMsg = [
      `🎡 ━━ ғɪɴᴀʟ ʀᴇsᴜʟᴛ ━━ 🎡`,
      ``,
      `▢ ${result.label.replace(/\d/g, d => toFancyNumber(parseInt(d)))}`,
      `▢ ʏᴏᴜʀ ʙᴇᴛ: ${formatFancyNumber(bet)}`,
      winnings > 0 
        ? `▢ 🎉 ʏᴏᴜ ᴡᴏɴ: +${formatFancyNumber(winnings)}`
        : winnings < 0
          ? `▢ 💸 ʏᴏᴜ ʟᴏsᴛ: ${formatFancyNumber(Math.abs(winnings))}`
          : `▢ 😔 ɴᴏ ᴡɪɴɴɪɴɢs`,
      ``,
      `▢ ɴᴇᴡ ʙᴀʟᴀɴᴄᴇ: ${formatFancyNumber(finalMoney)}`,
      `▢ sᴘɪɴs ᴜsᴇᴅ: ${formatFancyNumber(validSpins.length)}/${formatFancyNumber(MAX_PLAYS)}`,
      consecutiveBonus > 0 ? `▢ ᴄᴏɴsᴇᴄᴜᴛɪᴠᴇ ᴅᴀʏ ʙᴏɴᴜs: +${formatFancyNumber(Math.round(consecutiveBonus * 100))}%` : '',
      isLuckyHour ? `▢ 🍀 ʟᴜᴄᴋʏ ʜᴏᴜʀ ʙᴏɴᴜs: +50%` : '',
      ``,
      `💎 ᴄᴏɴsᴇᴄᴜᴛɪᴠᴇ ᴅᴀʏs: ${formatFancyNumber(consecutiveDays)} | ʙɪɢ ᴡɪɴs: ${formatFancyNumber(updateData.data.bigWins || 0)}`
    ].filter(line => line !== '').join("\n");

    try {
      await api.editMessage(resultMsg, spinningMsg.messageID);
      
      // Special effects for big wins
      if (finalMultiplier >= 5) {
        await new Promise(resolve => setTimeout(resolve, 1000));
        await api.sendMessage("🎊 ᴄᴏɴɢʀᴀᴛᴜʟᴀᴛɪᴏɴs ᴏɴ ʏᴏᴜʀ ʙɪɢ ᴡɪɴ! 🎊", threadID);
        
        if (finalMultiplier >= 10) {
          await new Promise(resolve => setTimeout(resolve, 1500));
          await api.sendMessage("🏆 ᴊᴀᴄᴋᴘᴏᴛ ᴡɪɴɴᴇʀ! 🏆", threadID);
        }
      }
    } catch (e) {
      console.error("Final edit failed:", e);
      await api.sendMessage(resultMsg, threadID);
    }
  }
};

// Helper function to show user statistics
async function showStats(api, event, usersData) {
  const { senderID, threadID } = event;
  const user = await usersData.get(senderID);
  const userData = user.data || {};
  
  function toFancyNumber(num) {
    const superscripts = ['⁰', '¹', '²', '³', '⁴', '⁵', '⁶', '⁷', '⁸', '⁹'];
    return num.toString().split('').map(digit => 
      superscripts[parseInt(digit)] || digit
    ).join('');
  }
  
  function formatFancyNumber(num) {
    return toFancyNumber(num.toLocaleString());
  }
  
  const statsMessage = [
    "🎡 ━━━ ʏᴏᴜʀ sᴛᴀᴛs ━━━ 🎡",
    ``,
    `▢ ᴛᴏᴛᴀʟ sᴘɪɴs: ${formatFancyNumber(userData.totalSpins || 0)}`,
    `▢ ʙɪɢ ᴡɪɴs (5x+): ${formatFancyNumber(userData.bigWins || 0)}`,
    `▢ ᴊᴀᴄᴋᴘᴏᴛs: ${formatFancyNumber(userData.jackpots || 0)}`,
    `▢ ᴛᴏᴛᴀʟ ᴡɪɴɴɪɴɢs: ${formatFancyNumber(userData.totalWinnings || 0)}`,
    `▢ ᴄᴜʀʀᴇɴᴛ ʙᴀʟᴀɴᴄᴇ: ${formatFancyNumber(user.money)}`,
    `▢ ᴄᴏɴsᴇᴄᴜᴛɪᴠᴇ ᴅᴀʏs: ${formatFancyNumber(userData.consecutiveDays || 0)}`,
    "",
    "💡 ᴛɪᴘ: Play during lucky hours (6PM-8PM) for bonus rewards!"
  ].join("\n");
  
  return api.sendMessage(statsMessage, threadID);
}

// Helper function to show leaderboard
async function showLeaderboard(api, event, usersData) {
  const { threadID } = event;
  const allUsers = await usersData.getAll();
  
  function toFancyNumber(num) {
    const superscripts = ['⁰', '¹', '²', '³', '⁴', '⁵', '⁶', '⁷', '⁸', '⁹'];
    return num.toString().split('').map(digit => 
      superscripts[parseInt(digit)] || digit
    ).join('');
  }
  
  function formatFancyNumber(num) {
    return toFancyNumber(num.toLocaleString());
  }
  
  // Filter users with wheel stats and sort by total winnings
  const wheelPlayers = allUsers.filter(user => user.data?.totalWinnings)
                              .sort((a, b) => (b.data.totalWinnings || 0) - (a.data.totalWinnings || 0))
                              .slice(0, 10);
  
  let leaderboardMessage = [
    "🏆 ━━━ ᴡʜᴇᴇʟ ʟᴇᴀᴅᴇʀʙᴏᴀʀᴅ ━━━ 🏆",
    ``
  ].join("\n");
  
  if (wheelPlayers.length === 0) {
    leaderboardMessage += "ɴᴏ ᴘʟᴀʏᴇʀs ʏᴇᴛ! ʙᴇ ᴛʜᴇ ғɪʀsᴛ ᴛᴏ sᴘɪɴ ᴛʜᴇ ᴡʜᴇᴇʟ!";
  } else {
    wheelPlayers.forEach((user, index) => {
      const rank = index === 0 ? "🥇" : index === 1 ? "🥈" : index === 2 ? "🥉" : `${formatFancyNumber(index + 1)}.`;
      leaderboardMessage += `${rank} ${user.name || `ᴜsᴇʀ${user.id}`}: ${formatFancyNumber(user.data.totalWinnings || 0)}\n`;
    });
  }
  
  return api.sendMessage(leaderboardMessage, threadID);
}

// Helper function to claim daily bonus
async function claimDailyBonus(api, event, usersData) {
  const { senderID, threadID } = event;
  const user = await usersData.get(senderID);
  const userData = user.data || {};
  const now = Date.now();
  const lastDaily = userData.lastDaily || 0;
  
  function toFancyNumber(num) {
    const superscripts = ['⁰', '¹', '²', '³', '⁴', '⁵', '⁶', '⁷', '⁸', '⁹'];
    return num.toString().split('').map(digit => 
      superscripts[parseInt(digit)] || digit
    ).join('');
  }
  
  function formatFancyNumber(num) {
    return toFancyNumber(num.toLocaleString());
  }
  
  // Check if already claimed daily bonus today
  if (now - lastDaily < 86400000) {
    const nextClaim = Math.ceil((86400000 - (now - lastDaily)) / 3600000);
    return api.sendMessage(`⏰ ʏᴏᴜ'ᴠᴇ ᴀʟʀᴇᴀᴅʏ ᴄʟᴀɪᴍᴇᴅ ʏᴏᴜʀ ᴅᴀɪʟʏ ʙᴏɴᴜs ᴛᴏᴅᴀʏ. ᴄᴏᴍᴇ ʙᴀᴄᴋ ɪɴ ${formatFancyNumber(nextClaim)} ʜᴏᴜʀs!`, threadID);
  }
  
  // Calculate daily bonus based on consecutive days
  const consecutiveDays = userData.consecutiveDays || 1;
  const baseBonus = 5000;
  const streakBonus = Math.min(consecutiveDays, 7) * 1000;
  const dailyBonus = baseBonus + streakBonus;
  
  // Update user data
  const updatedMoney = user.money + dailyBonus;
  await usersData.set(senderID, {
    money: updatedMoney,
    data: {
      ...userData,
      lastDaily: now,
      consecutiveDays: consecutiveDays
    }
  });
  
  const bonusMessage = [
    "🎁 ━━ ᴅᴀɪʟʏ ʙᴏɴᴜs ━━ 🎁",
    "",
    `▢ ʙᴀsᴇ ʙᴏɴᴜs: ${(baseBonus)}`,
    `▢ sᴛʀᴇᴀᴋ ʙᴏɴᴜs (${(consecutiveDays)} ᴅᴀʏs): ${formatFancyNumber(streakBonus)}`,
    `▢ ᴛᴏᴛᴀʟ ʀᴇᴄᴇɪᴠᴇᴅ: ${(dailyBonus)}`,
    `▢ ɴᴇᴡ ʙᴀʟᴀɴᴄᴇ: ${(updatedMoney)}`,
    "",
    `💎 ᴄᴏᴍᴇ ʙᴀᴄᴋ ᴛᴏᴍᴏʀʀᴏᴡ ғᴏʀ ʏᴏᴜʀ ɴᴇxᴛ ʙᴏɴᴜs!`
  ].join("\n");
  
  return api.sendMessage(bonusMessage, threadID);
    }
