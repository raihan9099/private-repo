const axios = require('axios');
const fs = require('fs');
const path = require('path');

module.exports = {
  config: {
    name: 'dl',
    aliases: ['Alldl'],
    category: 'alldl',
    author: 'Nyx'
  },

  onStart: async ({ message, args, api }) => {
    const url = args.join(' ');

    if (!url) return;

    const supportedPlatforms = [
      "https://vt.tiktok.com",
      "https://vm.tiktok.com",
      "https://www.tiktok.com/",
      "https://www.facebook.com",
      "https://fb.watch",
      "https://www.instagram.com/",
      "https://www.instagram.com/p/",
      "https://x.com/",
      "https://twitter.com/",
      "https://pin.it/"
    ];

    if (supportedPlatforms.some(prefix => url.startsWith(prefix))) {
      const loadingMessage = await message.reply('📥 Downloading your video... Please wait!');

      try {
        const { data } = await axios.get(`https://www.x-noobs-apis.42web.io/m/alldl?url=${encodeURIComponent(url)}`);
        if (!data.status || !data.url) throw new Error("Missing video URL.");

        const filePath = path.join(__dirname, 'temp_video.mp4');
        const writer = fs.createWriteStream(filePath);

        const videoStream = await axios({ url: data.url, responseType: 'stream' });
        videoStream.data.pipe(writer);

        await new Promise((resolve, reject) => {
          writer.on('finish', resolve);
          writer.on('error', reject);
        });

        await message.reply({
          body: 'Here Your Video bby 😘',
          attachment: fs.createReadStream(filePath)
        });

        await api.unsendMessage(loadingMessage.messageID);
        fs.unlink(filePath, err => err && console.error('Temp delete failed:', err));

      } catch (e) {
        console.error('Error:', e);
        await message.reply('❌ Could not download the video.');
        await api.unsendMessage(loadingMessage.messageID);
      }

    } else {
      await message.reply('❌ Unsupported URL. Please provide a valid video link from supported platforms.');
    }
  }
};
