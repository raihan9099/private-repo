const axios = require("axios");

const ADMIN_UID = "61550614250757";

// MongoDB connection for premium features
let premiumDB = null;
let birthdayCollection = null;

// Initialize MongoDB connection if PREMIUM_DB is available
async function initPremiumDB() {
  if (premiumDB) return premiumDB; // Already initialized
  
  if (!process.env.PREMIUM_DB) {
    console.log("⚠️ PREMIUM_DB not configured, using default storage");
    return null;
  }

  try {
    const { MongoClient } = require('mongodb');
    const client = new MongoClient(process.env.PREMIUM_DB);
    await client.connect();
    premiumDB = client.db('goatbot_premium');
    birthdayCollection = premiumDB.collection('birthdays');
    
    // Create indexes for better performance
    await birthdayCollection.createIndex({ userID: 1 }, { unique: true });
    await birthdayCollection.createIndex({ "day": 1, "month": 1 });
    
    console.log("✅ Premium MongoDB connected for birthday features");
    return premiumDB;
  } catch (error) {
    console.error("❌ Failed to connect to Premium MongoDB:", error.message);
    return null;
  }
}

// Birthday storage functions with simplified structure
async function saveBirthdayToDB(userID, birthdayData) {
  await initPremiumDB();
  
  if (birthdayCollection) {
    try {
      // Flatten the structure to avoid deep nesting
      const flatData = {
        userID: userID,
        name: birthdayData.name,
        date: birthdayData.date,
        day: birthdayData.day,
        month: birthdayData.month,
        year: birthdayData.year,
        zodiac: birthdayData.zodiac,
        source: 'mongodb',
        updatedAt: new Date(),
        createdAt: birthdayData.createdAt || new Date()
      };
      
      await birthdayCollection.replaceOne(
        { userID: userID },
        flatData,
        { upsert: true }
      );
      return true;
    } catch (error) {
      console.error("❌ MongoDB save error:", error.message);
      return false;
    }
  }
  return false;
}

async function getBirthdayFromDB(userID) {
  await initPremiumDB();
  
  if (birthdayCollection) {
    try {
      return await birthdayCollection.findOne({ userID: userID });
    } catch (error) {
      console.error("❌ MongoDB get error:", error.message);
      return null;
    }
  }
  return null;
}

async function getAllBirthdaysFromDB() {
  await initPremiumDB();
  
  if (birthdayCollection) {
    try {
      return await birthdayCollection.find({}).toArray();
    } catch (error) {
      console.error("❌ MongoDB getAll error:", error.message);
      return [];
    }
  }
  return [];
}

async function deleteBirthdayFromDB(userID) {
  await initPremiumDB();
  
  if (birthdayCollection) {
    try {
      await birthdayCollection.deleteOne({ userID: userID });
      return true;
    } catch (error) {
      console.error("❌ MongoDB delete error:", error.message);
      return false;
    }
  }
  return false;
}

// Fallback to usersData with simplified structure
async function saveBirthdayFallback(userID, birthdayData, usersData) {
  try {
    const userData = await usersData.get(userID) || {};
    const currentData = userData.data || {};
    
    // Simplified structure for fallback storage
    const simpleBirthdayData = {
      date: birthdayData.date,
      day: birthdayData.day,
      month: birthdayData.month,
      year: birthdayData.year,
      zodiac: birthdayData.zodiac,
      source: 'fallback'
    };
    
    await usersData.set(userID, {
      birthday: simpleBirthdayData
    }, "data");
  } catch (error) {
    console.error("❌ Fallback save error:", error.message);
  }
}

async function getBirthdayFallback(userID, usersData) {
  try {
    const userData = await usersData.get(userID) || {};
    return userData.data?.birthday || null;
  } catch (error) {
    console.error("❌ Fallback get error:", error.message);
    return null;
  }
}

// ----- helpers -----
function parseBirthday(input) {
  const m = /^(\d{1,2})-(\d{1,2})(?:-(\d{4}))?$/.exec(input.trim());
  if (!m) return null;
  const day = parseInt(m[1], 10);
  const month = parseInt(m[2], 10);
  const year = m[3] ? parseInt(m[3], 10) : null;
  if (day < 1 || day > 31 || month < 1 || month > 12) return null;
  if (year && (year < 1900 || year > new Date().getFullYear())) return null;
  return { day, month, year, raw: input.trim() };
}

