export const MONGO_URI =  "mongodb+srv://Safaribust:bustsafari2022@cluster0.yuiecha.mongodb.net/?retryWrites=true&w=majority";

export const PORT = process.env.PORT || 8000;

//socket listening
// const { MongoClient, ServerApiVersion } = require('mongodb');
// const uri = "mongodb+srv://Safaribust:<password>@cluster0.yuiecha.mongodb.net/?retryWrites=true&w=majority";
// const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });
// client.connect(err => {
//   const collection = client.db("test").collection("devices");
//   // perform actions on the collection object
//   client.close();
// });