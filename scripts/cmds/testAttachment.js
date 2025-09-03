const { safeResolveAttachmentUrl } = require("./utils"); // utils.js থেকে import
const { resolveAttachmentUrl } = require("priyanshu-fca/src/listenMqtt.js"); // মূল লাইব্রেরি path

module.exports = {
    config: {
        name: "testAttachment",
        version: "1.0",
        author: "You",
        role: 0,
        description: { en: "Test attachment safely", vi: "Ki kore test korbo" },
        category: "fun",
        guide: { en: "{pn}", vi: "{pn}" }
    },

    langs: { en: { success: "URL resolved!" }, vi: { success: "URL resolved!" } },

    onStart: async function({ message }) {
        const attachment = message.attachment; // user থেকে আসা attachment
        const url = safeResolveAttachmentUrl(resolveAttachmentUrl, attachment);

        if (!url) return message.reply("Could not resolve URL safely!");
        return message.reply(`Resolved URL: ${url}`);
    }
};
