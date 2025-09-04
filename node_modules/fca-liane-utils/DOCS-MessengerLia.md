# MessengerLia Documentation

## Introduction

**MessengerLia** is a robust framework designed to interact with Facebook's messaging platform through `fca-unofficial` or other similar fca. It allows for easy setup and handling of middlewares and searchers for handling different types of events.

This framework is created with 💗 by Liane Cagara.

## Class: `MessengerLia`

### Constructor

#### Description
Initializes a new instance of the `MessengerLia` class.

#### Arguments

- **login**: The login function, default is `fca-unofficial`.
- **appState**: The application state, default is an empty array (cookie)
- **prefix**: The command prefix that is very useless and you need to manually implement it.
- **accountOptions**: Additional options for the account.
- **email**: The email address for login.
- **password**: The password for login.
- **devLog**: A development log function, default logs to console.
- **logger**: A custom logger function, default logs to console.
- **extraLogin**: Extra login (autobot)
- **bag**: Additional properties.

#### Example Usage

```javascript
const { MessengerLia } = require('fca-liane-utils');

const bot = new MessengerLia({
  email: "example@example.com",
  password: "password123",
  prefix: "!",
  accountOptions: {
    online: true,
    selfListen: false
  }
});
```

### Method: `on(search, ...callbacks)`

#### Description
Registers a searcher with specified callbacks.

#### Arguments

- **search**: The search term or pattern (string or RegExp).
- **...callbacks**: One or more callback functions to handle the search.

#### Example Usage

```javascript
bot.on("hello", ({ api, event }) => {
  api.sendMessage("Hello there!", event.threadID);
});

bot.on(/goodbye/i, ({ api, event }) => {
  api.sendMessage("Goodbye!", event.threadID);
});

// Adding properties to context
bot.on("addProperty", (context) => {
  context.newProperty = "I am new!";
  context.api.sendMessage("Property added!", context.event.threadID);
});
```

### Method: `use(...callbacks)`

#### Description
Registers middleware functions to process all events.

#### Arguments

- **...callbacks**: One or more middleware functions.

#### Example Usage

```javascript
// Simple middleware example
bot.use((context, { next }) => {
  console.log("Middleware 1");
  next();
});

bot.use((context, { next }) => {
  console.log("Middleware 2");
  next();
});

// Adding properties to context
bot.use((context, { next }) => {
  context.timestamp = Date.now();
  next();
});

bot.use((context, { next }) => {
  context.api.sendMessage(`Timestamp: ${context.timestamp}`, context.event.threadID);
  next();
});
```

### Method: `listen()`

#### Description
Starts listening for events.

#### Example Usage

```javascript
await bot.listen();
```

## Standard Functions (`std`)

### Function: `failSafe()`

#### Description
Provides a failsafe mechanism for event handling. Ensures the event context is properly initialized.

#### Example Usage

```javascript
bot.use(MessengerLia.std.failSafe());
```

### Function: `autoCensor(...keys)`

#### Description
Automatically censors specified keys in the event context.

#### Arguments

- **...keys**: Keys to be censored.

#### Example Usage

```javascript
bot.use(MessengerLia.std.autoCensor("body"));
```

### Function: `boxHelper({ censor })`

#### Description
Adds a `Box` helper to the context, which can be used to interact with the messaging API.
Check DOCS-Box.md

#### Arguments

- **censor**: Whether to censor the box.

#### Example Usage

```javascript
bot.use(MessengerLia.std.boxHelper({ censor: true }));

// The Box helper will be added to the context

bot.on("help", ({ box }) => {
  box.sendReply("This is a help message.");
});
```

### Function: `chatArgs()`

#### Description
Parses the event body into command arguments. Adds `args` array to the context.

#### Example Usage

```javascript
bot.use(MessengerLia.std.chatArgs());

bot.on("command", (context) => {
  console.log(context.args); // Logs the command arguments
});
```

### Function: `parseCommandName()`

#### Description
Parses the command name from the event body. Adds `commandName` and `prefix` to the context.

#### Example Usage

```javascript
bot.use(MessengerLia.std.parseCommandName());

bot.on("command", (context) => {
  console.log(context.commandName); // Logs the command name
});
```

### Function: `parseCommandProperties()`

#### Description
Parses command properties from the command name. Adds `commandProperties` and `parseDots` to the context.

#### Example Usage

```javascript
bot.use(MessengerLia.std.parseCommandProperties());

bot.on("command", (context) => {
  console.log(context.commandProperties); // Logs the command properties
});
```

### Function: `prefixer()`

#### Description
Forces all middlewares and searchers to check if the event.body starts with prefix, make sure to use failSafe and have prefix in constructor before using this.

### Function: `static(absPath)`

#### Description
Sends static content from a specified path. Adds `commandName` and `fileContent` to the context.

#### Arguments

- **absPath**: The absolute path to the static content.

#### Example Usage

```javascript
bot.use(MessengerLia.std.static("/path/to/static/files"));

// Sends the static file content when "command" is triggered
bot.on("command", ({ commandName, fileContent, api, event }) => {
  api.sendMessage(
    {
      attachment: fileContent,
    },
    event.threadID,
    () => {
      fileContent.close();
    },
    event.messageID
  );
});
```

## Complete Example

```javascript
const { MessengerLia } = require('fca-liane-utils');

const bot = new MessengerLia({
  email: "example@example.com",
  password: "password123",
  prefix: "!",
  //devLog: console.log, // uncomment this line if you wanna debug.
});

// Use standard middlewares
bot.use(
  MessengerLia.std.failSafe(),
  MessengerLia.std.autoCensor("body"),
  MessengerLia.std.chatArgs(),
  MessengerLia.std.parseCommandName(),
  MessengerLia.std.parseCommandProperties()
);

// Add a static file handler
bot.use(MessengerLia.std.static("/path/to/static/files"));

// Add a command that responds to "ping"
bot.on("ping", ({ api, event }) => {
  api.sendMessage("pong", event.threadID);
});

// Add a command that responds to "addProperty" and modifies the context
bot.on("addProperty", (context) => {
  context.newProperty = context.event.body;
  context.api.sendMessage("Property added!", context.event.threadID);
});

// Add a middleware that adds a timestamp to the context
bot.use((context, { next }) => {
  context.timestamp = Date.now();
  next();
});

// Add another middleware that sends a message with the timestamp
bot.on("timestamp", (context, { next }) => {
  context.api.sendMessage(`Timestamp: ${context.timestamp}`, context.event.threadID);
  next();
});

// Add a command that sends a static file content
bot.use(({ commandName, fileContent, api, event }) => {
  api.sendMessage(
    {
      attachment: fileContent,
    },
    event.threadID,
    () => {
      fileContent.close();
    },
    event.messageID
  );
  next();
});

// Start listening for events
bot.listen();
```

This framework is created with 💗 by Liane Cagara.