# Toggle Class Documentation

The `Toggle` class provides a system for managing states and triggering functions based on those states. Below is a detailed description of the methods available in the `Toggle` class.
(Inspired from Geometry Dash)

## Constructor

### `constructor()`

**Description:** Initializes a new instance of the `Toggle` class.

**Usage:**
```javascript
const toggle = new Toggle();
```

## Methods

### `on(key, callback = function() {})`

**Description:** Activates the state associated with the specified key and executes the callback function.

**Parameters:**
- `key` (string): The key associated with the state to activate.
- `callback` (function): The callback function to execute after the state is activated.

**Returns:** 
- The result of the callback function.

**Usage:**
```javascript
const toggle = new Toggle();
toggle.off('example');
toggle.on('example', (offStates) => {
  console.log('State activated:', offStates);
});
// Output: State activated: {}
```

### `off(key, callback = function() {})`

**Description:** Deactivates the state associated with the specified key and executes the callback function.

**Parameters:**
- `key` (string): The key associated with the state to deactivate.
- `callback` (function): The callback function to execute after the state is deactivated.

**Returns:** 
- The result of the callback function.

**Usage:**
```javascript
const toggle = new Toggle();
toggle.off('example', (offStates) => {
  console.log('State deactivated:', offStates);
});
// Output: State deactivated: { example: true }
```

### `test(key, callback = function() {})`

**Description:** Checks if the state associated with the specified key is active and executes the callback function if it is.

**Parameters:**
- `key` (string): The key associated with the state to check.
- `callback` (function): The callback function to execute if the state is active.

**Returns:** 
- `true` if the state is active, otherwise `false`.

**Usage:**
```javascript
const toggle = new Toggle();
toggle.off('example');
const isActive = toggle.test('example', (offStates) => {
  console.log('State is active:', offStates);
});
console.log(isActive); // Output: false
```

### `async testAsync(key, callback = async function() {})`

**Description:** Asynchronously checks if the state associated with the specified key is active and executes the callback function if it is.

**Parameters:**
- `key` (string): The key associated with the state to check.
- `callback` (async function): The async callback function to execute if the state is active.

**Returns:** 
- `true` if the state is active, otherwise `false`.

**Usage:**
```javascript
const toggle = new Toggle();
toggle.off('example');
toggle.testAsync('example', async (offStates) => {
  console.log('State is active:', offStates);
}).then(isActive => console.log(isActive)); // Output: false
```

### `setSpawn(key, func)`

**Description:** Registers a function to be triggered for the specified key.

**Parameters:**
- `key` (string): The key associated with the function.
- `func` (function): The function to register.

**Usage:**
```javascript
const toggle = new Toggle();
toggle.setSpawn('example', () => console.log('Function triggered'));
```

### `async spawn(key, delay = 0)`

**Description:** Triggers the functions registered to the specified key after an optional delay.

**Parameters:**
- `key` (string): The key associated with the functions to trigger.
- `delay` (number): The delay in milliseconds before triggering the functions.

**Returns:** 
- An array of results from the triggered functions.

**Usage:**
```javascript
const toggle = new Toggle();
toggle.setSpawn('example', () => 'Function 1 triggered');
toggle.setSpawn('example', () => 'Function 2 triggered');
toggle.spawn('example').then(results => console.log(results));
// Output: ['Function 1 triggered', 'Function 2 triggered']
```

### `isFree(key)`

**Description:** Checks if any functions are registered to the specified key.

**Parameters:**
- `key` (string): The key to check.

**Returns:** 
- `true` if there are functions registered, otherwise `false`.

**Usage:**
```javascript
const toggle = new Toggle();
console.log(toggle.isFree('example')); // Output: false
toggle.setSpawn('example', () => {});
console.log(toggle.isFree('example')); // Output: true
```

### `swap(key)`

**Description:** Toggles the state associated with the specified key and returns the new state.

**Parameters:**
- `key` (string): The key associated with the state to toggle.

**Returns:** 
- `true` if the state is active after toggling, otherwise `false`.

**Usage:**
```javascript
const toggle = new Toggle();
toggle.off('example');
console.log(toggle.swap('example')); // Output: true
console.log(toggle.swap('example')); // Output: false
```

### `nextFree()`

**Description:** Finds the next free numerical key for registering functions.

**Returns:** 
- The next free numerical key.

**Usage:**
```javascript
const toggle = new Toggle();
console.log(toggle.nextFree()); // Output: 0
toggle.setSpawn(0, () => {});
console.log(toggle.nextFree()); // Output: 1
```