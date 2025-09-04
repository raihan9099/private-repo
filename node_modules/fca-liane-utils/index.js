const Filter = require("bad-words");
const filter = new Filter();
const axios = require("axios");

class CassidyWrapper {
  constructor(url) {
    this.url = url ?? "https://cassidy.onrender.com";
  }
  async send(event) {
    const {
      data: { result, status },
    } = await axios.post(`${this.url}/postWReply`, {
      params: event,
    });
    if (status === "success") {
      return result.body;
    } else {
      return null;
    }
  }
  async raw(event) {
    const {
      data: { result, status },
    } = await axios.post(`${this.url}/postWReply`, {
      params: event,
    });
    if (status !== "success") {
      return null;
    }
    return result;
  }
}

class LianeAPI {
  constructor(id, username) {
    this.id = id;
    this.username = username || "unregistered";
    this.url = `https://liaspark.chatbotcommunity.ltd`;
  }
  async ask(entryQuestion, key = "message", { ...extraQuery } = {}) {
    const question = String(entryQuestion);
    const response = await axios.get(
      `${this.url}/@${this.username}/api/${this.id}`,
      {
        params: {
          ...extraQuery,
          query: question,
        },
      },
    );
    return response.data[key || "message"];
  }
  async request(entryQuestion, { ...otherParams } = {}) {
    const question = String(entryQuestion);
    const response = await axios.get(
      `${this.url}/@${this.username}/api/${this.id}`,
      {
        params: {
          query: question,
          ...otherParams,
        },
      },
    );
    return response.data;
  }
  static async aiInfos() {
    const response = await axios.get(`${this.url}/api/myai?type=all&c=only`);
    return response.data;
  }
  async getAiInfo() {
    const infos = await LianeAPI.aiInfos();
    return infos[`${this.id}@${this.username}`];
  }
  apiUrl() {
    return `${this.url}/@${this.username}/api/${this.id}`;
  }
  rawUrl(type) {
    return `${this.url}/raw/${this.username}@${this.id}?type=${type || "botpack"}`;
  }
  static apiUrl(id, username) {
    return new LianeAPI(id, username).apiUrl();
  }
  async raw(type) {
    const { data } = await axios.get(this.rawUrl(type));
    return String(data);
  }
}

function censor(text, addon = []) {
  const customFilter = new Filter({ list: addon.concat(filter.list) });

  const words = text.split(" ");
  const censoredText = words.map((word) => {
    if (customFilter.isProfane(word)) {
      const firstLetter = word.charAt(0);
      const censoredWord = firstLetter + "_".repeat(word.length - 1);
      return censoredWord;
    } else {
      return word;
    }
  });
  return censoredText.join(" ");
}

