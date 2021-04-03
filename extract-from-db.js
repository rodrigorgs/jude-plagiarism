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

async function createFile(contest, problem, user, submission) {
  const dirpath = `out/${simplifyString(contest.name)}/${simplifyString(problem.name)}`;
  const filepath = `${dirpath}/${user.handle}.cpp`
  console.log(filepath);

  try {
    await fs.mkdir(dirpath, { recursive: true })
  } catch (e) {
  }
  await fs.writeFile(filepath, submission.code)  
}

async function run() {
  await client.connect()

  const db = client.db("jude-dev")
  
  for await (contest of db.collection('contests').find()) {
    for await (problem_info of contest.problems) {
      const problem = await db.collection('problems').findOne({ "_id": problem_info.problem })

      const submissions = db.collection('submissions').aggregate([
          { "$match": { contest: contest._id, problem: problem._id } },
          { "$group": 
            { 
              "_id": { contest: "$contest", problem: "$problem", creator: "$_creator" },
              "submission": { "$last": "$$ROOT" }
            }
          }
      ]);
      
      for await (aggregate of submissions) {
        const submission = aggregate.submission
        const user = await db.collection('users').findOne({ "_id": submission._creator })
        
        createFile(contest, problem, user, submission)
      }
    }
  }
 
  client.close()
}

run().catch(console.dir);