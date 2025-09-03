const LIMIT_INTERVAL_HOURS = 12;
const MAX_PLAYS = 20;
const MAX_BET = 6_000_000;

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
      { label: "💥 JACKPOT x10", multiplier: 10, probability: 0.05, color: "#FFD700" },
      { label: "🎉 BIG WIN x5", multiplier: 5, probability: 0.1, color: "#FF6347" },
      { label: "🔥 WIN x3", multiplier: 3, probability: 0.15, color: "#FF4500" },
      { label: "👍 WIN x2", multiplier: 2, probability: 0.2, color: "#32CD32" },
      { label: "✨ SMALL WIN x1.5", multiplier: 1.5, probability: 0.2, color: "#1E90FF" },
      { label: "😐 NO WIN x0", multiplier: 0, probability: 0.15, color: "#A9A9A9" },
      { label: "😞 LOSE HALF", multiplier: -0.5, probability: 0.1, color: "#696969" },
      { label: "💸 BANKRUPT", multiplier: -1, probability: 0.05, color: "#8B0000" }
    ];

    // Send initial spinning message (edit 1)
    let spinningMsg;
    try {
      spinningMsg = await api.sendMessage("🎡 | Preparing wheel...", threadID);
    } catch (e) {
      console.error("Initial message failed:", e);
      return;
    }

    // Simulate spinning with minimal edits (edits 2-4)
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

    // Build result message with enhanced formatting (final edit - edit 5)
    const resultMsg = [
      `🎡 ━━ FINAL RESULT ━━ 🎡`,
      ``,
        `▢ ${result.label}`,
        `▢ YOUR BET: ${bet.toLocaleString()}`,
      winnings > 0 
      ? `▢ 🎉 YOU WON: +${winnings.toLocaleString()}`
      : winnings < 0
      ? `▢ 💸 YOU LOST: ${Math.abs(winnings).toLocaleString()}`
      : `▢ 😔 NO WINNINGS`,
      ``,
     
      `▢ NEW BALANCE: ${finalMoney.toLocaleString()}`,
      `▢ SPINS USED: ${validSpins.length}/${MAX_PLAYS}`,
      consecutiveBonus > 0 ? `▢ CONSECUTIVE DAY BONUS: +${(consecutiveBonus * 100).toFixed(0)}%` : '',
      isLuckyHour ? `▢ 🍀 LUCKY HOUR BONUS: +50%` : '',
      ``,
      `💎 Consecutive days: ${consecutiveDays} | Big wins: ${updateData.data.bigWins || 0}`
    ].filter(line => line !== '').join("\n");

    try {
      await api.editMessage(resultMsg, spinningMsg.messageID);
      
      // Special effects for big wins (new messages, not edits)
      if (finalMultiplier >= 5) {
        await new Promise(resolve => setTimeout(resolve, 1000));
        await api.sendMessage("🎊 CONGRATULATIONS ON YOUR BIG WIN! 🎊", threadID);
        
        if (finalMultiplier >= 10) {
          await new Promise(resolve => setTimeout(resolve, 1500));
          await api.sendMessage("🏆 JACKPOT WINNER! 🏆", threadID);
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
  
  const statsMessage = [
    "🎡 ━━━ YOUR STATS ━━━ 🎡",
   
    `▢ Total spins: ${userData.totalSpins | 0}`,
    `▢ Big wins (5x+): ${userData.bigWins || 0}`,
    `▢ Jackpots: ${userData.jackpots || 0}`,
    `▢ Total winnings: ${(userData.totalWinnings || 0).toLocaleString()}`,
    `▢ Current balance: ${user.money.toLocaleString()}`,
    `▢ Consecutive days: ${userData.consecutiveDays || 0}`,
    "",
    "💡 Tip: Play during lucky hours (6PM-8PM) for bonus rewards!"
  ].join("\n");
  
  return api.sendMessage(statsMessage, threadID);
}

// Helper function to show leaderboard
async function showLeaderboard(api, event, usersData) {
  const { threadID } = event;
  const allUsers = await usersData.getAll();
  
  // Filter users with wheel stats and sort by total winnings
  const wheelPlayers = allUsers.filter(user => user.data?.totalWinnings)
                              .sort((a, b) => (b.data.totalWinnings || 0) - (a.data.totalWinnings || 0))
                              .slice(0, 10);
  
  let leaderboardMessage = "🏆 ━━━ WHEEL LEADERBOARD ━━━ 🏆\n\n";
  
  if (wheelPlayers.length === 0) {
    leaderboardMessage += "No players yet! Be the first to spin the wheel!";
  } else {
    wheelPlayers.forEach((user, index) => {
      const rank = index === 0 ? "🥇" : index === 1 ? "🥈" : index === 2 ? "🥉" : `${index + 1}.`;
      leaderboardMessage += `${rank} ${user.name || `User${user.id}`}: ${(user.data.totalWinnings || 0).toLocaleString()}\n`;
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
  
  // Check if already claimed daily bonus today
  if (now - lastDaily < 86400000) {
    const nextClaim = Math.ceil((86400000 - (now - lastDaily)) / 3600000);
    return api.sendMessage(`⏰ You've already claimed your daily bonus today. n/Come back in ${nextClaim} hours!`, threadID);
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
    "🎁 ━━ DAILY BONUS ━━ 🎁",
    "",
    `▢ Base bonus: ${baseBonus.toLocaleString()}`,
    `▢ Streak bonus (${consecutiveDays} days): ${streakBonus.toLocaleString()}`,
    `▢ Total received: ${dailyBonus.toLocaleString()}`,
    `▢ New balance: ${updatedMoney.toLocaleString()}`,
    "",
    `💎 Come back tomorrow for your next bonus!`
  ].join("\n");
  
  return api.sendMessage(bonusMessage, threadID);
  }
