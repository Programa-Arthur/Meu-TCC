import { MongoClient } from "mongodb";

const client = new MongoClient(
  "mongodb+srv://<db_username>:<db_password>@pxrt.2tbqsyf.mongodb.net/?appName=PXRT",
);

export async function connectToMongoDB() {
  try {
    await client.connect();
    console.log("You successfully connected to MongoDB!");
    return client;
  } catch (err) {
    console.dir(err);
  }
}

// Call this only when your application terminates
export async function disconnectFromMongoDB() {
  await client.close();
}
