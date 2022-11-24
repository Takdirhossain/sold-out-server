const express = require("express");
const cors = require("cors");
const jwt = require("jsonwebtoken");
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
require("dotenv").config();

const app = express();
const port = process.env.PORT || 5000;

// middlewares
app.use(cors());
app.use(express.json());

const uri =
  "mongodb+srv://aircnc:C8o2xN8kfskHomGS@cluster0.eurlfla.mongodb.net/?retryWrites=true&w=majority";
console.log(uri);
const client = new MongoClient(uri, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  serverApi: ServerApiVersion.v1,
});

function run() {
  try {
    const usersCollection = client.db("sold-out").collection("users");
    const bookingsCollection = client.db("sold-out").collection("bookings");
    
    app.put("/user/:email", async (req, res) => {
      const email = req.params.email;
      const user = req.body;
      const filter = { email: email };
      const options = { upsert: true };
      const updateDoc = {
        $set: user,
      };
      const result = await usersCollection.updateOne(
        filter,
        updateDoc,
        options
      );
      console.log(result);

      const token = jwt.sign(user, "gggg", {
        expiresIn: "1d",
      });
      console.log(token);
      res.send({ result, token });
    });
  } finally {
  }
}
run();

app.get("/", (req, res) => {
  res.send("Server is running... in session");
});

app.listen(port, () => {
  console.log(`Server is running...on ${port}`);
});
