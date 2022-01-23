const mongoose = require("mongoose");

exports.connectWithDb = () => {
  mongoose
    .connect(process.env.DB_URL, {})
    .then(console.log("DB connected succesfully"))
    .catch((err) => {
      console.log("DB connection issues");
      console.log(err);
    });
};
