# ObjectPlus Documentation

## Overview
`ObjectPlus` is an extended version of the JavaScript `Object` class, designed to provide additional utilities for handling objects. This documentation provides detailed explanations of each method available in `ObjectPlus`, complete with examples and expected outcomes.

## Methods

### `typer(types)`

**Description:** Validates the type of each property in the object against the specified types.

**Parameters:**
- `types` (Object): An object specifying the expected types of the properties.

**Usage:**
```javascript
const obj = new ObjectPlus({ name: "Liane", age: 18 });
obj.typer({ name: "string", age: "number" }); // No error

obj.typer({ name: "number", age: "string" }); // Throws TypeError
```

### `clean()`

**Description:** Returns a clean copy of the object.

**Returns:** 
- A new object with the same properties as the original.

**Usage:**
```javascript
const obj = new ObjectPlus({ name: "Liane", age: 18 });
const cleanObj = obj.clean();
console.log(cleanObj); // { name: "Liane", age: 18 }
```

### `static clean(obj)`

**Description:** Returns a clean copy of the specified object.

**Parameters:**
- `obj` (Object): The object to be cleaned.

**Returns:**
- A new object with the same properties as the original.

**Usage:**
```javascript
const cleanObj = ObjectPlus.clean({ name: "Liane", age: 18 });
console.log(cleanObj); // { name: "Liane", age: 18 }
```

### `static typer(obj, types)`

**Description:** Validates the type of each property in the object against the specified types.

**Parameters:**
- `obj` (Object): The object to be validated.
- `types` (Object): An object specifying the expected types of the properties.

**Usage:**
```javascript
ObjectPlus.typer({ name: "Liane", age: 18 }, { name: "string", age: "number" }); // No error

ObjectPlus.typer({ name: "Liane", age: 18 }, { name: "number", age: "string" }); // Throws TypeError
```

### `static reversify(obj)`

**Description:** Reverses the order of the object's keys.

**Parameters:**
- `obj` (Object): The object to be reversed.

**Returns:**
- A new object with the keys in reverse order.

**Usage:**
```javascript
const reversedObj = ObjectPlus.reversify({ name: "Liane", age: 18 });
console.log(reversedObj); // { age: 18, name: "Liane" }
```

### `deepMerge(...objs)`

**Description:** Deeply merges the object with other objects.

**Parameters:**
- `...objs` (Object[]): Objects to be merged with the current object.

**Returns:**
- A new object with merged properties.

**Usage:**
```javascript
const obj1 = new ObjectPlus({ name: "Liane", details: { age: 18 } });
const obj2 = { details: { city: "NYC" }, country: "USA" };
const mergedObj = obj1.deepMerge(obj2);
console.log(mergedObj); // { name: "Liane", details: { age: 18, city: "NYC" }, country: "USA" }
```

### `static deepMerge(...objs)`

**Description:** Deeply merges multiple objects.

**Parameters:**
- `...objs` (Object[]): Objects to be merged.

**Returns:**
- A new object with merged properties

### `static deepMerge(...objs)`

**Description:** Deeply merges multiple objects.

**Parameters:**
- `...objs` (Object[]): Objects to be merged.

**Returns:**
- A new object with merged properties.

**Usage:**
```javascript
const obj1 = { name: "Liane", details: { age: 18 } };
const obj2 = { details: { city: "NYC" }, country: "USA" };
const mergedObj = ObjectPlus.deepMerge(obj1, obj2);
console.log(mergedObj); // { name: "Liane", details: { age: 18, city: "NYC" }, country: "USA" }
```

### `indexAtKey(key)`

**Description:** Returns the index of the specified key in the object's keys.

**Parameters:**
- `key` (string): The key to find the index of.

**Returns:**
- The index of the key.

**Usage:**
```javascript
const obj = new ObjectPlus({ name: "Liane", age: 18 });
const index = obj.indexAtKey("age");
console.log(index); // 1
```

### `static indexAtKey(obj, key)`

**Description:** Returns the index of the specified key in the object's keys.

**Parameters:**
- `obj` (Object): The object to search.
- `key` (string): The key to find the index of.

**Returns:**
- The index of the key.

**Usage:**
```javascript
const index = ObjectPlus.indexAtKey({ name: "Liane", age: 18 }, "age");
console.log(index); // 1
```

### `keyAtIndex(index)`

**Description:** Returns the key at the specified index in the object's keys.

**Parameters:**
- `index` (number|string): The index to find the key at.

**Returns:**
- The key at the specified index.

**Usage:**
```javascript
const obj = new ObjectPlus({ name: "Liane", age: 18 });
const key = obj.keyAtIndex(1);
console.log(key); // "age"
```

### `static keyAtIndex(obj, index)`

**Description:** Returns the key at the specified index in the object's keys.

**Parameters:**
- `obj` (Object): The object to search.
- `index` (number|string): The index to find the key at.

**Returns:**
- The key at the specified index.

**Usage:**
```javascript
const key = ObjectPlus.keyAtIndex({ name: "Liane", age: 18 }, 1);
console.log(key); // "age"
```

### `atIndex(index)`

**Description:** Returns the value at the specified index in the object's keys.

**Parameters:**
- `index` (number|string): The index to find the value at.

**Returns:**
- The value at the specified index.

**Usage:**
```javascript
const obj = new ObjectPlus({ name: "Liane", age: 18 });
const value = obj.atIndex(1);
console.log(value); // 18
```

### `static atIndex(obj, index)`