class Box {
  /**
   * Creates an instance of MessengerAPI.
   * @constructor
   * @param {object} api - The Facebook Messenger API instance.
   * @param {object} event - The event object containing message details.
   * @author Liane Cagara
   * @license MIT
   */
  constructor(api, event, options = { autocensor: true }) {
    if (typeof options === "boolean") {
      options = { autocensor: options };
    }
    this.cassidy = null;
    this.cassMap = new Map();
    this.api = api;
    this.event = event;
    this.lastID = null;
    this.autocensor = !!options.autocensor;
    this.hasListen = false;
    this.willLog = !!options.willLog;
    this.replyWaiter = new Map();
    this.reactWaiter = new Map();
    this.emitter = null;
    this.style = options.style ?? null;
  }
  logger(...data) {
    if (this.willLog) {
      console.log("[ Box ]", ...data);
    }
  }
  async styleText(text) {
    try {
      if (!this.style) {
        return text;
      }
      const { data: result } = await axios.post(
        "https://liaspark.chatbotcommunity.ltd/api/styler",
        {
          ...this.style,
          content: text,
        },
      );
      return result.message;
    } catch {
      return text;
    }
  }
  close() {
    if (!this.hasListen) {
      throw new Error("Not listened yet.");
    }
    return this.emitter.stopListening();
  }
  listen(mainCallback) {
    mainCallback ??= async () => {};
    if (this.hasListen) {
      this.logger("Already listening...");
      return;
    }
    this.hasListen = true;
    this.emitter = this.api.listenMqtt(async (err, event) => {
      let box;
      try {
        if (err) {
          return this.logger(err);
        }
        if (!event) {
          return this.logger("Missing event, skipping...");
        }
        event.body ??= "";
        event.messageReply ??= null;
        box = new Box(this.api, event);

        if (
          event.type === "message_reaction" &&
          this.reactWaiter.has(event.messageID)
        ) {
          let { resolve, reject, callback, ...etc } = this.reactWaiter.get(
            event.messageID,
          );
          if (!resolve || !reject || !callback) {
            throw new Error("Missing resolve, reject, or callback.");
          }
          function deleteWaiter() {
            this.reactWaiter.delete(event.messageID);
          }

          try {
            await callback(
              this.makeObj({ event, resolve, reject, deleteWaiter, ...etc }),
            );
          } catch (err2) {
            reject(err2);
          }
        }
        if (
          event.type === "message_reply" &&
          this.replyWaiter.has(event.messageReply.messageID)
        ) {
          let { resolve, reject, callback, ...etc } = this.replyWaiter.get(
            event.messageReply.messageID,
          );
          if (!resolve || !reject || !callback) {
            throw new Error("Missing resolve, reject, or callback.");
          }
          function deleteWaiter() {
            this.replyWaiter.delete(event.messageReply.messageID);
          }
          try {
            await callback(
              this.makeObj({ event, resolve, reject, deleteWaiter, ...etc }),
            );
          } catch (err2) {
            if (box) box.error(err2);
            reject(err2);
          }
        }
        await mainCallback(this.makeObj({ event }));
      } catch (error) {
        if (box) box.error(error);
        this.logger(error);
      }
    });
  }
  makeObj({ event, resolve, reject, ...extra }) {
    const box = new Box(this.api, event);
    return {
      api: this.api,
      box,
      resolve,
      reject,
      event,
      args: box.args,
      ...extra,
    };
  }
  async cassidy(event, url) {
    if (!this.cassidy || this.cassidy?.url !== url) {
      this.cassidy = new CassidyWrapper(url);
    }
    const box = this;
    const result = await box.cassidy.raw(event);
    const str = result.body;
    if (typeof str === "string" && str.trim() !== "") {
      return this.waitForReply(
        str,
        async ({ event: replyEvent, resolve }) => {
          resolve(await box.cassidy(replyEvent, url));
        },
        result.isReply,
      );
    }
  }
  quickWaitReact(initialText, options = {}) {
    return this.waitForReaction(
      initialText,
      ({ event, resolve, messageInfo, box }) => {
        if (options.author && options.author !== event.userID) {
          return;
        }
        if (options.reaction && event.reaction !== options.reaction) {
          return;
        }
        if (options.edit) {
          box.edit(options.edit, messageInfo.messageID);
        }
        resolve(event);
      },
      options.noReply,
    );
  }
  async waitForReaction(initialText, callback, noReply) {
    callback ??= ({ resolve, event }) => {
      resolve(event);
    };
    if (!this.hasListen) {
      throw new Error(
        "Cannot use Box.waitForReaction without invoking Box.listen()",
      );
    }
    const messageInfo = await this[noReply ? "send" : "reply"](initialText);
    return new Promise((resolve, reject) => {
      this.reactWaiter.set(messageInfo.messageID, {
        resolve,
        reject,
        callback,
        messageInfo,
      });
    });
  }
  async waitForReply(initialText, callback, noReply) {
    callback ??= ({ resolve, event }) => {
      resolve(event);
    };
    if (!this.hasListen) {
      throw new Error(
        "Cannot use Box.waitForReply without invoking Box.listen()",
      );
    }
    const messageInfo = await this[noReply ? "send" : "reply"](initialText);
    return new Promise((resolve, reject) => {
      this.replyWaiter.set(messageInfo.messageID, {
        resolve,
        reject,
        callback,
        messageInfo,
      });
    });
  }
  static create(...args) {
    return new Box(...args);
  }
  static fetch(api, event, ...args) {
    return new Box(api, event).fetch(...args);
  }
  async lianeAPI(id, username, query, options = {}) {
    const ai = new LianeAPI(id, username);
    return this.fetch(ai.apiUrl(), {
      key: "message",
      noEdit: true,
      query: {
        query,
      },
      ...options,
    });
  }
  async onArg(degree, value, callback) {
    const { args } = this;
    let will = false;
    if (args[degree] && args[degree] === value) {
      will = true;
    } else if (
      args[degree] &&
      args[degree].toLowerCase() === value.toLowerCase()
    ) {
      will = true;
    }
    if (!will) {
      return false;
    }
    if (!callback) {
      return true;
    }
    return await callback(args[degree]);
  }
  get args() {
    const { event } = this;
    if (!event.body) {
      return [];
    }
    const [, ...args] = event.body.split(" ").filter(Boolean);
    return args;
  }
  async fetch(entryUrl, entryOptions = {}) {
    const defaultOptions = {
      ignoreError: true,
      key: null,
      wait: "⏳",
      done: "✅",
      asking: `⏳ | Please wait for my response...`,
      callback() {},
      errorText(err) {
        return `❌ ${err.message}\nThis could mean that a server is not available or unable to respond with your api request, please wait until the issue resolves automatically.`;
      },
      process(text) {
        return text;
      },
      axios: {
        params: {},
      },
      query: {},
      noEdit: false,
    };
    const options = { ...defaultOptions, ...entryOptions };
    let url = String(entryUrl).replace(/ /g, "");
    Object.assign(options.axios.params, options.query);
    let info = null;
    if (typeof this.api.editMessage === "function" && !options.noEdit) {
      info = await this.reply(`${options.asking}`);
    }
    try {
      this.react(options.wait);
      const response = await axios.get(url, options.axios);
      let answer = "";
      if (options.key) {
        answer = response.data[options.key];
      } else {
        answer = response.data;
      }
      answer = String(options.process(answer));
      if (!answer) {
        throw new Error("The server didn't answered your request.");
      }
      this.react(options.done);
      if (!info) {
        await this.reply(answer);
        return true;
      }
      return this.edit(answer, info.messageID);
    } catch (err) {
      if (options.ignoreError) {
        return this.reply(options.errorText(err));
      }
      throw err;
    }
  }
  /**
   * Sends a reply message to the specified thread.
   * @param {string | object} msg - The message content.
   * @param {string | number} [thread] - The thread ID to send the message to. Defaults to the current thread.
   * @param {function} [callback] - Optional callback function to execute after sending the message.
   * @returns {Promise<object>} - A promise resolving to the message info.
   */
  async #censor(form) {
    const msg = extractFormBody(form);
    if (!this.autocensor) {
      return msg;
    }
    msg.body = censor(msg.body);
    msg.body = await this.styleText(msg.body);
    return msg;
  }
  reply(msg, thread, callback) {
    return new Promise(async (r) => {
      this.api.sendMessage(
        await this.#censor(msg),
        thread || this.event.threadID,
        async (err, info) => {
          if (err) {
            await this.reply(`❌ ${JSON.stringify(err)}`);
          }

          if (typeof callback === "function") {
            await callback(err, info);
          }
          this.lastID = info?.messageID;
          r(info);
        },
        this.event.messageID,
      );
    });
  }
  /**
   * Sends a message to the specified thread.
   * @param {string | object} msg - The message content.
   * @param {string | number} [thread] - The thread ID to send the message to. Defaults to the current thread.
   * @param {function} [callback] - Optional callback function to execute after sending the message.
   * @returns {Promise<object>} - A promise resolving to the message info.
   */
  send(msg, thread, callback) {
    return new Promise(async (r) => {
      this.api.sendMessage(
        await this.#censor(msg),
        thread || this.event.threadID,
        async (err, info) => {
          if (err) {
            await this.reply(`❌ ${JSON.stringify(err)}`);
          }

          if (typeof callback === "function") {
            await callback(err, info);
          }
          this.lastID = info?.messageID;
          r(info);
        },
      );
    });
  }

  /**
   * Reacts to a message with the specified emoji.
   * @param {string} emoji - The emoji to react with.
   * @param {string} [id] - The message ID to react to. Defaults to the current message ID.
   * @param {function} [callback] - Optional callback function to execute after reacting.
   * @returns {Promise<boolean>} - A promise resolving to true if the reaction is successful.
   */
  get reaction() {
    return this.react;
  }
  react(emoji, id, callback) {
    return new Promise((r) => {
      this.api.setMessageReaction(
        emoji,
        id || this.event.messageID,
        async (err, ...args) => {
          if (typeof callback === "function") {
            await callback(err, ...args);
          }
          r(true);
        },
        true,
      );
    });
  }
  /**
   * Edits a message with the specified content.
   * @param {string} msg - The new message content.
   * @param {string} [id] - The message ID to edit. Defaults to the last sent message ID.
   * @param {function} [callback] - Optional callback function to execute after editing.
   * @returns {Promise<boolean>} - A promise resolving to true if the edit is successful.
   */
  edit(msg, id, callback) {
    return new Promise(async (r) => {
      this.api.editMessage(
        (await this.#censor(msg)).body,
        id || this.lastID,
        async (err, ...args) => {
          if (typeof callback === "function") {
            await callback(err, ...args);
          }
          r(true);
        },
      );
    });
  }
  SyntaxError() {
    return this.reply(
      `⚠️ You are using the wrong syntax, please check the help menu to see how to use this command.`,
    );
  }
  error(error) {
    let message = "";
    if (error instanceof Error) {
      const timestamp = new Date().toUTCString();
      const errorName = error.name;
      message = `❌ ${errorName}\nTimestamp: ${timestamp}\n${error.stack || "No stack trace available"}`;
    } else {
      message = `❌ An unknown error occurred.\nTimestamp: ${timestamp}\n${JSON.stringify(error, null, 2)}`;
    }
    return this.reply(message);
  }
}

