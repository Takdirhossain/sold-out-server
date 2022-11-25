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
    const categoryCollection = client.db("sold-out").collection("category");
    const usersCollection = client.db("sold-out").collection("users");
    const bookingsCollection = client.db("sold-out").collection("bookings");
    const productCollection = client.db("sold-out").collection("product");

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

    app.get("/user/:email", async (req, res) => {
      const email = req.params.email;
      const query = { email: email };

      const user = await usersCollection.findOne(query);
      console.log(user?.role);
      res.send(user);
    });

    app.get('/category',async(req,res)=>{
      const query={};
      const result=await categoryCollection.find(query).toArray()
      res.send(result)
  });

  app.get('/category/:id',async(req,res)=>{
      const id=req.params.id
      const query={_id:ObjectId(id)};
      const result=await categoryCollection.findOne(query)
      res.send(result)
  });
    app.post("/products", async (req, res) => {
      const products = req.body;
      const result = await productCollection.insertOne(products);
      res.send(result);
    });

    app.get("/products", async (req, res) => {
      let query = {};
      if (req.query.id) {
        query = { cateid: req.query?.id };
      }
      const result = await productCollection.find(query).toArray();
      res.send(result);
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
