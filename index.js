const express = require('express')
const { MongoClient, ServerApiVersion } = require('mongodb');
const cors=require('cors')
require('dotenv').config()
var jwt = require('jsonwebtoken');
const app = express()
const port = process.env.PORT || 7000


app.use(cors())
app.use(express.json())


console.log(process.env.DB_USER,process.env.DB_PASS)
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.3jlrk4o.mongodb.net/?retryWrites=true&w=majority`;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });

function verifyJWT(req, res, next) {

  const authHeader = req.headers.authorization;
  if (!authHeader) {
      return res.status(401).send('unauthorized access');
  }

  const token = authHeader.split(' ')[1];

  jwt.verify(token, process.env.ACCESS_TOKEN, function (err, decoded) {
      if (err) {
          return res.status(403).send({ message: 'forbidden access' })
      }
      req.decoded = decoded;
      next();
  })

}

async function run(){
    try{

        const bookCollection=client.db("bookRestore").collection("books")
        const categoriesCollection=client.db("bookRestore").collection("categories")
        const usersCollection=client.db("bookRestore").collection("users")


        app.get("/jwt",async(req,res)=>{
          const email=req.query.email;
          const query={email:email};
          const user=await usersCollection.findOne(query);
          console.log(user)
          if(user){
            const token=jwt.sign({email}, process.env.TOKEN,{expiresIn:"1d"})
            console.log(token)
            res.send({bookToken:token})
          }

          else{
            res.status(403).send({bookToken:""})
          }
        })


        // books

        app.get("/categories",async(req,res)=>{
          const query={}
          const categories=await categoriesCollection.find(query).toArray()

          res.send(categories)
        })
        app.get("/categories/:name",async(req,res)=>{
          const genre=req.params.name;
          console.log(genre)
          const query={genre:genre}
          const books=await bookCollection.find(query).toArray()

          res.send(books)
        })
        

        // users

        app.post("/users",async(req,res)=>{
         const user=req.body
          const result=await usersCollection.insertOne(user)
          console.log(result)
          res.send(result)
        })
    }

    finally{


    }
}


run().catch(er=>console.error(er))







app.get('/', (req, res) => {
  res.send('Hello World!')
})

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`)
})