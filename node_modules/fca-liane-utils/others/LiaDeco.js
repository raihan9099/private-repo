function constant(_, key, descriptor) {
  return {
    configurable: true,
    enumerable: descriptor.enumerable,
    get() {
      return descriptor.value;
    },
    set() {
      throw new Error(`Cannot write to constant property ${key}`);
    }
  };
}
module.exports = {
  constant
}
