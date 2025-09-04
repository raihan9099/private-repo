# Box Class Documentation

The `Box` class, created by Liane, is designed to interact with Facebook Messenger API events, allowing for automated message handling, response generation, and interaction with external APIs like `LianeAPI`. Below is a detailed description of the methods available in the `Box` class.

For interacting with the Facebook Messenger API, you will use the `fca-unofficial` package from npm. Here’s an example of setting up the API using `fca-unofficial` before using the `Box` class:

```javascript
const login = require('fca-unofficial');
const cookie = require('./cookie'); // cookie.json file as example

login({ appState: cookie }, (err, api) => {
  if (err) return console.error(err);
  api.listenMqtt(async (err, event) => {
    if (err) return console.error(err);
    const box = new Box(api, event);
    await box.reply('Hello current user!');
    // More functionality can be added here
  });
});
```

## Constructor

### `constructor(api, event, autocensor = true)`

**Description:** Initializes a new instance of the `Box` class.

**Parameters:**
- `api` (object): The Facebook Messenger API instance.
- `event` (object): The event object containing message details.
- `autocensor` (boolean, optional): Whether to automatically censor messages. Defaults to `true`.

**Usage:**
```javascript
const box = new Box(api, event);
console.log(box.api); // Facebook Messenger API instance
console.log(box.event); // Event object containing message details
```

## Methods

### `static create(...args)`

**Description:** Creates a new instance of the `Box` class.

**Parameters:**
- `...args` (any): The arguments to pass to the constructor.

**Returns:** 
- A new `Box` instance.

**Usage:**
```javascript
const box = Box.create(api, event);
console.log(box instanceof Box); // true
```

### `static fetch(api, event, ...args)`

**Description:** Creates a new `Box` instance and fetches data.

**Parameters:**
- `api` (object): The Facebook Messenger API instance.
- `event` (object): The event object containing message details.
- `...args` (any): Additional arguments for the `fetch` method.

**Returns:** 
- The result of the `fetch` method.

**Usage:**
```javascript
Box.fetch(api, event, 'https://example.com/data').then(result => {
  console.log(result); // message info
});
```

### `async lianeAPI(id, username, options = {})`

**Description:** Interacts with the LianeAPI.

**Parameters:**
- `id` (string): The unique identifier for the API.
- `username` (string): The username associated with the API.
- `options` (object, optional): Additional options for the fetch method.

**Returns:** 
- The result of the `fetch` method with the LianeAPI URL.

**Usage:**
```javascript
const result = await box.lianeAPI('claire', 'LianeAPI_Reworks');
console.log(result); // message info
```

### `async fetch(entryUrl, entryOptions = {})`

**Description:** Fetches data from a specified URL.

**Parameters:**
- `entryUrl` (string): The URL to fetch data from.
- `entryOptions` (object, optional): Additional options for the fetch method.

**Returns:** 
- The fetched data.

**Usage:**
```javascript
box.fetch('https://example.com/data').then(result => {
  console.log(result); // message info
});
```

### `reply(msg, thread, callback)`

**Description:** Sends a reply message to the specified thread.

**Parameters:**
- `msg` (string | object): The message content.
- `thread` (string | number, optional): The thread ID to send the message to. Defaults to the current thread.
- `callback` (function, optional): Optional callback function to execute after sending the message.

**Returns:** 
- A promise resolving to the message info.

**Usage:**
```javascript
box.reply('Hello!').then(info => {
  console.log(info); // Message info
});
```

### `send(msg, thread, callback)`

**Description:** Sends a message to the specified thread.

**Parameters:**
- `msg` (string | object): The message content.
- `thread` (string | number, optional): The thread ID to send the message to. Defaults to the current thread.
- `callback` (function, optional): Optional callback function to execute after sending the message.

**Returns:** 
- A promise resolving to the message info.

**Usage:**
```

```javascript
box.send('Hello everyone!', '1234567890').then(info => {
  console.log(info); // Message info
});
```

### `react(emoji, id, callback)`

**Description:** Reacts to a message with the specified emoji.

**Parameters:**
- `emoji` (string): The emoji to react with.
- `id` (string, optional): The message ID to react to. Defaults to the current message ID.
- `callback` (function, optional): Optional callback function to execute after reacting.

**Returns:** 
- A promise resolving to `true` if the reaction is successful.

**Usage:**
```javascript
box.react('👍').then(success => {
  console.log(success); // true
});
```

### `edit(msg, id, callback)`

**Description:** Edits a message with the specified content.

**Parameters:**
- `msg` (string): The new message content.
- `id` (string, optional): The message ID to edit. Defaults to the last sent message ID.
- `callback` (function, optional): Optional callback function to execute after editing.

**Returns:** 
- A promise resolving to `true` if the edit is successful.

**Usage:**
```javascript
box.edit('Updated message content').then(success => {
  console.log(success); // true
});
```

## Private Methods

### `#censor(form)`

**Description:** Censors the message content if `autocensor` is enabled.

**Parameters:**
- `form` (object): The message form object.

**Returns:** 
- The censored message content.

**Usage:** 
This method is used internally within the class and is not intended for direct usage.

## New Methods

### `async onArg(degree, value, callback = async function() {})`

