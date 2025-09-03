module.exports = {
	config: {
		name: "count",
		version: "69",
		author: "Mahi--",
		countDown: 10,
		role: 0,
		description: {
			vi: "Xem bảng xếp hạng tin nhắn dưới dạng ảnh (từ lúc bot vào nhóm).",
			en: "View the message count leaderboard as an image (since the bot joined the group)."
		},
		category: "box chat",
		guide: {
			vi: "   {pn}: Xem thẻ hoạt động của bạn."
				+ "\n   {pn} @tag: Xem thẻ hoạt động của người được tag."
				+ "\n   {pn} all: Xem bảng xếp hạng của tất cả thành viên.",
			en: "   {pn}: View your activity card."
				+ "\n   {pn} @tag: View the activity card of tagged users."
				+ "\n   {pn} all: View the leaderboard of all members."
		},
		envConfig: {
			"ACCESS_TOKEN": "6628568379%7Cc1e620fa708a1d5696fb991c1bde5662"
		}
	},

	langs: {
		vi: {
			invalidPage: "Số trang không hợp lệ.",
			leaderboardTitle: "BẢNG XẾP HẠNG HOẠT ĐỘNG NHÓM",
			userCardTitle: "THẺ HOẠT ĐỘNG",
			page: "Trang %1/%2",
			reply: "Phản hồi tin nhắn này kèm số trang để xem tiếp.",
			totalMessages: "Tổng Tin Nhắn",
			serverRank: "Hạng Server",
			dailyActivity: "Hoạt Động 7 Ngày Qua",
			messageBreakdown: "Phân Tích Tin Nhắn",
			busiestDay: "NGÀY BẬN RỘN NHẤT",
			text: "Văn Bản",
			sticker: "Nhãn Dán",
			media: "Tệp",
			fallbackName: "Người dùng Facebook"
		},
		en: {
			invalidPage: "Invalid page number.",
			leaderboardTitle: "GROUP ACTIVITY LEADERBOARD",
			userCardTitle: "ACTIVITY CARD",
			page: "Page %1/%2",
			reply: "Reply to this message with a page number to see more.",
			totalMessages: "Total Messages",
			serverRank: "Server Rank",
			dailyActivity: "Last 7 Days Activity",
			messageBreakdown: "Message Breakdown",
			busiestDay: "BUSIEST DAY",
			text: "Text",
			sticker: "Sticker",
			media: "Media",
			fallbackName: "Facebook User"
		}
	},

	onLoad: function () {
		const { resolve } = require("path");
		const { existsSync, mkdirSync } = require("fs-extra");
		const { execSync } = require("child_process");

		console.log("COMMAND: COUNT | Checking for required packages...");
		const packages = ["canvas", "axios", "fs-extra", "moment-timezone"];
		for (const pkg of packages) {
			try {
				require.resolve(pkg);
			} catch (err) {
				console.error(`COMMAND: COUNT | Dependency '${pkg}' not found. Installing...`);
				try {
					execSync(`npm install ${pkg}`, { stdio: "inherit" });
				} catch (installErr) {
					console.error(`COMMAND: COUNT | Failed to install '${pkg}'. Please run 'npm install ${pkg}' manually and restart the bot.`);
					throw new Error(`Dependency installation failed for ${pkg}`);
				}
			}
		}

		try {
			const { registerFont } = require("canvas");
			const assetsPath = resolve(__dirname, "assets", "count");
			if (!existsSync(assetsPath)) mkdirSync(assetsPath, { recursive: true });
			const fontPath = resolve(assetsPath, "font.ttf");
			if (existsSync(fontPath)) {
				registerFont(fontPath, { family: "BeVietnamPro" });
			} else {
				console.log("COMMAND: COUNT | Custom font not found, using system fonts.");
			}
		} catch (e) {
			console.error("COMMAND: COUNT | Canvas is not installed correctly, cannot load fonts.", e);
		}
	},

	onChat: async function ({ event, threadsData, usersData }) {
		const { threadID, senderID } = event;
		const { resolve } = require("path");
		const { readJsonSync, writeJsonSync, ensureFileSync } = require("fs-extra");
		const moment = require("moment-timezone");

		try {
			const members = await threadsData.get(threadID, "members");
			const findMember = members.find(function (user) { return user.userID == senderID; });
			if (!findMember) {
				members.push({
					userID: senderID,
					name: await usersData.getName(senderID),
					count: 1
				});
			} else {
				findMember.count = (findMember.count || 0) + 1;
			}
			await threadsData.set(threadID, members, "members");
		} catch (err) {
			console.error("COMMAND: COUNT | Failed to update count data:", err);
		}

		const dataPath = resolve(__dirname, "cache", "count_activity.json");
		ensureFileSync(dataPath);

		let activityData = {};
		try { activityData = readJsonSync(dataPath); } catch { /* ignore empty file */ }
		if (!activityData[threadID]) activityData[threadID] = {};
		if (!activityData[threadID][senderID]) {
			activityData[threadID][senderID] = {
				total: 0,
				types: { text: 0, sticker: 0, media: 0 },
				daily: {}
			};
		}

		const user = activityData[threadID][senderID];
		const today = moment().tz("Asia/Ho_Chi_Minh").format("YYYY-MM-DD");
		user.total = (user.total || 0) + 1;
		user.daily[today] = (user.daily[today] || 0) + 1;

		if (event.attachments.some(function (att) { return att.type === 'sticker'; })) {
			user.types.sticker = (user.types.sticker || 0) + 1;
		} else if (event.attachments.length > 0) {
			user.types.media = (user.types.media || 0) + 1;
		} else {
			user.types.text = (user.types.text || 0) + 1;
		}

		const sortedDays = Object.keys(user.daily).sort(function (a, b) { return new Date(b) - new Date(a); });
		if (sortedDays.length > 7) {
			for (let i = 7; i < sortedDays.length; i++) {
				delete user.daily[sortedDays[i]];
			}
		}
		writeJsonSync(dataPath, activityData, { spaces: 2 });
	},

	onStart: async function ({ args, threadsData, message, event, api, getLang, envCommands }) {
		const { Canvas, loadImage } = require("canvas");
		const { resolve } = require("path");
		const { createWriteStream, readJsonSync, ensureFileSync } = require("fs-extra");
		const axios = require("axios");
		const moment = require("moment-timezone");
		const { threadID, senderID, mentions } = event;

		const ACCESS_TOKEN = envCommands.count.ACCESS_TOKEN;

		// --- Data Preparation --- //
		const threadData = await threadsData.get(threadID);
		const dataPath = resolve(__dirname, "cache", "count_activity.json");
		ensureFileSync(dataPath);
		let activityData = {};
		try {
			activityData = readJsonSync(dataPath)[threadID] || {};
		} catch { /* file is empty */ }

		const usersInGroup = (await api.getThreadInfo(threadID)).participantIDs;
		let combinedData = [];

		for (const user of threadData.members) {
			if (!usersInGroup.includes(user.userID)) continue;
			const activity = activityData[user.userID] || {
				total: user.count || 0,
				types: { text: 0, sticker: 0, media: 0 },
				daily: {}
			};
			combinedData.push({
				uid: user.userID,
				name: user.name || getLang("fallbackName"),
				count: user.count || 0,
				activity: activity
			});
		}
		
		combinedData.sort(function(a, b) { return b.count - a.count; });
		combinedData.forEach(function(user, index) { user.rank = index + 1; });
		
		const getAvatar = async function (uid, name) {
			try {
				const url = `https://graph.facebook.com/${uid}/picture?width=512&height=512&access_token=${ACCESS_TOKEN}`;
				const response = await axios.get(url, { responseType: 'arraybuffer' });
				return await loadImage(response.data);
			} catch (error) {
				const canvas = new Canvas(512, 512);
				const ctx = canvas.getContext('2d');
				const colors = ['#f44336', '#e91e63', '#9c27b0', '#673ab7', '#3f51b5', '#2196f3', '#03a9f4', '#00bcd4', '#009688', '#4caf50', '#8bc34a', '#cddc39', '#ffeb3b', '#ffc107', '#ff9800', '#ff5722'];
				const bgColor = colors[parseInt(uid) % colors.length];
				ctx.fillStyle = bgColor;
				ctx.fillRect(0, 0, 512, 512);
				ctx.fillStyle = '#FFFFFF';
				ctx.font = '256px sans-serif';
				ctx.textAlign = 'center';
				ctx.textBaseline = 'middle';
				ctx.fillText(name.charAt(0).toUpperCase(), 256, 256);
				return await loadImage(canvas.toBuffer());
			}
		};
		const drawGlowingText = function (ctx, text, x, y, color, size, blur = 15) {
			ctx.font = `bold ${size}px "BeVietnamPro", "sans-serif"`;
			ctx.shadowColor = color;
			ctx.shadowBlur = blur;
			ctx.fillStyle = color;
			ctx.fillText(text, x, y);
			ctx.shadowBlur = 0;
		};
		const fitText = function (ctx, text, maxWidth) {
			let currentText = text;
			if (ctx.measureText(currentText).width > maxWidth) {
				while (ctx.measureText(currentText + '...').width > maxWidth) {
					currentText = currentText.slice(0, -1);
				}
				return currentText + '...';
			}
			return currentText;
		};
		const drawCircularAvatar = function (ctx, avatar, x, y, radius) {
			ctx.save();
			ctx.beginPath();
			ctx.arc(x, y, radius, 0, Math.PI * 2, true);
			ctx.closePath();
			ctx.clip();
			ctx.drawImage(avatar, x - radius, y - radius, radius * 2, radius * 2);
			ctx.restore();
		};
		
		if (args[0] && args[0].toLowerCase() === 'all') {
			const theme = { primary: '#00FFFF', secondary: '#8B949E', bg: ['#010409', '#0D1117'] };
			const usersPerPage = 10;
			const leaderboardUsers = combinedData.filter(function (u) { return u.rank > 3; });
			const totalPages = Math.ceil(leaderboardUsers.length / usersPerPage) || 1;
			let page = parseInt(args[1]) || 1;
			if (page < 1 || page > totalPages) page = 1;
			const startIndex = (page - 1) * usersPerPage;
			const pageUsers = leaderboardUsers.slice(startIndex, startIndex + usersPerPage);
			const canvas = new Canvas(1200, 1700);
			const ctx = canvas.getContext('2d');
			const bgGradient = ctx.createLinearGradient(0, 0, 0, 1700);
			bgGradient.addColorStop(0, theme.bg[0]);
			bgGradient.addColorStop(1, theme.bg[1]);
			ctx.fillStyle = bgGradient;
			ctx.fillRect(0, 0, 1200, 1700);
			ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
			ctx.lineWidth = 1;
			for (let i = 0; i < 1200; i += 40) { ctx.beginPath(); ctx.moveTo(i, 0); ctx.lineTo(i, 1700); ctx.stroke(); }
			for (let i = 0; i < 1700; i += 40) { ctx.beginPath(); ctx.moveTo(0, i); ctx.lineTo(1200, i); ctx.stroke(); }
			ctx.textAlign = 'center';
			drawGlowingText(ctx, getLang("leaderboardTitle"), 600, 100, theme.primary, 60);
			const top3 = combinedData.slice(0, 3);
			const podColors = ['#FFD700', '#C0C0C0', '#CD7F32'];
			const podPositions = [ { x: 600, y: 300, r: 100 }, { x: 250, y: 320, r: 80 }, { x: 950, y: 320, r: 80 } ];
			const rankOrder = [1, 0, 2];
			for(const i of rankOrder) {
				const user = top3[i];
				if (!user) continue;
				const pos = podPositions[i];
				ctx.strokeStyle = podColors[i];
				ctx.lineWidth = 5;
				ctx.shadowColor = podColors[i];
				ctx.shadowBlur = 20;
				ctx.beginPath(); ctx.arc(pos.x, pos.y, pos.r + 5, 0, Math.PI * 2); ctx.stroke();
				ctx.shadowBlur = 0;
				const avatar = await getAvatar(user.uid, user.name);
				drawCircularAvatar(ctx, avatar, pos.x, pos.y, pos.r);
				ctx.textAlign = 'center';
				ctx.font = `bold ${pos.r * 0.3}px "BeVietnamPro", "sans-serif"`;
				ctx.fillStyle = '#FFFFFF';
				ctx.fillText(fitText(ctx, user.name, pos.r * 2.2), pos.x, pos.y + pos.r + 40);
				ctx.font = `normal ${pos.r * 0.25}px "BeVietnamPro", "sans-serif"`;
				ctx.fillStyle = theme.secondary;
				ctx.fillText(`${user.count} msgs`, pos.x, pos.y + pos.r + 75);
				ctx.fillStyle = podColors[i];
				ctx.beginPath(); ctx.arc(pos.x, pos.y - pos.r + 10, 25, 0, Math.PI * 2); ctx.fill();
				ctx.fillStyle = '#000000';
				ctx.font = `bold 30px "BeVietnamPro", "sans-serif"`;
				ctx.fillText(`#${user.rank}`, pos.x, pos.y - pos.r + 20);
			}
			let currentY = 550;
			for (const user of pageUsers) {
				ctx.fillStyle = 'rgba(255, 255, 255, 0.03)';
				ctx.fillRect(50, currentY, 1100, 90);
				ctx.textAlign = 'center';
				ctx.font = `bold 30px "BeVietnamPro", "sans-serif"`;
				ctx.fillStyle = theme.secondary;
				ctx.fillText(`#${user.rank}`, 100, currentY + 58);
				const avatar = await getAvatar(user.uid, user.name);
				drawCircularAvatar(ctx, avatar, 190, currentY + 45, 30);
				ctx.textAlign = 'left';
				ctx.fillStyle = '#FFFFFF';
				ctx.font = `bold 30px "BeVietnamPro", "sans-serif"`;
				ctx.fillText(fitText(ctx, user.name, 350), 240, currentY + 58);
				ctx.textAlign = 'right';
				ctx.font = `bold 30px "BeVietnamPro", "sans-serif"`;
				ctx.fillStyle = theme.primary;
				ctx.fillText(user.count, 1130, currentY + 58);
				const barMaxWidth = 350;
				const barStartX = 750;
				const progress = (user.count / (top3[0] ? top3[0].count : user.count)) * barMaxWidth;
				ctx.fillStyle = 'rgba(255, 255, 255, 0.1)';
				ctx.fillRect(barStartX, currentY + 35, barMaxWidth, 20);
				ctx.fillStyle = theme.primary;
				ctx.fillRect(barStartX, currentY + 35, progress, 20);
				currentY += 105;
			}
			ctx.textAlign = 'center';
			ctx.fillStyle = theme.secondary;
			ctx.font = `normal 24px "BeVietnamPro", "sans-serif"`;
			ctx.fillText(getLang("page", page, totalPages), 600, 1630);
			ctx.fillText(getLang("reply"), 600, 1660);
			const path = resolve(__dirname, 'cache', `leaderboard_${threadID}.png`);
			const out = createWriteStream(path);
			const stream = canvas.createPNGStream();
			stream.pipe(out);
			out.on('finish', function() {
				message.reply({ attachment: require('fs').createReadStream(path) }, function (err, info) {
					if (err) return console.error(err);
					global.GoatBot.onReply.set(info.messageID, { commandName: "count", messageID: info.messageID, author: senderID, threadID: threadID, type: 'leaderboard' });
				});
			});
		} else {
			const targetUsers = Object.keys(mentions).length > 0 ? Object.keys(mentions) : [senderID];
			for(const uid of targetUsers) {
				const user = combinedData.find(function(u) { return u.uid == uid; });
				if (!user) continue;
				const theme = { primary: '#00FF00', secondary: '#A8A8A8', bg: ['#000000', '#030703'] };
				const canvas = new Canvas(800, 1200);
				const ctx = canvas.getContext('2d');
				const bgGradient = ctx.createLinearGradient(0, 0, 0, 1200);
				bgGradient.addColorStop(0, theme.bg[0]);
				bgGradient.addColorStop(1, theme.bg[1]);
				ctx.fillStyle = bgGradient;
				ctx.fillRect(0, 0, 800, 1200);
				ctx.textAlign = 'center';
				drawGlowingText(ctx, getLang("userCardTitle"), 400, 80, theme.primary, 50, 20);
				const avatar = await getAvatar(user.uid, user.name);
				drawCircularAvatar(ctx, avatar, 400, 220, 100);
				ctx.font = `bold 40px "BeVietnamPro", "sans-serif"`;
				ctx.fillStyle = '#FFFFFF';
				ctx.fillText(fitText(ctx, user.name, 600), 400, 360);
				const statsY = 450;
				ctx.beginPath(); ctx.moveTo(400, statsY - 25); ctx.lineTo(400, statsY + 70);
				ctx.strokeStyle = theme.secondary; ctx.lineWidth = 1; ctx.stroke();
				ctx.font = `bold 24px "BeVietnamPro", "sans-serif"`;
				ctx.fillStyle = theme.secondary;
				ctx.fillText(getLang("serverRank"), 250, statsY);
				ctx.fillText(getLang("totalMessages"), 550, statsY);
				ctx.font = `bold 55px "BeVietnamPro", "sans-serif"`;
				ctx.fillStyle = theme.primary;
				ctx.fillText(`#${user.rank}`, 250, statsY + 55);
				ctx.fillText(user.count, 550, statsY + 55);
				const dailyData = user.activity.daily;
				const days = [];
				for(let i=6; i>=0; i--) {
					const day = moment().tz("Asia/Ho_Chi_Minh").subtract(i, 'days');
					days.push({ label: day.format('dddd'), shortLabel: day.format('ddd'), count: dailyData[day.format('YYYY-MM-DD')] || 0 });
				}
				const busiestDay = days.reduce(function (p, c) { return p.count > c.count ? p : c; }, {count: -1});
				const busiestY = 620;
				ctx.font = `bold 24px "BeVietnamPro", "sans-serif"`;
				ctx.fillStyle = theme.secondary;
				ctx.fillText(getLang("busiestDay").toUpperCase(), 400, busiestY);
				ctx.font = `bold 32px "BeVietnamPro", "sans-serif"`;
				ctx.fillStyle = '#FFFFFF';
				if (busiestDay.count > 0) {
					ctx.fillText(`${busiestDay.label} - ${busiestDay.count} msgs`, 400, busiestY + 45);
				} else {
					ctx.fillText(`N/A`, 400, busiestY + 45);
				}
				const graphY_start = 740;
				ctx.textAlign = 'left';
				ctx.fillStyle = theme.secondary;
				ctx.font = `bold 24px "BeVietnamPro", "sans-serif"`;
				ctx.fillText(getLang("dailyActivity"), 80, graphY_start);
				const graphX = 80, graphBaseY = 950, graphW = 640, graphH = 150;
				ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
				ctx.lineWidth = 1;
				ctx.strokeRect(graphX, graphBaseY - graphH, graphW, graphH);
				const maxCount = Math.max.apply(null, days.map(function(d) { return d.count; })) || 1;
				ctx.beginPath();
				ctx.moveTo(graphX, graphBaseY - (days[0].count / maxCount * graphH));
				ctx.strokeStyle = theme.primary;
				ctx.lineWidth = 3;
				days.forEach(function(day, i) {
					const x = graphX + (i / 6) * graphW;
					const y = graphBaseY - (day.count / maxCount * graphH);
					ctx.lineTo(x, y);
					ctx.textAlign = 'center';
					ctx.fillStyle = theme.secondary;
					ctx.font = '18px "BeVietnamPro", "sans-serif"';
					ctx.fillText(day.shortLabel, x, graphBaseY + 25);
				});
				ctx.stroke();
				const breakdownY_start = 1020;
				ctx.textAlign = 'left';
				ctx.fillStyle = theme.secondary;
				ctx.font = `bold 24px "BeVietnamPro", "sans-serif"`;
				ctx.fillText(getLang("messageBreakdown"), 80, breakdownY_start);
				const types = user.activity.types;
				const totalTypes = types.text + types.sticker + types.media;
				const breakdownData = [
					{ label: getLang("text"), value: types.text, color: theme.primary },
					{ label: getLang("sticker"), value: types.sticker, color: '#F4E409' },
					{ label: getLang("media"), value: types.media, color: '#00FFFF' }
				];
				const donutX = 180, donutY = breakdownY_start + 80, donutR = 60;
				let startAngle = -0.5 * Math.PI;
				if (totalTypes > 0) {
					breakdownData.forEach(function(item) {
						const sliceAngle = (item.value / totalTypes) * 2 * Math.PI;
						if (sliceAngle > 0) {
							ctx.beginPath();
							ctx.moveTo(donutX, donutY);
							ctx.arc(donutX, donutY, donutR, startAngle, startAngle + sliceAngle);
							ctx.closePath();
							ctx.fillStyle = item.color;
							ctx.fill();
						}
						startAngle += sliceAngle;
					});
				} else {
					ctx.beginPath();
					ctx.arc(donutX, donutY, donutR, 0, 2 * Math.PI);
					ctx.fillStyle = theme.secondary;
					ctx.fill();
				}
				let legendY = breakdownY_start + 45;
				breakdownData.forEach(function(item) {
					const percentage = totalTypes > 0 ? (item.value / totalTypes * 100).toFixed(1) : "0.0";
					ctx.fillStyle = item.color;
					ctx.fillRect(350, legendY - 15, 20, 20);
					ctx.fillStyle = '#FFFFFF';
					ctx.textAlign = 'left';
					ctx.font = `bold 22px "BeVietnamPro", "sans-serif"`;
					ctx.fillText(item.label, 380, legendY);
					ctx.fillStyle = theme.secondary;
					ctx.textAlign = 'right';
					ctx.fillText(`${percentage}% (${item.value})`, 720, legendY);
					legendY += 40;
				});
				const path = resolve(__dirname, 'cache', `usercard_${uid}.png`);
				const out = createWriteStream(path);
				const stream = canvas.createPNGStream();
				stream.pipe(out);
				out.on('finish', function() {
					message.reply({ attachment: require('fs').createReadStream(path) });
				});
			}
		}
	},
	
	onReply: async function ({ event, Reply, message, getLang }) {
		if (event.senderID !== Reply.author || Reply.type !== 'leaderboard') return;
		const page = parseInt(event.body);
		if (isNaN(page)) return;
		try {
			message.unsend(Reply.messageID);
			const newArgs = ['all', page.toString()];
			await this.onStart({ 
				...arguments[0], 
				args: newArgs, 
				event: { ...arguments[0].event, body: `/count ${newArgs.join(' ')}` }
			});
		} catch (e) {
			console.error("Error during pagination reply:", e);
			message.reply(getLang("invalidPage"));
		}
	}
};
