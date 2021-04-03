const { MongoClient } = require("mongodb");
const fs = require('fs').promises;

const client = new MongoClient('mongodb://localhost/', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

function simplifyString(str) {
  str = str.normalize("NFD").replace(/[\u0300-\u036f]/g, "")
  return str.replaceAll(/[^A-Za-z_0-9]| /g, '_')
}

async function run() {
  await client.connect()

  const db = client.db("jude-dev");
  
  // TODO: filtrar por submissões aceitas
  const submissions = await db.collection('submissions').aggregate([
    { "$group": { 
      "_id": { creator: "$_creator", problem: "$problem" },
      "doc": { "$last": "$$ROOT" }
    }}
  ]);

  const all = await submissions.toArray()
  const count = all.length

  let index = 0
  for await (v of all) {
    const codigo = v["doc"]["code"]
    const creator_id = v["_id"]["creator"]
    const user = await db.collection('users').findOne({ "_id" : creator_id })
    const username = user['handle']
    const problem_id = v["_id"]["problem"]
    const problem = await db.collection('problems').findOne({ "_id" : problem_id })
    const problem_name = problem['name']
    const contest = await db.collection('contests').findOne({ "_id": v["doc"]["contest"] })
    if (!contest) {
      console.error(`Contest not found for problem ${problem_name}`)
      continue
    }
    
    const contest_name = contest['name']
    
    const path = `out/${simplifyString(contest_name)}/${simplifyString(problem_name)}`;
    console.log(path);
    try {
      await fs.mkdir(path, { recursive: true })
    } catch (e) {
    }
    await fs.writeFile(path + '/' + username + '.cpp', codigo)  

    index++
    console.log(`Finished ${index} of ${count}`)
  }

  client.close()
}

run().catch(console.dir);