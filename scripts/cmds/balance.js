const fs = require("fs");
const path = require("path");
const { createCanvas, loadImage, registerFont } = require("canvas");
const fetch = require("node-fetch");

// Optional custom font
try {
  registerFont(path.join(__dirname, "fonts", "SegoeUI-Bold.ttf"), { family: "Segoe UI" });
} catch(e){ console.log("Font not found, using default."); }

// -----------------------------
// Helper functions
// -----------------------------
function formatAmount(amount) {
  if (amount >= 1e15) return (amount / 1e15).toFixed(1).replace(/\.0$/, "") + "Q";
  if (amount >= 1e12) return (amount / 1e12).toFixed(1).replace(/\.0$/, "") + "T";
  if (amount >= 1e9) return (amount / 1e9).toFixed(1).replace(/\.0$/, "") + "B";
  if (amount >= 1e6) return (amount / 1e6).toFixed(1).replace(/\.0$/, "") + "M";
  if (amount >= 1e3) return (amount / 1e3).toFixed(0) + "K";
  return amount.toLocaleString();
}

function generateFutureBalances(currentBalance, steps = 5) {
  const future = [];
  let balance = currentBalance;
  for (let i = 0; i < steps; i++) {
    const growth = Math.floor(balance * (Math.random() * 0.1 + 0.01)); 
    balance += growth;
    future.push(balance);
  }
  return future;
}

function getTier(balance) {
  if (balance < 1000) return { name: "Bronze", baseColor: "#cd7f32" };
  if (balance < 10000) return { name: "Silver", baseColor: "#c0c0c0" };
  if (balance < 100000) return { name: "Gold", baseColor: "#ffd700" };
  return { name: "Platinum", baseColor: "#0ff" };
}

function getTierColor(balance) {
  if (balance < 1000) return "#cd7f32";
  if (balance < 10000) return "#c0c0c0";
  if (balance < 100000) return "#ffd700";
  return "#0ff";
}

function drawFutureGraph(ctx, futureBalances, x, y, width, height) {
  const max = Math.max(...futureBalances);
  const stepX = width / (futureBalances.length - 1);

  const gradient = ctx.createLinearGradient(x, y, x + width, y);
  gradient.addColorStop(0, "#0ff");
  gradient.addColorStop(0.5, "#00bcd4");
  gradient.addColorStop(1, "#009688");
  ctx.strokeStyle = gradient;
  ctx.lineWidth = 2;
  ctx.shadowColor = "#0ff";
  ctx.shadowBlur = 8;
  ctx.beginPath();

  futureBalances.forEach((val, i) => {
    const px = x + stepX * i;
    const py = y + height - (val / max) * height;
    if (i === 0) ctx.moveTo(px, py);
    else ctx.lineTo(px, py);
  });

  ctx.stroke();
  ctx.shadowBlur = 0;

  futureBalances.forEach((val, i) => {
    const px = x + stepX * i;
    const py = y + height - (val / max) * height;
    ctx.beginPath();
    ctx.arc(px, py, 4, 0, Math.PI * 2);
    ctx.fillStyle = "#0ff";
    ctx.shadowColor = "#0ff";
    ctx.shadowBlur = 10;
    ctx.fill();
    ctx.shadowBlur = 0;
  });
}