function extractFormBody(msg) {
  if (typeof msg === "string") {
    return { body: msg };
  } else if (typeof msg === "object") {
    return { ...msg };
  } else {
    return { body: String(msg) };
  }
}

function argCheck(entryArgs, strict, mainDegree) {
  const args = [...entryArgs];
  return function check(entryKey, degree = mainDegree) {
    const key = String(entryKey);
    if (strict && args[degree] !== key) {
      return false;
    }
    if (args[degree]?.toLowerCase === key.toLowerCase) {
      return true;
    }
  };
}

class Goatly {
  constructor({ global: myGlobal = global, context = {} }) {
    this.global = myGlobal;
    this.context = context;
    this.box = null;
    if (context.api && context.event) {
      this.box = new Box(context.api, context.event, true);
    }
  }
  setReply(key, { name = context.commandName, ...options }) {
    this.global.GoatBot.onReply.set(key, { commandName: name, ...options });
    return true;
  }
  delReply(key) {
    this.global.GoatBot.onReply.delete(key);
    return true;
  }
  async replySet(form, { name = context.commandName, ...options }) {
    if (!this.box) {
      throw new Error("No box");
    }
    const info = await this.box.reply(form);
    this.global.GoatBot.onReply.set(info.messageID, {
      commandName: name,
      ...options,
    });
  }
  static noPrefix(moduleData, global, options) {
    return new Goatly({ global }).noPrefix(moduleData, options);
  }
  async noPrefix(moduleData, options) {
    options ??= {
      allowPrefix: false,
      disableOnChat: false,
    };
    const { global } = this;
    const { prefix } = global.GoatBot.config;
    const onStartBackup = moduleData.onStart.bind(moduleData);
    const onChatBackup = moduleData.onChat.bind(moduleData);
    moduleData.config.author = `${moduleData.config.author} || Liane (noPrefix)`;
    moduleData.onStart = async function () {};
    const { name } = moduleData.config;
    moduleData.onChat = async function ({ ...context }) {
      const { event } = context;
      event.body = event.body || "";
      if (!options.disableOnChat) {
        try {
          await onChatBackup({ ...context });
        } catch (error) {
          console.log(error);
        }
      }
      let willApply = false;
      let [commandName, ...args] = event.body.split(" ").filter(Boolean);
      if (!commandName) {
        return;
      }
      if (commandName.startsWith(prefix)) {
        commandName = commandName.replace(prefix, "");
      } else if (
        options.allowPrefix === false &&
        commandName.toLowerCase() === name.toLowerCase()
      ) {
        return context.message.reply(
          `❌ | The command "${commandName}" cannot be used with the prefix "${prefix}"`,
        );
      }

      if (commandName.toLowerCase() === name.toLowerCase()) {
        willApply = true;
      }
      if (!willApply) {
        return;
      }
      await onStartBackup({ ...context, args, commandName });
    };
    return moduleData;
  }
  makeOnStart(options) {
    if (typeof options !== "object") {
      throw new Error("options must be an object");
    }
    const defaultOptions = {};
    options = { ...defaultOptions, ...options };
    async function handler(context) {
      const box = new Box(context.api, context.event, true);
      context.box = box;
      async function executer(options) {
        if (options.script) {
          await options.script(context);
        }
        const { message } = context;
        if (options.reply) {
          await message.reply(options.reply);
        }
        if (options.reaction) {
          await message.reaction(options.reaction);
        }
        if (typeof options.apiCmd === "object" && options.apiCmd) {
          await box.fetch(options.apiCmd.url, options.apiCmd);
        }
      }
      if (Array.isArray(options.args)) {
        for (const arg in options) {
          const value = options[arg];
          if (typeof value !== "object") {
            continue;
          }
          if (value.value === null && !context.args[value.degree]) {
            continue;
          }
          if (!value.value) {
            await executer(value);
            continue;
          }
          if (!box.onArg(value.degree || 0, value.value)) {
            continue;
          }
          await executer(value);
        }
      }
    }
    return async function onStart(context) {
      return handler(context);
    };
  }
}
function GoatHelper(moduleData, { global = global }) {
  const goat = new Goatly({ global });
  const newData = { ...moduleData };
  const { config } = newData;
  if (config.noPrefix) {
    newData = goat.noPrefix(newData, {
      allowPrefix: config.strictNoPrefix ?? true,
    });
  }
  function makeOnStart(onStartFunc) {
    return async function onStart(context) {
      const box = new Box(context.api, context.event, true);
      context.box = box;
      context.message = {
        ...context.message,
        ...context.box,
      };
      context.goat = goat;
      context.args = context.args.filter(Boolean);
      return await onStartFunc(context);
    };
  }
  newData.onStart = makeOnStart(
    newData.onStart ||
      (({ message, commandName }) =>
        message.reply(`❌ The command "${commandName}" has no onStart.`)),
  );
  return newData;
}
function objIndex(obj, index) {
  const i = parseInt(index);
  if (isNaN(i)) {
    return obj[index];
  }
  return obj[Object.keys(obj)[i]] || obj[i];
}

