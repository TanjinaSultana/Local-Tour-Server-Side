const express = require('express')
const cors = require('cors')
require('dotenv').config()
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const app = express()
const port =process.env.PORT || 5000;


app.use(cors())
app.use(express.json())

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.asca0m7.mongodb.net/?retryWrites=true&w=majority`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    //await client.connect();
    const database = client.db("productDB");
    const serviceCollection = database.collection("product");
    const databaseUser = client.db("userDB");
    const userCollection = databaseUser.collection("user");
    app.get('/service', async(req,res) =>{
        const cursor = serviceCollection.find();
        const result = await cursor.toArray();
        res.send(result);
    })
    app.post('/service',async(req,res) =>{
        const newProduct = req.body;
        console.log(newProduct);
       
        const result = await serviceCollection.insertOne(newProduct);
        res.send(result)
    })
    app.post('/userService',async(req,res) =>{
        const newService = req.body;
        console.log(newService);
       
        //const result = await userCollection.insertOne(newService);
        res.send(result)
    })
    app.get('/userService', async(req,res) =>{
        const cursor = userCollection.find();
        const result = await cursor.toArray();
        res.send(result);
    })

app.delete('/service/:id',async(req,res) =>{
    const id = req.params.id;
    const query = {_id: new  ObjectId(id)}
    const result = await serviceCollection.deleteOne(query)
    res.send(result);
})
app.get('/service/:id',async(req,res) =>{
    const id = req.params.id;
    const query = {_id: new ObjectId(id)}
    const result = await serviceCollection.findOne(query)
    res.send(result);
})

app.put('/service/:id',async(req,res)=>{
    const id = req.params.id;
    const updatedProduct = req.body;
    const filter = {_id: new ObjectId(id) };
    const options = { upsert: true };
    const userUpdate = {
      $set: {
        serviceName:updatedProduct.serviceName,
             name:updatedProduct.name,
            image:updatedProduct.image,
            email:updatedProduct.email,           
            area:updatedProduct.area,

           price:updatedProduct.price,
    shortDesc:updatedProduct.shortDesc
      },
    }
    const result = await serviceCollection.updateOne(filter, userUpdate, options);
    res.send(result)

   })


    // Send a ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 });
    console.log("Pinged your deployment. You successfully connected to MongoDB!");
  } finally {
    // Ensures that the client will close when you finish/error
    //await client.close();
  }
}
run().catch(console.dir);


app.get('/', (req, res) => {
  res.send('Hello World!')
})

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`)
})