// -----------------------------
// Module export
// -----------------------------
module.exports = {
  config: {
    name: "bal",
    aliases: ["balance", "money", "wallet"],
    version: "18.0",
    author: "GoatBot Devs + Raihan",
    countDown: 3,
    role: 0,
    category: "economy",
    description: "Full balance card + transfer + future graph + dynamic tier color + reply support",
    guide: {
      en: "{pn} - show balance (or reply user)\n{pn} t <amount> <user> - transfer balance"
    }
  },

  langs: {
    en: {
      title: "Milows Economy",
      transferSuccess: "✅ Successfully sent $%1 to %2!",
      transferFail: "❌ Failed to transfer. %1",
      insufficientFunds: "❌ You don't have enough balance!"
    }
  },

  onStart: async function({ message, event, args, usersData, getLang, api }) {

    // -----------------------------
    // Balance Transfer
    // -----------------------------
    if (args[0] && ["t","transfer","pay","send"].includes(args[0].toLowerCase())) {
      let amount = parseInt(args[1]);
      if (!amount || amount <= 0) return message.reply(getLang("transferFail","Invalid amount"));

      let recipientID;
      if (event.type === "message_reply" && event.messageReply) recipientID = event.messageReply.senderID;
      else if (args[2]) { const matches = args[2].match(/\d+/); if (matches) recipientID = matches[0]; }
      if (!recipientID) return message.reply(getLang("transferFail","No user specified"));
      if (event.senderID === recipientID) return message.reply("❌ You cannot send money to yourself!");

      const senderData = await usersData.get(event.senderID);
      if (senderData.money < amount) return message.reply(getLang("insufficientFunds"));
      const recipientData = await usersData.get(recipientID);

      senderData.money -= amount;
      recipientData.money = (recipientData.money||0) + amount;

      await usersData.set(event.senderID,senderData);
      await usersData.set(recipientID,recipientData);

      return message.reply(getLang("transferSuccess",formatAmount(amount),recipientData.name||"User"));
    }

    // -----------------------------
    // Balance Card
    // -----------------------------
    let targetID = event.senderID;
    if (event.type === "message_reply" && event.messageReply) targetID = event.messageReply.senderID;

    const userData = await usersData.get(targetID);
    const userName = userData.name || "User";
    const balance = userData.money || 0;
    const formatted = formatAmount(balance);
    const tier = getTier(balance);

    let avatarBuffer;
    try {
      const userInfo = await api.getUserInfo(targetID);
      const avatarURL = userInfo[targetID].avatar || null;
      if (avatarURL) avatarBuffer = await (await fetch(avatarURL)).buffer();
    } catch(e){ console.log("Avatar fetch failed:", e); }

    const width = 626, height = 220;
    const canvas = createCanvas(width,height);
    const ctx = canvas.getContext("2d");

    try {
      const bg = await loadImage("https://i.imgur.com/CBSQcKr.jpeg");
      ctx.drawImage(bg,0,0,width,height);
    } catch(e){
      ctx.fillStyle = "#1a1a1a";
      ctx.fillRect(0,0,width,height);
    }

    ctx.fillStyle = "rgba(255,255,255,0.15)";
    ctx.fillRect(10,10,width-20,height-20);

    if (avatarBuffer) {
      const avatar = await loadImage(avatarBuffer);
      ctx.save();
      ctx.beginPath();
      ctx.arc(width-60,60,30,0,Math.PI*2);
      ctx.closePath();
      ctx.clip();
      ctx.drawImage(avatar,width-90,30,60,60);
      ctx.restore();
    }

    ctx.fillStyle = "#fff";
    ctx.font = "bold 20px 'Segoe UI'";
    ctx.fillText(getLang("title"), 20, 30);

    ctx.font = "bold 36px 'Segoe UI'";
    ctx.fillStyle = "#ffffff"; // WHITE color
    ctx.shadowColor = "#000";
    ctx.shadowBlur = 8;
    ctx.fillText(`$${formatted}`, 20, 80);
    ctx.shadowBlur = 0;

    ctx.font = "18px 'Segoe UI'";
    ctx.fillStyle = getTierColor(balance);
    ctx.fillText(`${userName} (${tier.name})`, 20, 110);

    ctx.font = "14px monospace";
    ctx.fillStyle = "#fff";
    ctx.fillText("****  ****  ****  2025",20,140);

    const futureBalances = generateFutureBalances(balance,5);
    drawFutureGraph(ctx,futureBalances,20,160,200,40);

    const filePath = path.join(__dirname, `bal_${targetID}.png`);
    fs.writeFileSync(filePath,canvas.toBuffer("image/png"));
    await message.reply({ body: "", attachment: fs.createReadStream(filePath) });
    fs.unlinkSync(filePath);
  }
};