function delay(ms = 500) {
  return new Promise((r) => setTimeout(r, ms));
}

class ObjectPlus extends Object {
  constructor(...args) {
    super(...args);
  }
  typer(types) {
    ObjectPlus.typer(this.clean(), types);
  }
  clean() {
    return ObjectPlus.clean(this);
  }
  static clean(obj) {
    ObjectPlus.typer({ obj }, { obj: "object" });
    let result = {};
    Object.keys(obj).forEach((key) => {
      result[key] = obj[key];
    });
    return result;
  }
  static typer(obj, types) {
    let result = "";

    if (typeof obj !== "object" || obj === null) {
      throw new TypeError(
        "First argument (obj) must be a non-null object, got " + typeof obj,
      );
    }

    for (const [key, expectedType] of Object.entries(types)) {
      const value = obj[key];
      if (
        typeof value === "object" &&
        !Array.isArray(value) &&
        typeof expectedType === "object" &&
        value &&
        !Array.isArray(expectedType) &&
        expectedType
      ) {
        typer(value, expectedType);
        continue;
      }
      const expectedTypes = expectedType
        .toString()
        .split("|")
        .map((type) => type.trim());

      let isValid = false;

      for (const checkType of expectedTypes) {
        if (checkType === "null" && value === null) {
          isValid = true;
          break;
        }
        if (
          checkType.endsWith("?") &&
          (value === null || value === undefined)
        ) {
          isValid = true;
          break;
        }
        if (checkType.startsWith("@")) {
          if (value?.constructor?.name === checkType.slice(1)) {
            isValid = true;
            break;
          }
        } else {
          if (typeof value === checkType) {
            isValid = true;
            break;
          }
        }
      }

      if (!isValid) {
        const expectedTypeString = expectedTypes.join(" or ");
        const actualTypeString =
          value === null
            ? "null"
            : typeof value === "object"
              ? value.constructor?.name
              : typeof value;
        result += `Property '${key}' expected type ${expectedTypeString}, got ${actualTypeString}\n`;
      }
    }

    if (result.length > 0) {
      throw new TypeError(result);
    }
  }
  static reversify(obj) {
    ObjectPlus.typer({ obj }, { obj: "object" });
    const result = {};
    for (const key of Object.keys(obj).reverse()) {
      result[key] = obj[key];
    }
    return result;
  }
  deepMerge(...objs) {
    return ObjectPlus.deepMerge(this, ...objs);
  }
  static deepMerge(...objs) {
    const result = {};
    for (const obj of objs) {
      ObjectPlus.typer({ obj }, { obj: "object" });
      for (const [key, value] of Object.entries(obj)) {
        if (typeof value === "object" || Array.isArray(value)) {
          result[key] = ObjectPlus.deepMerge(result[key] || {}, value);
        } else {
          result[key] = value;
        }
      }
    }
    return result;
  }
  indexAtKey(key) {
    return ObjectPlus.indexAtKey(this, key);
  }
  static indexAtKey(obj, key) {
    ObjectPlus.typer({ obj, index }, { obj: "object", index: "string" });
    return Object.keys(obj).indexOf(key);
  }
  keyAtIndex(index) {
    return ObjectPlus.keyAtIndex(this, index);
  }
  static keyAtIndex(obj, index) {
    ObjectPlus.typer({ obj, index }, { obj: "object", index: "number|string" });
    const keys = Object.keys(obj);
    if (isNaN(parseInt(index))) {
      throw new TypeError(
        "Second argument (index) must be a number, got " + parseInt(index),
      );
    }
    return keys[parseInt(index)];
  }
  atIndex(index) {
    return ObjectPlus.atIndex(this, index);
  }
  static atIndex(obj, index) {
    ObjectPlus.typer({ obj, index }, { obj: "object", index: "number|string" });
    const keys = Object.keys(obj);
    if (isNaN(parseInt(index))) {
      throw new TypeError(
        "Second argument (index) must be a number, got " + parseInt(index),
      );
    }
    return obj[keys[parseInt(index)]];
  }
  static iterate(obj, callback) {
    ObjectPlus.typer(
      { obj, callback },
      { obj: "object", callback: "function" },
    );
    for (const key in obj) {
      callback(key, obj[key]);
    }
  }
  iterate(callback) {
    ObjectPlus.iterate(this, callback);
  }
  mapValues(callback) {
    return ObjectPlus.mapValues(this, callback);
  }
  static mapValues({ ...obj }, callback) {
    ObjectPlus.typer(
      { obj, callback },
      { obj: "object", callback: "function" },
    );
    for (const key in obj) {
      obj[key] = callback(key, obj[key]);
    }
    return obj;
  }
  mapKeys(callback) {
    return ObjectPlus.mapKeys(this, callback);
  }
  static mapKeys({ ...obj }, callback) {
    ObjectPlus.typer(
      { obj, callback },
      { obj: "object", callback: "function" },
    );
    for (const key in obj) {
      obj[callback(key, obj[key])] = obj[key];
      delete obj[key];
    }
    return obj;
  }
  static excludeKey({ ...obj }, ...keys) {
    ObjectPlus.typer({ obj }, { obj: "object" });
    for (const key of keys) {
      delete obj[key];
    }
    return obj;
  }
  excludeKey(...keys) {
    return ObjectPlus.deleteKey(this, ...keys);
  }
}

