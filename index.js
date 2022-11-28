const express = require("express");
const cors = require("cors");
const jwt = require("jsonwebtoken");
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
require("dotenv").config();

const app = express();
const port = process.env.PORT || 5000;
const stripe = require("stripe")(
  "sk_test_51M94shLK7u67kFYD9OI6j9arhH4Xc4MMZaqbMr0ZaCMz0DwmQSQ1BGvUxJzyQON7j22WpYS7KSa5m1og5vCFduet00oB11nnWZ"
);
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
    const reportCollection = client.db("sold-out").collection("report");
    const paymentsCollection = client.db("sold-out").collection("payments");

    app.post("/create-payment-intent", async (req, res) => {
      const data = req.body;
      const price = data.sellPrice;
      const amount = price * 100;
      const paymentIntent = await stripe.paymentIntents.create({
        currency: "usd",
        amount: amount,
        payment_method_types: ["card"],
      });
      res.send({
        clientSecret: paymentIntent.client_secret,
      });
    });

    app.post("/payments", async (req, res) => {
      const payment = req.body;
      const result = await paymentsCollection.insertOne(payment);
      const id = payment.paymentId;
      
      const options = { upsert: true };
      const query = { _id: ObjectId(id) };
      const updateDoc = {
        $set: {
          paid: true,
          transactionId: payment.transactionId,
        },
      };
      const updateResult = await bookingsCollection.updateOne(
        query,
        updateDoc,
        options
      );
      res.send(result, updateResult);
    })

    app.post("/bookings", async (req, res) => {
      const id = req.body;
      console.log(id);
      const query = {
        name: id.name,
        email: id.email,
      };
      const alreadyBooked = await bookingsCollection.find(query).toArray();
      if (alreadyBooked.length) {
        const message = `You already Booked This `;
        return res.send({ acknowledge: false, message });
      }
      const result = await bookingsCollection.insertOne(id);
      res.send(result);
    });

    app.post("/report", async (req, res) => {
      const id = req.body;
      console.log(id);
      const query = {
        productid: id.productid,
        reporteremail: id.reporteremail,
      };
      const alreadyBooked = await reportCollection.find(query).toArray();
      if (alreadyBooked.length) {
        const message = `You already Reported This `;
        return res.send({ acknowledge: false, message });
      }
      const result = await reportCollection.insertOne(id);
      res.send(result);
    });

    app.get("/report", async (req, res) => {
      const query = {};
      const data = await reportCollection.find(query).toArray();
      res.send(data);
    });

    app.delete("/report", async (req, res) => {
      const id = req.query.id;
      const query = { productid: id };
      const result = await reportCollection.deleteOne(query);
      res.send(result);
    });

    app.post("/user", async (req, res) => {
      const user = req.body;
      const result = await usersCollection.insertOne(user);
      res.send(result);
    });
    app.put("/user/:email", async (req, res) => {
      const email = req.params.email;
      const user = req.body;
      const filter = { email: email };
      const options = { upsert: true };
      const updateDoc = {
        $set: {
          verify: "verifyed",
        },
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

    app.get("/category", async (req, res) => {
      const query = {};
      const result = await categoryCollection.find(query).toArray();
      res.send(result);
    });

    app.get("/category/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: ObjectId(id) };
      const result = await categoryCollection.findOne(query);
      res.send(result);
    });
    app.post("/products", async (req, res) => {
      const products = req.body;
      const result = await productCollection.insertOne(products);
      res.send(result);
    });


    app.delete("/products/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: ObjectId(id) };
      const result = await productCollection.deleteOne(query);
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

    app.delete("/user/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: ObjectId(id) };
      const result = await usersCollection.deleteOne(query);
      res.send(result);
    });

    app.get("/user", async (req, res) => {
      const alluser = {};
      const result = await usersCollection.find(alluser).toArray();
      res.send(result);
    });

    app.get("/verified", async (req, res) => {
      let alluser = {};
      if (req.query.email) {
        alluser = { email: req.query.email };
      }
      const result = await usersCollection.findOne(alluser);
      res.send(result);
    });

    app.get("/bookings", async (req, res) => {
      let query = {};
      if (req.query?.email) {
        query = { email: req.query?.email };
      }
      const result = await bookingsCollection.find(query).toArray();
      res.send(result);
    });

    app.get("/bookings/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: ObjectId(id) };
      const result = await bookingsCollection.findOne(query);
      res.send(result);
    });

    app.get("/product", async (req, res) => {
      let query = {};
      if (req.query?.email) {
        query = { email: req.query?.email };
      }
      const cursor = productCollection.find(query);
      const review = await cursor.toArray();
      res.send(review);
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