**Description:** Checks if a specified argument (by degree) matches a given value, and if so, executes a callback function.

**Parameters:**
- `degree` (number): The position of the argument to check.
- `value` (string): The value to compare the argument against.
- `callback` (function, optional): The callback function to execute if the argument matches the value. Defaults to an empty asynchronous function.

**Returns:** 
- A promise resolving to `false` if the argument does not match the value.
- The result of the callback function if the argument matches the value.

**Usage:**
```javascript
const box = new Box(api, event);
await box.onArg(0, 'start', async (arg) => {
  console.log(`Argument matched: ${arg}`);
  // Perform some action here
  // Optional .then()
});
```

### `get args()`

**Description:** Retrieves the arguments from the event body, split by spaces.

**Returns:** 
- An array of arguments derived from the event body.

**Usage:**
```javascript
const box = new Box(api, event);
// if event.body is '#commandName arg1 arg2 arg3'
console.log(box.args); // ['arg1', 'arg2', 'arg3', ...]
```

### `SyntaxError()`

**Description:** Sends a warning message when the user's input syntax is incorrect, prompting them to check the help menu for guidance.

**Usage:**
```javascript
box.SyntaxError();
```

### `error(error)`

**Description:** Handles and formats error messages, providing detailed information such as error name, timestamp, and stack trace if available. If the error is not an instance of `Error`, it will stringify the error object for display.

**Parameters:**
- `error` (Error): The error object to handle.

**Returns:** 
- A formatted error message with additional details.

**Usage:**
```javascript
try {
  // Some code that may throw an error
} catch (error) {
  box.error(error);
}
```
## Additional Methods Documentation for Box Class

### `listen(mainCallback)`

**Description:** Sets up the Box instance to listen for events from the Facebook Messenger API. This method should be called to start processing incoming messages and other events.

**Parameters:**
- `mainCallback` (function, optional): The main callback function to execute when an event is received. Defaults to an empty asynchronous function.
- Must be executed in order to access waitForReply and waitForReaction.
- Don't execute if not necessary to save resources.

**Usage:**

**Without Callback:**
```javascript
box.listen();
```

**With Callback:**
```javascript
box.listen(async ({ event, box, args, api }) => {
  // Handle the event here
});
```

### `async waitForReply(initialText, callback)`

**Description:** Waits for a reply to a message. Sends an initial message and resolves when a reply is received.

**Parameters:**
- `initialText` (string): The initial text message to send.
- `callback` (function, optional): The callback function to execute when a reply is received. Defaults to resolving the event.

**Returns:** 
- A promise resolving to the event object containing the reply.

**Usage:**

**Without Callback:**
```javascript
box.waitForReply('Please reply to this message!').then(replyEvent => {
  box.send(`${replyEvent.senderID} sent a reply:\n${replyEvent.body}`)
});
```

**With Callback:**
```javascript
const bet = await box.waitForReply('Please reply to a bet (integer) this message!', async ({ event: event2, box, args, resolve }) => {
  if (event2.senderID !== event.senderID) {
    return box.reply("I'm not talking to you!");
  }
  const target = parseInt(args[0]);
  if (isNaN(target)) {
    return box.reply("Invalid Bet!");
  }
  resolve(target);
});
box.send(`The bet is ${bet}`)
```

### `async waitForReaction(initialText, callback)`

**Description:** Waits for a reaction to a message. Sends an initial message and resolves when a reaction is received.

**Parameters:**
- `initialText` (string): The initial text message to send.
- `callback` (function, optional): The callback function to execute when a reaction is received. Defaults to resolving the event.

**Returns:** 
- A promise resolving to the event object containing the reaction.

**Usage:**

**Without Callback:**
```javascript
box.waitForReaction('React to this message!').then(reactionEvent => {
  box.send(`Received Reaction from ${reaction.senderID}: ${reactionEvent.reaction}`);
});
```

**With Callback:**
```javascript
const { senderID } = await box.waitForReaction('React 💗 to this message!', async ({ box, event, resolve }) => {
  if (event.reaction !== "💗") {
    return box.reply(`Wrong reaction! I don't like ${event.reaction}`);
  }
  resolve(event);
});
box.send(`Thank you for reaction, ${senderID}`);
```


## Summary

The `Box` class provides a structured way to interact with Facebook Messenger events and automate responses. The class includes methods for sending messages, reacting to messages, editing messages, and interacting with external APIs like `LianeAPI`. The following methods have been detailed:

1. `constructor(api, event, autocensor = true)`
2. `static create(...args)`
3. `static fetch(api, event, ...args)`
4. `async lianeAPI(id, username, options = {})`
5. `async fetch(entryUrl, entryOptions = {})`
6. `reply(msg, thread, callback)`
7. `send(msg, thread, callback)`
8. `react(emoji, id, callback)`
9. `edit(msg, id, callback)`
10. `async onArg(degree, value, callback = async function() {})`
11. `get args()`
12. `SyntaxError()`
13. `error(error)`
14. `listen(callback = async function() {})`
15. `waitForReply(initialMessage, callback)`
16. `waitForReaction(initialMessage, callback)`

These methods enable developers to easily integrate with Facebook Messenger events and build sophisticated chatbot interactions using the `Box` class.
```