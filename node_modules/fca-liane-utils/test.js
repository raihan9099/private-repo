const liane = require("./");
const { MessengerLia } = liane;
const { std } = MessengerLia;

const bot = new MessengerLia({
  devLog: console.log
});

bot.use(std.failSafe());
bot.use(std.autoCensor("body"));
bot.use(std.boxHelper());
bot.use(std.chatArgs());

bot.on("prefix", ({ box }, { next }) => {
  box.reply("Sorry I have no prefix.");
  next();
});

bot.listen();
