const DataValidation = ({ loginId, password }) => {
  return new Promise((resolve, reject) => {
    console.log(loginId, password);
    if (!loginId || !password) {
      return reject("Missing login credentials");
    }

    if (typeof loginId !== "string") {
      return reject("loginId is not a string");
    }

    if (typeof password !== "string") {
      return reject("password is not a string");
    }

    resolve();    
  });
}

module.exports = { DataValidation };
