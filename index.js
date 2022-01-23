require("dotenv").config();
const app = require("./app");
const { connectWithDb } = require("./config/db");

// connect with DB
connectWithDb();

app.listen(process.env.PORT, () => {
  console.log(`server is running at http://localhost:${process.env.PORT}`);
});
