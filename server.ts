import express from "express";
import { Application } from "express";

// Create the express app and  import the type of app from express;
const app: Application = express();
const dotenv = require("dotenv");
dotenv.config({path: 'config.env'});

// Parser
app.use(express.json());
app.use(
  express.urlencoded({
    extended: true,
  })
);
const PORT: number = Number(process.env.PORT) ;

// Listen the server
app.listen(PORT, async () => {
    console.log(`🗄️  Server Fire on http:localhost//${PORT}`);
  });

app.get("/", (req, res) => {
    res.send("<h1>Welcome </h1>");
  });