**Description:** Returns the value at the specified index in the object's keys.

**Parameters:**
- `obj` (Object): The object to search.
- `index` (number|string): The index to find the value at.

**Returns:**
- The value at the specified index.

**Usage:**
```javascript
const value = ObjectPlus.atIndex({ name: "Liane", age: 18 }, 1);
console.log(value); // 18
```

### `static iterate(obj, callback)`

**Description:** Iterates over the object's properties, executing a callback for each property.

**Parameters:**
- `obj` (Object): The object to iterate over.
- `callback` (function): The callback function to execute for each property. It receives the key and value as arguments.

**Usage:**
```javascript
const obj = { name: "Liane", age: 18 };
ObjectPlus.iterate(obj, (key, value) => {
  console.log(key, value);
});
// Output:
// name Liane
// age 18
```

### `iterate(callback)`

**Description:** Iterates over the object's properties, executing a callback for each property.

**Parameters:**
- `callback` (function): The callback function to execute for each property. It receives the key and value as arguments.

**Usage:**
```javascript
const obj = new ObjectPlus({ name: "Liane", age: 18 });
obj.iterate((key, value) => {
  console.log(key, value);
});
// Output:
// name Liane
// age 18
```

### `mapValues(callback)`

**Description:** Maps the values of the object's properties using a callback function.

**Parameters:**
- `callback` (function): The callback function to map the values

. It receives the key and value as arguments and should return the new value.

**Returns:**
- A new object with the mapped values.

**Usage:**
```javascript
const obj = new ObjectPlus({ name: "Liane", age: 18 });
const mappedObj = obj.mapValues((key, value) => {
  return typeof value === "number" ? value + 1 : value;
});
console.log(mappedObj); // { name: "Liane", age: 19 }
```

### `static mapValues(obj, callback)`

**Description:** Maps the values of the object's properties using a callback function.

**Parameters:**
- `obj` (Object): The object to map values for.
- `callback` (function): The callback function to map the values. It receives the key and value as arguments and should return the new value.

**Returns:**
- A new object with the mapped values.

**Usage:**
```javascript
const obj = { name: "Liane", age: 18 };
const mappedObj = ObjectPlus.mapValues(obj, (key, value) => {
  return typeof value === "number" ? value + 1 : value;
});
console.log(mappedObj); // { name: "Liane", age: 19 }
```

### `mapKeys(callback)`

**Description:** Maps the keys of the object's properties using a callback function.

**Parameters:**
- `callback` (function): The callback function to map the keys. It receives the key and value as arguments and should return the new key.

**Returns:**
- A new object with the mapped keys.

**Usage:**
```javascript
const obj = new ObjectPlus({ name: "Liane", age: 18 });
const mappedObj = obj.mapKeys((key, value) => {
  return key.toUpperCase();
});
console.log(mappedObj); // { NAME: "Liane", AGE: 18 }
```

### `static mapKeys(obj, callback)`

**Description:** Maps the keys of the object's properties using a callback function.

**Parameters:**
- `obj` (Object): The object to map keys for.
- `callback` (function): The callback function to map the keys. It receives the key and value as arguments and should return the new key.

**Returns:**
- A new object with the mapped keys.

**Usage:**
```javascript
const obj = { name: "Liane", age: 18 };
const mappedObj = ObjectPlus.mapKeys(obj, (key, value) => {
  return key.toUpperCase();
});
console.log(mappedObj); // { NAME: "Liane", AGE: 18 }
```

### `static excludeKey(obj, ...keys)`

**Description:** Excludes specified keys from the object.

**Parameters:**
- `obj` (Object): The object to exclude keys from.
- `...keys` (string[]): The keys to exclude.

**Returns:**
- A new object with the specified keys excluded.

**Usage:**
```javascript
const obj = { name: "Liane", age: 18, city: "NYC" };
const newObj = ObjectPlus.excludeKey(obj, "age", "city");
console.log(newObj); // { name: "Liane" }
```

### `excludeKey(...keys)`

**Description:** Excludes specified keys from the object.

**Parameters:**
- `...keys` (string[]): The keys to exclude.

**Returns:**
- A new object with the specified keys excluded.

**Usage:**
```javascript
const obj = new ObjectPlus({ name: "Liane", age: 18, city: "NYC" });
const newObj = obj.excludeKey("age", "city");
console.log(newObj); // { name: "Liane" }
```

## Summary

The `ObjectPlus` class extends the standard JavaScript `Object` by providing additional methods for enhanced object manipulation and type validation. This allows for more robust and expressive handling of objects in JavaScript. The following methods have been detailed:

1. `typer(types)`
2. `clean()`
3. `static clean(obj)`
4. `static typer(obj, types)`
5. `static reversify(obj)`
6. `deepMerge(...objs)`
7. `static deepMerge(...objs)`
8. `indexAtKey(key)`
9. `static indexAtKey(obj, key)`
10. `keyAtIndex(index)`
11. `static keyAtIndex(obj, index)`
12. `atIndex(index)`
13. `static atIndex(obj, index)`
14. `static iterate(obj, callback)`
15. `iterate(callback)`
16. `mapValues(callback)`
17. `static mapValues(obj, callback)`
18. `mapKeys(callback)`
19. `static mapKeys(obj, callback)`
20. `static excludeKey(obj, ...keys)`
21. `excludeKey(...keys)`

These methods provide powerful tools for object validation, manipulation, and traversal. By leveraging these methods, developers can write cleaner, more maintainable code.

Author: Liane Cagara @lianecagara (github)