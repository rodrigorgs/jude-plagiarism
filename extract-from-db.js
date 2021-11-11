#!/usr/bin/env node

const { MongoClient } = require("mongodb");
const fs = require('fs').promises;

const CONTEST_REGEX = require('./config.js').CONTEST_REGEX

const client = new MongoClient('mongodb://localhost/', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

function simplifyString(str) {
  str = str.normalize("NFD").replace(/[\u0300-\u036f]/g, "")
  return str.replace(/[^A-Za-z_0-9]| /g, '_')
}

async function createFile(contest, problem, problem_index, user, submission) {
  const dirpath = `out/${simplifyString(contest.name)}/${problem_index}--${simplifyString(problem.name)}`;
  const filepath = `${dirpath}/${user.handle} ${user.name}.py`
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
  
  for await (contest of db.collection('contests').find({ name: { $regex: CONTEST_REGEX }})) {
    problem_index = 0
    for await (problem_info of contest.problems) {
      problem_index++
      const problem = await db.collection('problems').findOne({ "_id": problem_info.problem })

      const submissions = db.collection('submissions').aggregate([
          { "$match": { 
              contest: contest._id,
              problem: problem._id,
              timeInContest: { $ne: -1},
              "verdict.main.verdict": "VERDICT_AC",
              // language: { $in: ["Py2", "Py3"] },
            }
          },
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
        
        // console.log(user.name);
        // for await (const user_submission of db.collection('submissions').find({ "_creator": user._id, "contest": submission.contest, "problem": submission.problem }).sort({ time: -1 })) {
        //   console.log('  ', user_submission.time, ' ', user_submission.verdict.main.verdict)
        // }
        createFile(contest, problem, problem_index, user, submission)
      }
    }
  }
 
  client.close()
}

run().catch(console.dir);