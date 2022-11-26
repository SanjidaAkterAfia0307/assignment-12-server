const express = require('express')
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const cors = require('cors')
require('dotenv').config()
var jwt = require('jsonwebtoken');
const app = express()
const port = process.env.PORT || 7000


app.use(cors())
app.use(express.json())


console.log(process.env.DB_USER, process.env.DB_PASS)
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.3jlrk4o.mongodb.net/?retryWrites=true&w=majority`;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });

function verifyJWT(req, res, next) {

  const authHeader = req.headers.authorization;
  console.log(authHeader)
  if (!authHeader) {
    return res.status(401).send('unauthorized access');
  }

  const token = authHeader.split(' ')[1];

  jwt.verify(token, process.env.TOKEN, function (err, decoded) {
    if (err) {
      return res.status(403).send({ message: 'forbidden access' })
    }
    req.decoded = decoded;
    next();
  })

}

async function run() {
  try {

    const bookCollection = client.db("bookRestore").collection("books")
    const categoriesCollection = client.db("bookRestore").collection("categories")
    const usersCollection = client.db("bookRestore").collection("users")
    const bookingsCollection = client.db("bookRestore").collection("bookings")

      // admin verify 
    
  }

  // Seller verify
    const verifySeller = async (req, res, next) => {
      const decodedEmail = req.decoded.email;
      const query = { email: decodedEmail };
      const user = await usersCollection.findOne(query);

      if (user?.role !== 'Seller') {
          return res.status(403).send({ message: 'forbidden access' })
      }
      next();
  }


    app.get("/jwt", async (req, res) => {
      const email = req.query.email;
      const query = { email: email };
      const user = await usersCollection.findOne(query);
      console.log(user)
      if (user) {
        const token = jwt.sign({ email }, process.env.TOKEN, { expiresIn: "1d" })
        console.log(token)
        res.send({ bookToken: token })
      }

      else {
        res.status(403).send({ bookToken: "" })
      }
    })


    // books

    app.get("/categories", async (req, res) => {
      const query = {}
      const categories = await categoriesCollection.find(query).toArray()

      res.send(categories)
    })
    app.get("/categories/:name", async (req, res) => {
      const genre = req.params.name;
      console.log(genre)
      const query = { genre: genre }
      const books = await bookCollection.find(query).toArray()

      res.send(books)
    })

    app.get('/bookGenre', async (req, res) => {
      const query = {}
      const result = await categoriesCollection.find(query).project({ genre: 1 }).toArray();
      res.send(result);


    })

    app.get('/advertiseBooks', async (req, res) => {
      const query = { advertise: true }
      const books = await bookCollection.find(query).limit(10).toArray()
      res.send(books)
    })

    app.post('/books',verifyJWT,verifySeller, async (req, res) => {
      const user = req.body
      const post = Date()
      const result = await bookCollection.insertOne({ ...user, post: post })
      console.log(result)
      res.send(result)
    })


    // users

    app.post("/users", async (req, res) => {
      const user = req.body
      const result = await usersCollection.insertOne(user)
      console.log(result)
      res.send(result)
    })


    app.get("/users/seller/:email", async (req, res) => {
      const email = req.params.email;
      const query = { email: email }
      const user = await usersCollection.findOne(query)
      console.log(user.role === "Seller")
      res.send(user.role === "Seller")
    })
    app.get("/users/admin/:email", async (req, res) => {
      const email = req.params.email;
      const query = { email: email }
      const user = await usersCollection.findOne(query)
      console.log(user.role === "Admin")
      res.send(user.role === "Admin")
    })

    // seller
    app.get("/sellers",verifyJWT,verifyAdmin, async (req, res) => {

      const query = { role: "Seller" }
      const sellers = await usersCollection.find(query).toArray()

      console.log(sellers)
      res.send(sellers)
    })

    app.delete('/sellers/:id',verifyJWT,verifyAdmin, async (req, res) => {
      const id = req.params.id;
      const query = { _id: ObjectId(id) }
      const result = await usersCollection.deleteOne(query)
      console.log(result)
      res.send(result)
    })


    app.put('/sellers/:id',verifyJWT,verifyAdmin, async (req, res) => {
      const id = req.params.id;
      const query = { _id: ObjectId(id), role: "Seller" }

      const seller = await usersCollection.findOne(query)
      const email = seller.email;
      const filter = { sellerEmail: email }
      const updateDoc = {
        $set: {
          verify: true
        },
      };
      const result = await bookCollection.updateOne(filter, updateDoc)
      console.log(result)
      res.send(result)
    })


    // buyers 

    app.get("/buyers",verifyJWT,verifyAdmin, async (req, res) => {

      const query = { role: "Buyer" }
      const sellers = await usersCollection.find(query).toArray()

      console.log(sellers)
      res.send(sellers)
    })

    app.delete('/buyers/:id',verifyJWT,verifyAdmin, async (req, res) => {
      const id = req.params.id;
      const query = { _id: ObjectId(id) }
      const result = await usersCollection.deleteOne(query)
      console.log(result)
      res.send(result)
    })



    // seller-books

    app.get('/books/:email', async (req, res) => {
      const email = req.params.email;
      console.log(email)
      const query = { sellerEmail: email }
      const books = await bookCollection.find(query).toArray()

      res.send(books)
    })
    app.get('/bookings/:email', async (req, res) => {
      const email = req.params.email;
      console.log(email)
      const query = { sellerEmail: email }
      const books = await bookingsCollection.find(query).toArray()

      res.send(books)
    })

    app.delete('/books/:id', async (req, res) => {
      const id = req.params.id;
      const query = { _id: ObjectId(id) }
      const result = await bookCollection.deleteOne(query)
      console.log(result)
      res.send(result)
    })


    app.put('/books/:id', async (req, res) => {
      const id = req.params.id;
      const query = { _id: ObjectId(id) }

      const options = { upsert: true };

      const updateDoc = {
        $set: {
          advertise: true
        },
      };
      const result = await bookCollection.updateOne(query, updateDoc, options)
      console.log(result)
      res.send(result)
    })


    // booking

    app.post("/bookings", async (req, res) => {
      const booking = req.body
      const result = await bookingsCollection.insertOne(booking)
      console.log(result)
      res.send(result)
    })

  }

  finally {


  }
}


run().catch(er => console.error(er))







app.get('/', (req, res) => {
  res.send('Hello World!')
})

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`)
})