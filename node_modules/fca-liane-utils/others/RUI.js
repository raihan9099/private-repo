const { getCookie } = require("./RUIst");

function getCookieAsync(email, password, c) {
  if (c) {
    throw new Error("getCookieAsync(...) does not support callback.");
  }
  return new Promise((r) => {
    getCookie(email, password, r);
  });
}
function stater(login) {
  if (typeof login !== "function") {
    throw new TypeError("login is not a function.");
  }
  const func = async function ({ email, password, ...etc }, ...args) {
    const fbState = await getCookieAsync(email, password);
    login({ appState: JSON.parse(fbState), ...etc }, ...args);
  };
  return func;
}

module.exports = {
  getCookie,
  getCookieAsync,
  stater,
};
