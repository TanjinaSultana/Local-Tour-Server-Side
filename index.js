const express = require('express')
const cors = require('cors')
const jwt = require('jsonwebtoken');
const cookieParser = require('cookie-parser');
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
require('dotenv').config()
const app = express()
const port = process.env.PORT || 5000;


app.use(cors({
  origin: ['http://localhost:5173', 'https://service-client-side.web.app', 'https://service-client-side.firebaseapp.com'],
  credentials: true
}));
app.use(express.json())
app.use(cookieParser())

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.asca0m7.mongodb.net/?retryWrites=true&w=majority`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});
//middlewares
// const verifyToken = async(req,res,next) =>{
//  const token = req.cookies?.token;
//  if(!token){
//   return res.status(401).send({message: 'not authorized'})
//  }
//  jwt.verify(token,process.env.ACCESS_TOKEN_SECRET,(err,decoded) =>{
//   if(err){
//     console.log(err);
//     return res.status(401).send({message: 'Unauthorized'})
//   }
//   console.log("value in token",decoded)
//   req.user = decoded;
//   next()
//  })



// }
const logger = async =(req,res,next) =>{

  console.log('called : ',req.hostname,req.originalUrl);
  next();
}
const verifyToken = async (req, res, next) => {
  const token = req.cookies?.token;
  console.log(token);
  if (!token) {
    return res.status(401).send({ message: 'unauthorized' })
  }
  jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, decoded) => {
    if (err) {
      console.log(err);
      return res.status(401).send({ message: 'not auhtorized' })
    }
   
     req.user = decoded;
    next()
  })
}
async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    //await client.connect();
    const database = client.db("productDB");
    const serviceCollection = database.collection("product");
    const databaseUser = client.db("serviceDB");
    const userCollection = databaseUser.collection("userService");


    app.post('/jwt', async (req, res) => {
      const user = req.body;
      console.log(user);
      const token = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, { expiresIn: '1h' })
      res
        .cookie('token', token, {
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
          sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'strict', })
        .send({ success: true })
})

 app.post('/logout', async (req, res) => {
      const user = req.body;
      console.log("logging out", user);
      res.clearCookie('token', {
        maxAge: 0, httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'strict',

      }).send({ success: true })
    })

    //getting services
    app.get('/service', async (req, res) => {
      // console.log(req.query);
      // let query ={};
      // const serviceName = req.query.serviceName;
      // console.log(serviceName);

      // if(serviceName){
      //  query = {serviceName:  req.query.serviceName}
      // }
      const cursor = serviceCollection.find();
      const result = await cursor.toArray();
      res.send(result);
    })

    app.post('/service', async (req, res) => {
      const newProduct = req.body;
      console.log(newProduct);

      const result = await serviceCollection.insertOne(newProduct);
      res.send(result)
    })



    //getting user services
    app.get('/userService',logger,verifyToken, async (req, res) => {
      
      console.log('user ', req.user);
      console.log('tok tok', req.cookies?.token);
      console.log(req.query.email);

      if (req.query.email !== req.user.email) {
        return res.status(403).send({ message: 'forbidden access' })
      }
      let query = {}
      if (req.query?.email) {
        query = { email: req.query.email }
      }
      const cursor = userCollection.find(query);
      const result = await cursor.toArray();
      res.send(result);
    })

    app.post('/userService', async (req, res) => {
      const newService = req.body;
      console.log(newService);

      const result = await userCollection.insertOne(newService);
      res.send(result)
    })


    //updatebooking 
    app.patch('/service/:id', async (req, res) => {
      const id = req.params.id;
      const query = { _id: id }
      const updatedBooking = req.body;
      console.log(updatedBooking);
      const updateDoc = {
        $set: {
          status: updatedBooking.status
        },
      };
      const result = await serviceCollection.updateOne(query, updateDoc);
      res.send(result);
      // const id = req.params.id;
      // console.log(id);
      // const filter = { _id: new ObjectId(id) };
      // const updatedBooking = req.body;
      // console.log(updatedBooking);
      // const updateDoc = {
      //     $set: {
      //         status: updatedBooking.status
      //     },
      // };
      // const result = await serviceCollection.updateOne(filter, updateDoc);
      // res.send(result);

    })
    app.delete('/service/:id', async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) }
      const result = await serviceCollection.deleteOne(query)
      res.send(result);
    })
    app.get('/service/:id', async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) }
      const result = await serviceCollection.findOne(query)
      res.send(result);
    })

    app.put('/service/:id', async (req, res) => {
      const id = req.params.id;
      const updatedProduct = req.body;
      const filter = { _id: new ObjectId(id) };
      const options = { upsert: true };
      const userUpdate = {
        $set: {
          serviceName: updatedProduct.serviceName,
          name: updatedProduct.name,
          image: updatedProduct.image,
          email: updatedProduct.email,
          area: updatedProduct.area,

          price: updatedProduct.price,
          shortDesc: updatedProduct.shortDesc
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