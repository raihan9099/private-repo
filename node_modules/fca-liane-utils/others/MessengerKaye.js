const login = require("fca-unofficial");

class MessengerKaye {
  constructor({ appState, fca = login }) {
    this.appState = appState;
    this.login = fca;
    this.api = null;
    this.isLogin = false;
    if (!appState) {
      throw makeError(
        "NullAppStateException",
        "AppState is null, make sure to provide a valid array containing the bot's cookie.\n\nnew MessengerKaye({ appState: [cookie here] })",
      );
    }
    if (typeof fca !== "function") {
      throw makeError(
        "InvalidFCA",
        "The { login } you provided is not a function.",
      );
    }
    this.onFuncs = {};
  }
  on(...args2) {
    const args = [...args2];
    const func = args.pop();
    if (typeof func !== "function") {
      throw makeError(
        "InvalidArgumentError",
        "The last argument must be a function.",
      );
    }
    if (args.some((arg) => typeof arg !== "string")) {
      throw makeError(
        "InvalidArgumentError",
        "The arguments must be all strings except the last one.",
      );
    }
    for (const arg of args) {
      if (!this.onFuncs[arg]) {
        this.onFuncs[arg] = [];
      }
      this.onFuncs[arg].push(func);
    }
    const self = this;
    return {
      add(...newArgs) {
        return self.on(...args, ...newArgs);
      },
    };
  }
  async startListening(x) {
    if (x) {
      throw createError(
        "InvalidArgumentError",
        "There shouldn't be any argument for this function: .startListening()",
      );
    }
    const self = this;
    const listener = this.#internalListen;
    return new Promise((resolve, reject) => {
      if (self.isLogin && self.api) {
        return resolve(self.api);
      }
      try {
        self.login({ appState: self.appState }, (err, api) => {
          if (err) {
            this.#callOnFunc("login_error", err);
            reject(err);
          } else {
            this.#callOnFunc("login_success", api);
            self.api = api;
            self.isLogin = true;
            const emitter = api.listenMqtt(listener);
            self.stopListening = () => {
              emitter.stopListening();
              self.isLogin = false;
              api.logout();
            };
            resolve(api);
          }
        });
      } catch (error) {
        this.#callOnFunc("login_error", error);
        reject(error);
      }
    });
  }
  stopListening() {
    throw createError(
      "InvalidCallError",
      "A certain condition must be met before calling this function.",
    );
  }
  #getOnFunc(name) {
    return this.onFuncs[name] || [];
  }
  #internalListen(err, event) {
    const extraArgs = [this.api];
    if (err) {
      this.#callOnFunc("listen_error", err);
      return;
    }
    // possible event types
    const possibleEvents = {
      message: {
        attachments: "object", // array
        body: "string",
        isGroup: "boolean",
        mentions: "object", // object
        messageID: "string",
        senderID: "string",
        threadID: "string",
        isUnread: "boolean",
        type: "string",
      },
      event: {
        author: "string",
        logMessageBody: "string",
        logMessageData: "object",
        logMessageType: "string",
        threadID: "string",
        type: "string",
      },
      message_reply: {
        attachments: "object", // array
        body: "string",
        isGroup: "boolean",
        mentions: "object", // object
        messageID: "string",
        senderID: "string",
        threadID: "string",
        isUnread: "boolean",
        type: "string",
        messageReply: "object", // object
      },
      message_unsend: {
        threadID: "string",
        senderID: "string",
        messageID: "string",
        deletionTimestamp: "string",
        type: "string",
      },
      message_reaction: {
        messageID: "string",
        reaction: "string",
        offlineThreadingID: "string",
        senderID: "string",
        userID: "string",
        messageID: "string",
        type: "string",
        threadID: "string",
        timestamp: "string",
      },
      typ: {
        from: "string",
        fromMobile: "boolean",
        isTyping: "boolean",
        threadID: "string",
        type: "string",
      },
      // api.setOptions({ updatePresence: true })
      presence: {
        statues: "number", // 0 and 2,
        timestamp: "string",
        type: "string",
        userID: "string",
      },
      read: {
        threadID: "string",
        time: "string",
        type: "string",
      },
      read_receipt: {
        reader: "string",
        threadID: "string",
        time: "string",
        type: "string",
      },
    };
    const assert = possibleEvents[event.type];
    event = new Proxy(event, {
      get(target, prop) {
        if (!(prop in target)) {
          console.warn(
            `WARN: The property "${prop}" does not actually exist in type: "${event.type}"`,
          );
        } else if (!(prop in assert)) {
          console.warn(
            `WARN: The property "${prop}" might not exist in type: "${event.type}"`,
          );
        }
        return target[prop];
      },
      set(target, prop, value) {
        if (typeof value !== assert[prop]) {
          console.warn(
            `WARN: The property "${prop}" is possibly a "${assert[prop]}" but you're trying to set it to a "${typeof value}"`,
          );
        }
        target[prop] = value;
      },
    });
    this.#callOnFunc("listen_success", event, ...extraArgs);
    if (event?.type) {
      this.#callOnFunc(event.type, event, ...extraArgs);
    }
  }
  #callOnFunc(name, ...args) {
    const returns = [];
    const funcs = this.#getOnFunc(name);
    for (const func of funcs) {
      try {
        returns.push(func(...args));
      } catch (error) {
        console.error(error);
        returns.push(error);
      }
    }
    return Promise.allSettled(returns);
  }
}
function makeError(name, message) {
  const err = new Error(message);
  err.name = name;
  return err;
}
module.exports = MessengerKaye;
