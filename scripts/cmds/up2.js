const fs = require("fs");
const os = require("os");
const { createCanvas } = require("canvas");

module.exports = {
  config: {
    name: "uptime2",
    aliases: ["up2", "upt2", "stats", "milowstatus"],
    version: "4.0",
    author: "nexo_here",
    cooldowns: 5,
    role: 0,
    shortDescription: "milow AI System Status",
    longDescription: "Display futuristic system metrics for Ichigo AI",
    category: "system",
    guide: "{pn}"
  },

  onStart: async function ({ message }) {
    const width = 1600;
    const height = 900;
    const canvas = createCanvas(width, height);
    const ctx = canvas.getContext("2d");

    // Deep space background with stars
    const bgGradient = ctx.createRadialGradient(width/2, height/2, 50, width/2, height/2, width/1.5);
    bgGradient.addColorStop(0, "#0a0e1a");
    bgGradient.addColorStop(1, "#050811");
    ctx.fillStyle = bgGradient;
    ctx.fillRect(0, 0, width, height);
    
    // Add stars
    ctx.fillStyle = "#ffffff";
    for (let i = 0; i < 200; i++) {
      const x = Math.random() * width;
      const y = Math.random() * height;
      const size = Math.random() * 1.5;
      ctx.beginPath();
      ctx.arc(x, y, size, 0, Math.PI * 2);
      ctx.fill();
    }

    // Main dashboard panel - futuristic glass with glow
    const panelWidth = width - 100;
    const panelHeight = height - 100;
    const panelX = 50;
    const panelY = 50;
    
    drawFuturisticPanel(ctx, panelX, panelY, panelWidth, panelHeight, 20);

    // Ichigo AI Header with futuristic typography
    ctx.font = "bold 70px 'Arial'";
    const headerGradient = ctx.createLinearGradient(panelX + 50, panelY + 30, panelX + 600, panelY + 30);
    headerGradient.addColorStop(0, "#ff2a6d");
    headerGradient.addColorStop(0.5, "#05d9e8");
    headerGradient.addColorStop(1, "#d1f7ff");
    ctx.fillStyle = headerGradient;
    ctx.shadowColor = "#05d9e8";
    ctx.shadowBlur = 30;
    ctx.fillText("MILOW AI SYSTEM", panelX + 50, panelY + 80);
    ctx.shadowBlur = 0;
    
    // Subtitle
    ctx.font = "26px 'Arial'";
    ctx.fillStyle = "#a1f2ff";
    ctx.fillText("Milow Uptime • Quantum Core v4.0", panelX + 55, panelY + 115);
    
    // Divider line with glow effect
    ctx.strokeStyle = "#05d9e855";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(panelX + 50, panelY + 140);
    ctx.lineTo(panelX + panelWidth - 50, panelY + 140);
    ctx.stroke();
    
    // Add circuit pattern to background of panel
    drawCircuitPattern(ctx, panelX, panelY, panelWidth, panelHeight);

    // System data collection
    const uptime = process.uptime();
    const d = Math.floor(uptime / 86400);
    const h = Math.floor((uptime % 86400) / 3600);
    const m = Math.floor((uptime % 3600) / 60);
    const s = Math.floor(uptime % 60);
    const botUptime = `${d}d ${h}h ${m}m ${s}s`;

    const totalMem = os.totalmem();
    const freeMem = os.freemem();
    const usedMem = totalMem - freeMem;
    const ramUsagePercent = (usedMem / totalMem) * 100;

    const cpus = os.cpus();
    const cpuModel = cpus[0].model;
    const cpuCount = cpus.length;
    const loadAvg = os.loadavg()[0];
    const cpuPercent = Math.min((loadAvg / cpuCount) * 100, 100);

    const nodeVer = process.version;
    const platform = os.platform();
    const arch = os.arch();
    const hostname = os.hostname();

    // System info with futuristic layout
    const info = [
      ["⏱️ SYSTEM UPTIME", botUptime],
      ["🧠 QUANTUM PROCESSOR", `${cpuModel} (${cpuCount} cores)`],
      ["📈 NEURAL LOAD", `${loadAvg.toFixed(2)} (${cpuPercent.toFixed(1)}%)`],
      ["💾 HOLO MEMORY", `${(usedMem / 1024 / 1024 / 1024).toFixed(2)} GB / ${(totalMem / 1024 / 1024 / 1024).toFixed(2)} GB (${ramUsagePercent.toFixed(1)}%)`],
      ["🛠️ PLATFORM", `${platform.toUpperCase()} (${arch})`],
      ["📦 NODE CORE", nodeVer],
      ["🔖 HOST ID", hostname]
    ];

    // Render info in two columns
    const column1X = panelX + 60;
    const column2X = panelX + panelWidth / 2 + 20;
    const startY = panelY + 180;
    
    info.forEach(([label, value], i) => {
      const x = i < 4 ? column1X : column2X;
      const y = startY + (i % 4) * 80;
      
      // Label
      ctx.font = "bold 22px 'Arial'";
      ctx.fillStyle = "#05d9e8";
      ctx.fillText(label, x, y);
      
      // Value
      ctx.font = "20px 'Arial'";
      ctx.fillStyle = "#d1f7ff";
      ctx.fillText(value, x, y + 35);
    });

    // Performance meters
    const meterY = panelY + 500;
    
    // RAM Usage Meter
    drawFuturisticMeter(ctx, column1X, meterY, panelWidth/2 - 100, 40, ramUsagePercent, "MEMORY USAGE", "#ff2a6d");
    
    // CPU Load Meter
    drawFuturisticMeter(ctx, column1X, meterY + 80, panelWidth/2 - 100, 40, cpuPercent, "PROCESSOR LOAD", "#05d9e8");
    
    // Network status (simulated)
    const networkStatus = Math.floor(Math.random() * 100);
    drawFuturisticMeter(ctx, column2X, meterY, panelWidth/2 - 100, 40, networkStatus, "NETWORK STABILITY", "#a1f2ff");
    
    // Response time (simulated)
    const responseTime = 100 - Math.floor(Math.random() * 30);
    drawFuturisticMeter(ctx, column2X, meterY + 80, panelWidth/2 - 100, 40, responseTime, "RESPONSE EFFICIENCY", "#ff2a6d");

    // Binary rain effect
    drawBinaryRain(ctx, panelX, panelY, panelWidth, panelHeight);

    // Timestamp with futuristic style
    ctx.font = "18px 'Arial'";
    ctx.fillStyle = "#05d9e8";
    ctx.fillText(`⏰ SYSTEM SCAN: ${new Date().toLocaleString()}`, panelX + 50, panelY + panelHeight - 30);
    
    // Ichigo AI signature
    ctx.font = "italic 16px 'Arial'";
    ctx.fillStyle = "#a1f2ff";
    ctx.fillText( "milwo AI • MILOW UPTIME QUANTUM SYSTEM", panelX + panelWidth - 400, panelY + panelHeight - 30);

    // Save Image
    const buffer = canvas.toBuffer("image/png");
    const fileName = "ichigo_ai_status.png";
    fs.writeFileSync(fileName, buffer);

    // Plain text version
    const plain = info.map(([l, v]) => `${l}: ${v}`).join("\n");
    const performance = `RAM: ${ramUsagePercent.toFixed(1)}% | CPU: ${cpuPercent.toFixed(1)}%`;

    message.reply({
      body: `⚡ Milow AI System Report\n\n${plain}\n\n${performance}\n\nQuantum core operational at ${responseTime}% efficiency`,
      attachment: fs.createReadStream(fileName)
    });
  }
};