class Toggle {
  constructor() {
    this.offStates = {};
    this.funcs = {};
  }
  on(key, callback = function () {}) {
    if (key in this.offStates) {
      delete this.offStates[key];
      return callback(this.offStates);
    }
  }
  off(key, callback = function () {}) {
    this.offStates[key] = true;
    return callback(this.offStates);
  }
  test(key, callback = function () {}) {
    if (!this.offStates[key]) {
      callback(this.offStates);
      return true;
    }
    return false;
  }
  async testAsync(key, callback = async function () {}) {
    if (!this.offStates[key]) {
      await callback(this.offStates);
      return true;
    }
    return false;
  }
  setSpawn(key, func) {
    if (!this.funcs[key]) {
      this.funcs[key] = [];
    }
    this.funcs[key].push(func);
  }
  async spawn(key, delay = 0) {
    if (delay) {
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
    let returns = [];
    if (this.funcs[key] && !this.offStates[key]) {
      for (const func of this.funcs[key]) {
        returns.push(await func());
      }
    }
    return returns;
  }
  isFree(key) {
    return !!this.funcs[key];
  }
  swap(key) {
    if (!this.test(key)) {
      this.on(key);
    } else if (this.test(key)) {
      this.off(key);
    }
    return this.test(key);
  }
  nextFree() {
    let num = 0;
    while (this.funcs[num]) {
      num++;
    }
    return num;
  }
}

const System = {
  out: {
    println(message) {
      console.log(message);
    },
    print(message) {
      process.stdout.write(message);
    },
  },

  currentTimeMillis() {
    return Date.now();
  },

  nanoTime() {
    return process.hrtime.bigint();
  },

  exit(status) {
    process.exit(status);
  },

  getenv(name) {
    return process.env[name];
  },

  setenv(name, value) {
    process.env[name] = value;
  },

  clearenv(name) {
    delete process.env[name];
  },

  getProperty(key) {
    const properties = {
      "os.name": process.platform,
      "user.dir": process.cwd(),
      "user.home": process.env.HOME || process.env.USERPROFILE,
    };
    return properties[key];
  },

  setProperty(key, value) {
    this.properties = this.properties || {};
    this.properties[key] = value;
  },

  gc() {
    if (global.gc) {
      global.gc();
    } else {
      console.warn("No garbage collector available. Run node with --expose-gc");
    }
  },

  arraycopy(src, srcPos, dest, destPos, length) {
    if (!Array.isArray(src) || !Array.isArray(dest)) {
      throw new TypeError("Source and destination must be arrays");
    }
    for (let i = 0; i < length; i++) {
      dest[destPos + i] = src[srcPos + i];
    }
  },

  identityHashCode(obj) {
    return obj
      ? obj.hashCode?.() ||
          obj
            .toString()
            .split("")
            .reduce((hash, char) => hash * 31 + char.charCodeAt(0), 0)
      : 0;
  },

  lineSeparator() {
    return require("os").EOL;
  },
};

function range(min, max) {
  let result = [];
  for (let i = min; i <= max; i++) {
    result.push(i);
  }
  return result;
}
const { createRequire } = require("module");
class RequireManager {
  constructor(require) {
    this.require = require;
  }
  static fromESM(url) {
    const require = createRequire(url);
    return new RequireManager(require);
  }
  get(path, isNotNPM = false) {
    let notNPM = !!isNotNPM;
    try {
      let filePath = notNPM ? `./${path?.replace(/\.js$/, "")}` : path;
      return this.require(filePath);
    } catch (err) {
      throw err;
    }
  }
  getSilent(...args) {
    try {
      return this.get(...args);
    } catch {
      return null;
    }
  }
  delCache(...keys) {
    let problems = [];
    for (const key of keys) {
      if (key in this.require.cache) {
        delete this.require.cache[key];
      } else {
        problems.push(key);
      }
    }
    return problems;
  }
  getNew(path, ...args) {
    this.delCache(path);
    return this.get(path, ...args);
  }
  clearCache() {
    for (const key in this.require.cache) {
      delete this.require.cache[key];
    }
  }
}

class Rand {
  static int(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) - min;
  }
  static float(min, max) {
    return Math.random() * (max - min) + min;
  }
  static percent() {
    return Math.random();
  }
  static bool(threshold = 50) {
    return Math.random() < threshold / 100;
  }
  static arrayVal(arr) {
    return arr[Math.floor(Math.random() * arr.length)];
  }
  static objectVal(obj) {
    return obj[
      Object.keys(obj)[Math.floor(Math.random() * Object.keys(obj).length)]
    ];
  }
  static arrayIndex(arr) {
    return Math.floor(Math.random() * arr.length);
  }
  static objectKey(obj) {
    return Object.keys(obj)[
      Math.floor(Math.random() * Object.keys(obj).length)
    ];
  }
}

module.exports = {
  Box,
  Rand,
  range,
  //EzFile,
  censor,
  extractFormBody,
  argCheck,
  RequireManager,
  Goatly,
  LianeAPI,
  delay,
  objIndex,
  ObjectPlus,
  Toggle,
  System,
  GoatHelper,
  CassidyWrapper,
  RUI: require("./others/RUI"),
};

module.exports.MessengerLia = require("./others/MessengerLia");

Object.assign(module.exports, require("./others/ShopSystem"));
