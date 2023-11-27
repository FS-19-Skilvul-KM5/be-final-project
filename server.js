const express = require("express");
const connectDb = require("./config/dbConnection");
require("dotenv").config();
const cors = require("cors");
const bodyParser = require("body-parser");

connectDb();
const app = express();
app.use(cors());

const port = process.env.PORT || 3000;

app.use(express.json());
app.use("/v1/api/users", require("./src/routes/userRoutes"));
app.use("/v1/api/auth", require("./src/routes/authRoutes"));
app.use("/v1/api/articles", require("./src/routes/articlesRoutes"));
app.use("/v1/api/workshop", require("./src/routes/workshopRoutes"));
app.use("/v1/api/educations", require("./src/routes/educationsRoutes"));

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