function nowDhakaParts() {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Asia/Dhaka",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false
  }).formatToParts(new Date());

  const get = (t) => parseInt(parts.find(p => p.type === t).value, 10);
  return {
    year: get("year"),
    month: get("month"),
    day: get("day"),
    hour: get("hour"),
    minute: get("minute"),
    second: get("second")
  };
}

function getZodiacSign(day, month) {
  const signs = [
    { name: "♑ Capricorn", start: [12, 22], end: [1, 19] },
    { name: "♒ Aquarius", start: [1, 20], end: [2, 18] },
    { name: "♓ Pisces", start: [2, 19], end: [3, 20] },
    { name: "♈ Aries", start: [3, 21], end: [4, 19] },
    { name: "♉ Taurus", start: [4, 20], end: [5, 20] },
    { name: "♊ Gemini", start: [5, 21], end: [6, 20] },
    { name: "♋ Cancer", start: [6, 21], end: [7, 22] },
    { name: "♌ Leo", start: [7, 23], end: [8, 22] },
    { name: "♍ Virgo", start: [8, 23], end: [9, 22] },
    { name: "♎ Libra", start: [9, 23], end: [10, 22] },
    { name: "♏ Scorpio", start: [10, 23], end: [11, 21] },
    { name: "♐ Sagittarius", start: [11, 22], end: [12, 21] }
  ];

  for (const sign of signs) {
    const [startMonth, startDay] = sign.start;
    const [endMonth, endDay] = sign.end;
    
    if (startMonth === endMonth) {
      if (month === startMonth && day >= startDay && day <= endDay) return sign.name;
    } else {
      if ((month === startMonth && day >= startDay) || (month === endMonth && day <= endDay)) {
        return sign.name;
      }
    }
  }
  return "♈ Aries"; // fallback
}

function calculateAge(day, month, year) {
  if (!year) return null;
  const { year: currentYear, month: currentMonth, day: currentDay } = nowDhakaParts();
  let age = currentYear - year;
  if (currentMonth < month || (currentMonth === month && currentDay < day)) {
    age--;
  }
  return age;
}

function getDaysUntilBirthday(day, month) {
  const { year, month: currentMonth, day: currentDay } = nowDhakaParts();
  let nextBirthday = new Date(year, month - 1, day);
  const today = new Date(year, currentMonth - 1, currentDay);
  
  if (nextBirthday < today) {
    nextBirthday = new Date(year + 1, month - 1, day);
  }
  
  return Math.ceil((nextBirthday - today) / (1000 * 60 * 60 * 24));
}

async function generateAIWish(name, age, zodiac) {
  const wishes = [
    `🎉 Happy Birthday ${name}! May your ${age ? `${age}th` : 'special'} year be filled with joy, success, and amazing adventures! ${zodiac} energy is strong today! ✨`,
    `🎂 Wishing you the happiest of birthdays, ${name}! ${age ? `${age} years of awesome!` : 'Another year of greatness!'} May all your dreams come true! 🌟`,
    `🎈 Happy Birthday to an amazing person! ${name}, may this new year of life bring you endless happiness and prosperity! ${zodiac} vibes! 💫`,
    `🎊 Celebrating you today, ${name}! ${age ? `${age} years young and` : 'You are'} absolutely wonderful! Wishing you love, laughter, and cake! 🍰`,
    `🌟 Happy Birthday ${name}! Another trip around the sun completed! ${age ? `${age} years of being incredible!` : 'Keep shining bright!'} ${zodiac} power! 🚀`
  ];
  return wishes[Math.floor(Math.random() * wishes.length)];
}

