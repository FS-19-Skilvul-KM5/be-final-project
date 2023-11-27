const express = require("express");
const connectDb = require("./config/dbConnection");
require("dotenv").config();
const bodyParser = require("body-parser");

connectDb();
const app = express();

const port = process.env.PORT || 3000;

app.use(express.json());
app.use("/v1/api/users", require("./src/routes/userRoutes"));
app.use("/v1/api/auth", require("./src/routes/authRoutes"));
app.use("/v1/api/articles", require("./src/routes/articlesRoutes"));

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
