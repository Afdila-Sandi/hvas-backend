require("dotenv").config();

const express = require("express");
const cors = require("cors");
const path = require("path");
const authRoutes = require("./src/routes/authRoutes");

const app = express();
const PORT = process.env.PORT || 5001;

// Middleware
app.use(cors());
app.use(express.json());

// Sajikan folder 'public' sebagai file statis
app.use(express.static(path.join(__dirname, "public")));

app.use("/", authRoutes);

app.listen(PORT, () => {
  console.log(`Auth Service berjalan di port ${PORT}`);
});
