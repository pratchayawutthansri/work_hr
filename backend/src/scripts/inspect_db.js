const mongoose = require("mongoose");
const uri = "mongodb://127.0.0.1:27017/worhr";

async function inspectDb() {
  await mongoose.connect(uri);
  console.log("Connected to MongoDB");

  const collections = await mongoose.connection.db.listCollections().toArray();
  console.log("Collections:", collections.map(c => c.name));

  for (const col of collections) {
    const name = col.name;
    const count = await mongoose.connection.db.collection(name).countDocuments();
    console.log(`- Collection ${name}: ${count} documents`);
    if (count > 0) {
      const sample = await mongoose.connection.db.collection(name).findOne();
      console.log(`  Sample doc:`, JSON.stringify(sample, null, 2));
    }
  }

  await mongoose.disconnect();
}

inspectDb().catch(console.error);