// Draw futuristic panel with glass effect and neon border
function drawFuturisticPanel(ctx, x, y, w, h, r) {
  // Outer glow
  ctx.shadowColor = "#05d9e833";
  ctx.shadowBlur = 40;
  ctx.fillStyle = "rgba(10, 14, 26, 0.7)";
  roundRect(ctx, x, y, w, h, r, true, false);
  ctx.shadowBlur = 0;
  
  // Inner highlight
  ctx.strokeStyle = "#05d9e8";
  ctx.lineWidth = 2;
  roundRect(ctx, x + 2, y + 2, w - 4, h - 4, r - 2, false, true);
  
  // Glass overlay effect
  const glassGradient = ctx.createLinearGradient(x, y, x, y + h/3);
  glassGradient.addColorStop(0, "rgba(213, 249, 255, 0.1)");
  glassGradient.addColorStop(1, "rgba(213, 249, 255, 0.01)");
  ctx.fillStyle = glassGradient;
  roundRect(ctx, x, y, w, h/3, r, true, false);
}

// Draw futuristic meter with glow effect
function drawFuturisticMeter(ctx, x, y, w, h, percent, label, color) {
  // Background
  ctx.fillStyle = "rgba(5, 217, 232, 0.1)";
  roundRect(ctx, x, y, w, h, h/2, true, false);
  
  // Fill
  const fillW = (percent / 100) * w;
  const fillGradient = ctx.createLinearGradient(x, y, x + w, y);
  fillGradient.addColorStop(0, color);
  fillGradient.addColorStop(1, "#0a0e1a");
  
  ctx.shadowColor = color + "66";
  ctx.shadowBlur = 20;
  ctx.fillStyle = fillGradient;
  roundRect(ctx, x, y, fillW, h, h/2, true, false);
  ctx.shadowBlur = 0;
  
  // Label and percentage
  ctx.font = "bold 16px 'Arial'";
  ctx.fillStyle = "#d1f7ff";
  ctx.fillText(`${label}: ${percent.toFixed(1)}%`, x + 20, y + h/2 + 5);
  
  // Add glowing dots on the meter
  ctx.fillStyle = color;
  ctx.shadowColor = color;
  ctx.shadowBlur = 10;
  for (let i = 0; i < 5; i++) {
    const dotX = x + (w / 4) * i;
    ctx.beginPath();
    ctx.arc(dotX, y + h/2, 2, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.shadowBlur = 0;
}

// Draw circuit pattern in the background
function drawCircuitPattern(ctx, x, y, w, h) {
  ctx.save();
  ctx.strokeStyle = "rgba(5, 217, 232, 0.05)";
  ctx.lineWidth = 1;
  
  // Horizontal lines
  for (let i = y + 50; i < y + h; i += 40) {
    ctx.beginPath();
    ctx.moveTo(x + 20, i);
    ctx.lineTo(x + w - 20, i);
    ctx.stroke();
  }
  
  // Vertical lines
  for (let i = x + 50; i < x + w; i += 60) {
    ctx.beginPath();
    ctx.moveTo(i, y + 20);
    ctx.lineTo(i, y + h - 20);
    ctx.stroke();
  }
  
  // Some random connections
  for (let i = 0; i < 30; i++) {
    const startX = x + 20 + Math.random() * (w - 40);
    const startY = y + 20 + Math.random() * (h - 40);
    const endX = startX + (Math.random() * 100 - 50);
    const endY = startY + (Math.random() * 100 - 50);
    
    if (endX > x + 20 && endX < x + w - 20 && endY > y + 20 && endY < y + h - 20) {
      ctx.beginPath();
      ctx.moveTo(startX, startY);
      ctx.lineTo(endX, endY);
      ctx.stroke();
      
      // Add a small node at the start
      ctx.beginPath();
      ctx.arc(startX, startY, 2, 0, Math.PI * 2);
      ctx.fillStyle = "rgba(5, 217, 232, 0.3)";
      ctx.fill();
    }
  }
  ctx.restore();
}

// Draw binary rain (matrix code effect)
function drawBinaryRain(ctx, x, y, w, h) {
  ctx.save();
  ctx.font = "14px 'Arial'";
  ctx.fillStyle = "rgba(5, 217, 232, 0.3)";
  
  // Create some random binary characters
  for (let i = 0; i < 50; i++) {
    const charX = x + 20 + Math.random() * (w - 40);
    const charY = y + 160 + Math.random() * (h - 200);
    const binaryChar = Math.random() > 0.5 ? "1" : "0";
    ctx.fillText(binaryChar, charX, charY);
  }
  ctx.restore();
}

// RoundRect helper function
function roundRect(ctx, x, y, w, h, r, fill, stroke) {
  if (typeof r === "number") {
    r = { tl: r, tr: r, br: r, bl: r };
  } else {
    r = { ...{ tl: 0, tr: 0, br: 0, bl: 0 }, ...r };
  }
  
  ctx.beginPath();
  ctx.moveTo(x + r.tl, y);
  ctx.lineTo(x + w - r.tr, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r.tr);
  ctx.lineTo(x + w, y + h - r.br);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r.br, y + h);
  ctx.lineTo(x + r.bl, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r.bl);
  ctx.lineTo(x, y + r.tl);
  ctx.quadraticCurveTo(x, y, x + r.tl, y);
  ctx.closePath();
  
  if (fill) ctx.fill();
  if (stroke) ctx.stroke();
  }