// ----- command -----
module.exports = {
  config: {
    name: "birthday",
    aliases: ["bday", "bd"],
    version: "5.1",
    author: "NAFIJ PRO - 2025 Enhanced with MongoDB (Fixed)",
    countDown: 3,
    role: 0,
    description: "🎂 Advanced birthday management with MongoDB storage, AI wishes, analytics & smart reminders",
    category: "utility",
    guide: {
      en: [
        "📝 BASIC COMMANDS:",
        "{pn} add <DD-MM or DD-MM-YYYY> — Add your birthday",
        "{pn} remove [uid] — Remove birthday",
        "{pn} list — Show all birthdays",
        "{pn} next — Upcoming birthdays (10 days)",
        "",
        "🔧 ADMIN COMMANDS:",
        "{pn} edit <uid> <DD-MM-YYYY> — Edit user birthday",
        "{pn} adduser <uid> <DD-MM-YYYY> — Add birthday for user",
        "",
        "📊 ANALYTICS & FEATURES:",
        "{pn} analytics — Birthday statistics",
        "{pn} zodiac — Zodiac distribution",
        "{pn} countdown <@user> — Birthday countdown",
        "{pn} wish <@user> — Generate AI birthday wish",
        "{pn} time — Current Dhaka time",
        "",
        "⚙️ SETTINGS:",
        "{pn} reminders [on|off] — Toggle birthday reminders",
        "{pn} export — Export birthday data (admin)",
        "{pn} dbstatus — Check database connection status"
      ].join("\n")
    }
  },

  onStart: async function ({ message, args, event, usersData, threadsData }) {
    const sub = (args[0] || "").toLowerCase();
    if (!sub) {
      return message.reply(`🎂 **Birthday Manager 2025 - MongoDB Enhanced**\n\n${this.config.guide.en}`);
    }

    try {
      // Initialize MongoDB connection
      await initPremiumDB();

      // --- DATABASE STATUS ---
      if (sub === "dbstatus") {
        const mongoStatus = premiumDB ? "✅ Connected" : "❌ Not Connected";
        const fallbackStatus = "✅ Available";
        
        return message.reply(`🗄️ **Database Status**\n\n` +
          `📊 **Premium MongoDB:** ${mongoStatus}\n` +
          `💾 **Fallback Storage:** ${fallbackStatus}\n` +
          `🔧 **Current Mode:** ${premiumDB ? 'MongoDB Premium' : 'Fallback Mode'}\n\n` +
          `${premiumDB ? '🚀 Using high-performance MongoDB storage!' : '⚠️ Using fallback storage. Set PREMIUM_DB for enhanced features.'}`);
      }

      // --- ADD birthday (self) ---
      if (sub === "add") {
        const raw = args[1];
        if (!raw) {
          return message.reply("⚠️ **Usage:** `birthday add 02-04-2006`\n📝 Format: DD-MM or DD-MM-YYYY");
        }
        
        const parsed = parseBirthday(raw);
        if (!parsed) {
          return message.reply("❌ **Invalid date format!**\n✅ Use: DD-MM or DD-MM-YYYY (e.g., 15-03-2000)");
        }

        const uid = event.senderID;
        
        // Check if birthday already exists
        let existingBirthday = await getBirthdayFromDB(uid);
        if (!existingBirthday) {
          existingBirthday = await getBirthdayFallback(uid, usersData);
        }
        
        if (existingBirthday?.date) {
          return message.reply(`⚠️ **Birthday already set!**\n📅 Current: ${existingBirthday.date}\n💬 Contact admin to change it.`);
        }

        const name = await usersData.getName(uid) || "Unknown";
        const zodiac = getZodiacSign(parsed.day, parsed.month);
        const age = calculateAge(parsed.day, parsed.month, parsed.year);
        
        // Simplified data structure
        const birthdayData = {
          name: name,
          date: parsed.raw,
          day: parsed.day,
          month: parsed.month,
          year: parsed.year,
          zodiac: zodiac
        };

        // Save to MongoDB first, fallback if needed
        const mongoSaved = await saveBirthdayToDB(uid, birthdayData);
        if (!mongoSaved) {
          await saveBirthdayFallback(uid, birthdayData, usersData);
        }

        return message.reply(`🎉 **Birthday Saved Successfully!**\n👤 Name: ${name}\n📅 Date: ${parsed.raw}\n${zodiac}\n${age ? `🎂 Age: ${age}` : '🎂 Age: Not specified'}\n💾 Storage: ${mongoSaved ? 'MongoDB Premium' : 'Fallback'}\n\n✨ We'll remind everyone on your special day!`);
      }

      // --- EDIT birthday (admin only) ---
      if (sub === "edit") {
        if (event.senderID !== ADMIN_UID) {
          return message.reply("⛔ **Admin Only Command**");
        }
        
        const uid = args[1], raw = args[2];
        if (!uid || !raw) {
          return message.reply("📝 **Usage:** `birthday edit <uid> <DD-MM-YYYY>`");
        }
        
        const parsed = parseBirthday(raw);
        if (!parsed) {
          return message.reply("❌ **Invalid date format!**");
        }

        const name = await usersData.getName(uid) || "Unknown";
        const zodiac = getZodiacSign(parsed.day, parsed.month);

        const birthdayData = {
          name: name,
          date: parsed.raw,
          day: parsed.day,
          month: parsed.month,
          year: parsed.year,
          zodiac: zodiac
        };

        // Save to MongoDB first, fallback if needed
        const mongoSaved = await saveBirthdayToDB(uid, birthdayData);
        if (!mongoSaved) {
          await saveBirthdayFallback(uid, birthdayData, usersData);
        }

        return message.reply(`✅ **Birthday Updated!**\n👤 User: ${name}\n📅 New Date: ${parsed.raw}\n${zodiac}\n💾 Storage: ${mongoSaved ? 'MongoDB Premium' : 'Fallback'}`);
      }

      // --- ADDUSER (admin only) ---
      if (sub === "adduser") {
        if (event.senderID !== ADMIN_UID) {
          return message.reply("⛔ **Admin Only Command**");
        }
        
        const uid = args[1], raw = args[2];
        if (!uid || !raw) {
          return message.reply("📝 **Usage:** `birthday adduser <uid> <DD-MM-YYYY>`");
        }
        
        const parsed = parseBirthday(raw);
        if (!parsed) {
          return message.reply("❌ **Invalid date format!**");
        }

        const name = await usersData.getName(uid) || "Unknown";
        const zodiac = getZodiacSign(parsed.day, parsed.month);

        const birthdayData = {
          name: name,
          date: parsed.raw,
          day: parsed.day,
          month: parsed.month,
          year: parsed.year,
          zodiac: zodiac
        };

        // Save to MongoDB first, fallback if needed
        const mongoSaved = await saveBirthdayToDB(uid, birthdayData);
        if (!mongoSaved) {
          await saveBirthdayFallback(uid, birthdayData, usersData);
        }

        return message.reply(`🎂 **Birthday Added!**\n👤 User: ${name} (${uid})\n📅 Date: ${parsed.raw}\n${zodiac}\n💾 Storage: ${mongoSaved ? 'MongoDB Premium' : 'Fallback'}`);
      }

      // --- REMOVE ---
      if (sub === "remove") {
        const targetUid = args[1] || event.senderID;
        if (targetUid !== event.senderID && event.senderID !== ADMIN_UID) {
          return message.reply("⛔ **Permission Denied**\n💡 You can only remove your own birthday.");
        }
        
        // Check both MongoDB and fallback
        let existingBirthday = await getBirthdayFromDB(targetUid);
        if (!existingBirthday) {
          existingBirthday = await getBirthdayFallback(targetUid, usersData);
        }
        
        if (!existingBirthday?.date) {
          return message.reply("⚠️ **No birthday found** for this user.");
        }

        // Remove from both storages
        await deleteBirthdayFromDB(targetUid);
        try {
          await usersData.set(targetUid, null, "data.birthday");
        } catch (error) {
          console.error("❌ Error removing from fallback:", error.message);
        }

        const name = await usersData.getName(targetUid) || "Unknown";
        return message.reply(`🗑️ **Birthday Removed**\n👤 User: ${name}`);
      }

      // --- LIST all ---
      if (sub === "list") {
        // Get from MongoDB first, then fallback
        let allBirthdays = await getAllBirthdaysFromDB();
        
        // If MongoDB is empty or not available, get from fallback
        if (allBirthdays.length === 0) {
          try {
            const allUsers = await usersData.getAll();
            for (const user of allUsers) {
              if (user.data?.birthday?.date) {
                const [day, month] = user.data.birthday.date.split("-").map(Number);
                allBirthdays.push({
                  userID: user.userID,
                  name: user.name || await usersData.getName(user.userID) || "Unknown",
                  date: user.data.birthday.date,
                  day: day,
                  month: month,
                  year: user.data.birthday.year,
                  zodiac: user.data.birthday.zodiac || getZodiacSign(day, month),
                  source: 'fallback'
                });
              }
            }
          } catch (error) {
            console.error("❌ Error getting fallback birthdays:", error.message);
          }
        }

        if (!allBirthdays.length) {
          return message.reply("📭 **No birthdays saved yet!**\n💡 Use `birthday add DD-MM-YYYY` to add yours!");
        }
        
        allBirthdays.sort((a, b) => (a.month - b.month) || (a.day - b.day));
        const lines = allBirthdays.map((item, i) => {
          const sourceIcon = item.source === 'mongodb' ? '🚀' : '💾';
          return `${i + 1}. 👤 ${item.name} ${sourceIcon}\n   📅 ${item.date} ${item.zodiac}`;
        });
        
        const mongoCount = allBirthdays.filter(b => b.source === 'mongodb').length;
        const fallbackCount = allBirthdays.length - mongoCount;
        
        return message.reply(`🎂 **Birthday Directory** (${allBirthdays.length} total)\n💾 MongoDB: ${mongoCount} | Fallback: ${fallbackCount}\n\n${lines.join("\n\n")}`);
      }

      // --- NEXT birthdays within 10 days ---
      if (sub === "next") {
        const { month, day } = nowDhakaParts();
        
        // Get from both sources
        let allBirthdays = await getAllBirthdaysFromDB();
        if (allBirthdays.length === 0) {
          try {
            const allUsers = await usersData.getAll();
            for (const user of allUsers) {
              if (user.data?.birthday?.date) {
                const [d, m] = user.data.birthday.date.split("-").map(Number);
                allBirthdays.push({
                  userID: user.userID,
                  name: user.name || await usersData.getName(user.userID) || "Unknown",
                  date: user.data.birthday.date,
                  day: d,
                  month: m,
                  zodiac: user.data.birthday.zodiac || getZodiacSign(d, m)
                });
              }
            }
          } catch (error) {
            console.error("❌ Error getting next birthdays:", error.message);
          }
        }

        const upcoming = [];
        for (const item of allBirthdays) {
          const daysLeft = getDaysUntilBirthday(item.day, item.month);
          if (daysLeft <= 10) {
            upcoming.push({
              name: item.name,
              date: item.date,
              in: daysLeft,
              zodiac: item.zodiac
            });
          }
        }

        if (!upcoming.length) {
          return message.reply("📭 **No upcoming birthdays** in the next 10 days!");
        }
        
        upcoming.sort((a, b) => a.in - b.in);
        const lines = upcoming.map(u => {
          const emoji = u.in === 0 ? "🎉" : u.in === 1 ? "🎈" : "🎂";
          const timeText = u.in === 0 ? "TODAY!" : u.in === 1 ? "TOMORROW" : `in ${u.in} days`;
          return `${emoji} **${u.name}** — ${u.date} ${u.zodiac}\n   ⏰ ${timeText}`;
        });
        
        return message.reply(`📅 **Upcoming Birthdays**\n\n${lines.join("\n\n")}`);
      }

      // --- ANALYTICS ---
      if (sub === "analytics") {
        // Get comprehensive data from both sources
        let allBirthdays = await getAllBirthdaysFromDB();
        if (allBirthdays.length === 0) {
          try {
            const allUsers = await usersData.getAll();
            for (const user of allUsers) {
              if (user.data?.birthday?.date) {
                const [day, month, year] = user.data.birthday.date.split("-").map(Number);
                allBirthdays.push({
                  userID: user.userID,
                  name: user.name || "Unknown",
                  date: user.data.birthday.date,
                  day: day,
                  month: month,
                  year: year,
                  zodiac: user.data.birthday.zodiac || getZodiacSign(day, month)
                });
              }
            }
          } catch (error) {
            console.error("❌ Error getting analytics data:", error.message);
          }
        }
        
        if (!allBirthdays.length) {
          return message.reply("📊 **No birthday data** available for analytics!");
        }

        const monthCounts = {};
        const zodiacCounts = {};
        let totalWithAge = 0;
        let avgAge = 0;

        for (const item of allBirthdays) {
          const { month, year, zodiac } = item;
          monthCounts[month] = (monthCounts[month] || 0) + 1;
          zodiacCounts[zodiac] = (zodiacCounts[zodiac] || 0) + 1;
          
          if (year) {
            const age = calculateAge(item.day, month, year);
            if (age) {
              avgAge += age;
              totalWithAge++;
            }
          }
        }

        const months = ["", "Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
        const topMonth = Object.entries(monthCounts).sort((a, b) => b[1] - a[1])[0];
        const topZodiac = Object.entries(zodiacCounts).sort((a, b) => b[1] - a[1])[0];
        
        avgAge = totalWithAge > 0 ? Math.round(avgAge / totalWithAge) : 0;

        const mongoCount = allBirthdays.filter(b => b.source === 'mongodb').length;
        const fallbackCount = allBirthdays.length - mongoCount;

        return message.reply(`📊 **Birthday Analytics 2025**\n\n` +
          `📈 **Total Birthdays:** ${allBirthdays.length}\n` +
          `🚀 **MongoDB Storage:** ${mongoCount}\n` +
          `💾 **Fallback Storage:** ${fallbackCount}\n` +
          `🏆 **Most Popular Month:** ${months[topMonth[0]]} (${topMonth[1]} birthdays)\n` +
          `⭐ **Most Common Sign:** ${topZodiac[0]} (${topZodiac[1]} people)\n` +
          `🎂 **Average Age:** ${avgAge > 0 ? `${avgAge} years` : 'Not available'}\n` +
          `📅 **This Month:** ${monthCounts[nowDhakaParts().month] || 0} birthdays`);
      }

      // --- ZODIAC distribution ---
      if (sub === "zodiac") {
        let allBirthdays = await getAllBirthdaysFromDB();
        if (allBirthdays.length === 0) {
          try {
            const allUsers = await usersData.getAll();
            for (const user of allUsers) {
              if (user.data?.birthday?.date) {
                const [day, month] = user.data.birthday.date.split("-").map(Number);
                allBirthdays.push({
                  zodiac: user.data.birthday.zodiac || getZodiacSign(day, month)
                });
              }
            }
          } catch (error) {
            console.error("❌ Error getting zodiac data:", error.message);
          }
        }

        const zodiacCounts = {};
        for (const item of allBirthdays) {
          const zodiac = item.zodiac;
          zodiacCounts[zodiac] = (zodiacCounts[zodiac] || 0) + 1;
        }

        if (!Object.keys(zodiacCounts).length) {
          return message.reply("📭 **No zodiac data** available!");
        }

        const sorted = Object.entries(zodiacCounts).sort((a, b) => b[1] - a[1]);
        const lines = sorted.map(([sign, count], i) => `${i + 1}. ${sign} — ${count} ${count === 1 ? 'person' : 'people'}`);
        
        return message.reply(`⭐ **Zodiac Distribution**\n\n${lines.join("\n")}`);
      }

      // --- COUNTDOWN for specific user ---
      if (sub === "countdown") {
        const targetUid = Object.keys(event.mentions)[0] || args[1] || event.senderID;
        
        // Check MongoDB first, then fallback
        let birthdayData = await getBirthdayFromDB(targetUid);
        if (!birthdayData) {
          birthdayData = await getBirthdayFallback(targetUid, usersData);
        }
        
        if (!birthdayData?.date) {
          return message.reply("⚠️ **No birthday found** for this user!");
        }

        const name = birthdayData.name || await usersData.getName(targetUid) || "Unknown";
        const daysLeft = getDaysUntilBirthday(birthdayData.day, birthdayData.month);
        const age = birthdayData.year ? calculateAge(birthdayData.day, birthdayData.month, birthdayData.year) : null;

        let countdownText;
        if (daysLeft === 0) {
          countdownText = "🎉 **TODAY IS THE DAY!** 🎉";
        } else if (daysLeft === 1) {
          countdownText = "🎈 **TOMORROW!** Get ready to celebrate!";
        } else {
          countdownText = `⏰ **${daysLeft} days to go!**`;
        }

        return message.reply(`🎂 **Birthday Countdown**\n\n` +
          `👤 **${name}**\n` +
          `📅 ${birthdayData.date} ${birthdayData.zodiac}\n` +
          `${age ? `🎂 Turning ${age + 1}` : '🎂 Age: Not specified'}\n\n` +
          `${countdownText}`);
      }

      // --- AI WISH generator ---
      if (sub === "wish") {
        const targetUid = Object.keys(event.mentions)[0] || args[1];
        if (!targetUid) {
          return message.reply("⚠️ **Tag someone** to generate a birthday wish!");
        }
        
        // Check MongoDB first, then fallback
        let birthdayData = await getBirthdayFromDB(targetUid);
        if (!birthdayData) {
          birthdayData = await getBirthdayFallback(targetUid, usersData);
        }
        
        if (!birthdayData?.date) {
          return message.reply("⚠️ **No birthday found** for this user!");
        }

        const name = birthdayData.name || await usersData.getName(targetUid) || "Unknown";
        const age = birthdayData.year ? calculateAge(birthdayData.day, birthdayData.month, birthdayData.year) + 1 : null;

        const aiWish = await generateAIWish(name, age, birthdayData.zodiac);
        return message.reply(`🤖 **AI-Generated Birthday Wish**\n\n${aiWish}`);
      }

      // --- REMINDERS toggle ---
      if (sub === "reminders") {
        const setting = args[1]?.toLowerCase();
        if (!["on", "off"].includes(setting)) {
          return message.reply("⚙️ **Usage:** `birthday reminders on` or `birthday reminders off`");
        }

        try {
          const threadData = await threadsData.get(event.threadID) || {};
          await threadsData.set(event.threadID, {
            birthdayReminders: setting === "on"
          }, "data");

          return message.reply(`${setting === "on" ? "🔔" : "🔕"} **Birthday reminders ${setting === "on" ? "enabled" : "disabled"}** for this group!`);
        } catch (error) {
          console.error("❌ Error setting reminders:", error.message);
          return message.reply("❌ **Error setting reminders**. Please try again.");
        }
      }

      // --- EXPORT data (admin only) ---
      if (sub === "export") {
        if (event.senderID !== ADMIN_UID) {
          return message.reply("⛔ **Admin Only Command**");
        }
        
        // Get comprehensive data from both sources
        let allBirthdays = await getAllBirthdaysFromDB();
        const fallbackBirthdays = [];
        
        try {
          const allUsers = await usersData.getAll();
          for (const user of allUsers) {
            if (user.data?.birthday?.date) {
              // Check if not already in MongoDB
              if (!allBirthdays.find(b => b.userID === user.userID)) {
                fallbackBirthdays.push({
                  userID: user.userID,
                  name: user.name || "Unknown",
                  date: user.data.birthday.date,
                  day: user.data.birthday.day,
                  month: user.data.birthday.month,
                  year: user.data.birthday.year,
                  zodiac: user.data.birthday.zodiac,
                  source: 'fallback'
                });
              }
            }
          }
        } catch (error) {
          console.error("❌ Error getting export data:", error.message);
        }
        
        const combinedBirthdays = [...allBirthdays, ...fallbackBirthdays];

        if (!combinedBirthdays.length) {
          return message.reply("📭 **No birthday data** to export!");
        }

        const csvData = "UID,Name,Birthday,Zodiac,Source\n" + 
          combinedBirthdays.map(b => `${b.userID},"${b.name}",${b.date},${b.zodiac},${b.source || 'unknown'}`).join("\n");
        
        const fs = require("fs-extra");
        const filePath = `${process.cwd()}/cache/birthdays_export_${Date.now()}.csv`;
        fs.writeFileSync(filePath, csvData);
        
        return message.reply({
          body: `📊 **Birthday Data Export**\n📁 ${combinedBirthdays.length} records exported\n🚀 MongoDB: ${allBirthdays.length}\n💾 Fallback: ${fallbackBirthdays.length}`,
          attachment: fs.createReadStream(filePath)
        });
      }

      // --- SHOW current Dhaka time ---
      if (sub === "time") {
        const { year, month, day, hour, minute, second } = nowDhakaParts();
        const timeStr = `${String(day).padStart(2, "0")}-${String(month).padStart(2, "0")}-${year} ${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}:${String(second).padStart(2, "0")}`;
        
        return message.reply(`🕒 **Current Dhaka Time**\n📅 ${timeStr}\n🌍 Asia/Dhaka Timezone`);
      }

      return message.reply(`❌ **Unknown command!**\n💡 Use \`birthday\` to see all available commands.`);

    } catch (error) {
      console.error("Birthday command error:", error);
      return message.reply(`❌ **Error occurred:** ${error.message}\n🔧 Please try again or contact admin.`);
    }
  },

  // Auto birthday checker (runs daily) - simplified to avoid deep nesting
  onChat: async function ({ event, message, usersData, threadsData }) {
    try {
      // Only check once per day per thread
      const threadData = await threadsData.get(event.threadID) || {};
      const lastCheck = threadData.data?.lastBirthdayCheck || 0;
      const now = Date.now();
      
      // Check only once every 24 hours
      if (now - lastCheck < 24 * 60 * 60 * 1000) return;
      
      // Update last check time with simplified structure
      try {
        await threadsData.set(event.threadID, now, "data.lastBirthdayCheck");
      } catch (error) {
        console.error("❌ Error updating last check time:", error.message);
        return;
      }

      // Check if reminders are enabled for this thread
      if (threadData.data?.birthdayReminders === false) return;

      const { month, day } = nowDhakaParts();
      const todayBirthdays = [];

      // Check MongoDB first
      await initPremiumDB();
      let allBirthdays = await getAllBirthdaysFromDB();
      
      // If MongoDB is empty, check fallback
      if (allBirthdays.length === 0) {
        try {
          const allUsers = await usersData.getAll();
          for (const user of allUsers) {
            if (user.data?.birthday?.date) {
              const [d, m] = user.data.birthday.date.split("-").map(Number);
              if (d === day && m === month) {
                allBirthdays.push({
                  userID: user.userID,
                  name: user.name || await usersData.getName(user.userID) || "Unknown",
                  date: user.data.birthday.date,
                  day: d,
                  month: m,
                  year: user.data.birthday.date.split("-")[2],
                  zodiac: user.data.birthday.zodiac || getZodiacSign(d, m)
                });
              }
            }
          }
        } catch (error) {
          console.error("❌ Error checking today's birthdays:", error.message);
          return;
        }
      } else {
        // Filter MongoDB results for today
        allBirthdays = allBirthdays.filter(item => 
          item.day === day && item.month === month
        );
      }

      for (const item of allBirthdays) {
        const age = item.year ? calculateAge(item.day, item.month, parseInt(item.year)) + 1 : null;
        todayBirthdays.push({
          name: item.name,
          uid: item.userID,
          zodiac: item.zodiac,
          age: age
        });
      }

      if (todayBirthdays.length > 0) {
        for (const birthday of todayBirthdays) {
          try {
            const aiWish = await generateAIWish(birthday.name, birthday.age, birthday.zodiac);
            
            setTimeout(() => {
              message.send(`🎉🎂 **BIRTHDAY ALERT!** 🎂🎉\n\n${aiWish}\n\n🎈 Everyone wish ${birthday.name} a happy birthday! 🎈`);
            }, Math.random() * 5000); // Random delay to avoid spam
          } catch (error) {
            console.error("❌ Error sending birthday message:", error.message);
          }
        }
      }
    } catch (error) {
      console.error("❌ Birthday onChat error:", error.message);
    }
  }
};
