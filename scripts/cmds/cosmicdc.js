const fs = require("fs");
const COSMIC_EVENTS = {
  NEBULA: { multiplier: 3, probability: 0.1, emoji: "🌌" },
  BLACK_HOLE: { multiplier: 5, probability: 0.05, emoji: "🕳️" },
  SUPERNOVA: { multiplier: 10, probability: 0.02, emoji: "💥" },
  NORMAL: { multiplier: 2, probability: 0.83, emoji: "✨" }
};

const DICE_FACES = {
  1: "⚀",
  2: "⚁", 
  3: "⚂",
  4: "⚃",
  5: "⚄",
  6: "⚅"
};

const LIMIT_INTERVAL_HOURS = 12;
const MAX_PLAYS = 15;

module.exports = {
  config: {
    name: "cosmicdice",
    aliases: ["csd"]
    version: "2025.1",
    author: "STRACTAR",
    countDown: 5,
    role: 0,
    category: "game",
    shortDescription: {
      en: "Exclusive 2025 Cosmic Dice prediction game"
    },
    guide: {
      en: "{pn} [bet] [high/low] - Predict dice outcome\n{pn} top - Leaderboard\n{pn} events - Cosmic events info"
    }
  },

  onStart: async function ({ args, event, message, usersData, commandName, api }) {
    const senderID = event.senderID;

    // Leaderboard
    if (args[0] === "top") {
      const allUsers = await usersData.getAll();
      const filtered = allUsers
        .filter(u => u.data?.cosmicWins)
        .sort((a, b) => (b.data.cosmicWins || 0) - (a.data.cosmicWins || 0))
        .slice(0, 10);

      if (filtered.length === 0)
        return message.reply("🌌 No cosmic champions yet!");

      const topList = filtered.map((u, i) => 
        `【${i + 1}】${u.name} - 🏆${u.data.cosmicWins || 0}`
      ).join("\n");

      return message.reply(
        `🌠 COSMIC CHAMPIONS\n` +
        `▬▬▬▬▬▬▬▬▬▬▬▬▬▬\n` +
        `${topList}\n` +
        `▬▬▬▬▬▬▬▬▬▬▬▬▬▬`
      );
    }

    // Cosmic events info
    if (args[0] === "events") {
      return message.reply(
        `🌌 COSMIC EVENTS GUIDE\n` +
        `▬▬▬▬▬▬▬▬▬▬▬▬▬▬\n` +
        `🌌 NEBULA: 3x Multiplier (10% chance)\n` +
        `🕳️ BLACK HOLE: 5x Multiplier (5% chance)\n` +
        `💥 SUPERNOVA: 10x Multiplier (2% chance)\n` +
        `✨ NORMAL: 2x Multiplier (83% chance)\n\n` +
        `Predict if the cosmic dice will roll HIGH (4-6) or LOW (1-3)!`
      );
    }

    const user = await usersData.get(senderID);
    const amount = parseInt(args[0]);
    const prediction = args[1] ? args[1].toLowerCase() : null;
    
    if (isNaN(amount) || amount <= 0)
      return message.reply("⚠️ Enter a valid bet amount.\nEx: cosmicdice 100 high");
      
    if (!prediction || !["high", "low", "h", "l"].includes(prediction))
      return message.reply("⚠️ Predict 'high' or 'low'.\nEx: cosmicdice 100 high");

    if (user.money < amount)
      return message.reply("💸 Not enough cosmic coins.");

    // Limit check
    const now = Date.now();
    const lastReset = user.data?.cosmicLastReset || 0;
    const playHistory = user.data?.cosmicPlayHistory || [];

    if (now - lastReset > LIMIT_INTERVAL_HOURS * 60 * 60 * 1000) {
      playHistory.length = 0;
      await usersData.set(senderID, {
        "data.cosmicLastReset": now,
        "data.cosmicPlayHistory": []
      });
    }

    if (playHistory.length >= MAX_PLAYS) {
      return message.reply(`⛔ Limit: ${MAX_PLAYS} games per ${LIMIT_INTERVAL_HOURS}h`);
    }

    // Send initial cosmic animation
    const cosmicMessage = await message.reply(
      `🌌 COSMIC DICE 2025\n` +
      `▬▬▬▬▬▬▬▬▬▬▬▬▬▬\n` +
      `BET: ${amount} coins\n` +
      `PREDICTION: ${prediction.startsWith('h') ? 'HIGH (4-6)' : 'LOW (1-3)'}\n` +
      `ROLLING: 🌠🌠🌠\n` +
      `▬▬▬▬▬▬▬▬▬▬▬▬▬▬`
    );

    // Animate dice rolling
    const rollFrames = ["⚀", "⚁", "⚂", "⚃", "⚄", "⚅"];
    let frame = 0;
    const rollInterval = setInterval(async () => {
      frame = (frame + 1) % rollFrames.length;
      try {
        await api.editMessage(
          `🌌 COSMIC DICE 2025\n` +
          `▬▬▬▬▬▬▬▬▬▬▬▬▬▬\n` +
          `BET: ${amount} coins\n` +
          `PREDICTION: ${prediction.startsWith('h') ? 'HIGH (4-6)' : 'LOW (1-3)'}\n` +
          `ROLLING: ${rollFrames[frame]} ${rollFrames[(frame + 2) % 6]} ${rollFrames[(frame + 4) % 6]}\n` +
          `▬▬▬▬▬▬▬▬▬▬▬▬▬▬`,
          cosmicMessage.messageID
        );
      } catch (e) {
        clearInterval(rollInterval);
      }
    }, 300);

    // Determine outcome after animation
    setTimeout(async () => {
      clearInterval(rollInterval);
      
      // Roll the dice (1-6)
      const diceRoll = Math.floor(Math.random() * 6) + 1;
      const isHigh = diceRoll >= 4;
      const predictedHigh = prediction.startsWith('h');
      
      // Determine cosmic event
      const rand = Math.random();
      let cosmicEvent = COSMIC_EVENTS.NORMAL;
      
      if (rand < COSMIC_EVENTS.SUPERNOVA.probability) {
        cosmicEvent = COSMIC_EVENTS.SUPERNOVA;
      } else if (rand < COSMIC_EVENTS.SUPERNOVA.probability + COSMIC_EVENTS.BLACK_HOLE.probability) {
        cosmicEvent = COSMIC_EVENTS.BLACK_HOLE;
      } else if (rand < COSMIC_EVENTS.SUPERNOVA.probability + COSMIC_EVENTS.BLACK_HOLE.probability + COSMIC_EVENTS.NEBULA.probability) {
        cosmicEvent = COSMIC_EVENTS.NEBULA;
      }
