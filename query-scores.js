#!/usr/bin/env node

const { MongoClient, ObjectID } = require("mongodb");
const fs = require('fs').promises;

const CONTEST_REGEX = require('./config.js').CONTEST_REGEX

const client = new MongoClient(`mongodb://${process.env.HOST || 'localhost'}/`, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

/*
data = {
  "fulano": {
    nome: "fulano",
    contest_scores: {
      "4567890": {name: "Prova 1 - ILP PD - QUI 18:30" , key: 'P1', score: 2 }
    }
  }
}
*/

data = {}

function getContestPrefix(contest_type) {
  if (contest_type == 'Lista') {
    return 'L'
  } else if (contest_type == 'Prova' || contest_type == 'Avaliação') {
    return 'P'
  } else  {
    throw new Error(`Unknown contest type: ${contest_type}`)
  }
}

async function run() {
  await client.connect()
  
  const db = client.db("jude-dev")
  
  for await (contest of db.collection('contests').find()) {
    // console.log(contest.name)
    let match = contest.name.match(CONTEST_REGEX)
    if (match) {
      const contest_type = match.groups.type
      const contest_number = match.groups.number
      const contest_key = `${getContestPrefix(contest_type)}${contest_number}`
      // console.log(`*** Contest ${contest_key}`)

      // TODO: verificar
      const acceptedFilter = {
        'contest': contest._id,
        'verdict.main.verdict': 'VERDICT_AC',
        'verdict.main.score': 1,
        'language': { $in: ["Py2", "Py3"] },
        'timeInContest': { $gte: 0 },
      }
      const submissions = await db.collection('submissions').find(acceptedFilter).toArray(); 
      const aluno_ids = new Set(submissions.map(s => s._creator.toString()))
      
      for (aluno_id of aluno_ids) {
        const aluno = (await db.collection('users').findOne({ '_id': new ObjectID(aluno_id) }))
        const alunoHandle = aluno.handle;
        const problemsSolved = new Set(submissions.filter(s => s._creator.toString() == aluno_id).map(s => s.problem.toString()))
        if (!data[alunoHandle]) {
          // const alunoHandle = 'x';
          data[alunoHandle] = { handle: alunoHandle, nome: aluno.nome, contest_scores: {}}
        }
        data[alunoHandle].contest_scores[contest._id] = {'name': contest.name, 'key': contest_key, 'score': problemsSolved.size}
      }
    }
  }
  client.close()

  let scoreByKey = {}
  Object.entries(data).forEach(([alunoHandle, alunoData]) => {
    scoreByKey[alunoHandle] = {}
    for (contestData of Object.values(alunoData.contest_scores)) {
      if (!scoreByKey[alunoHandle][contestData.key]) {
        scoreByKey[alunoHandle][contestData.key] = 0
      }
      if (contestData.score > scoreByKey[alunoHandle][contestData.key]) {
        scoreByKey[alunoHandle][contestData.key] = contestData.score
      }
    }
  })

  // console.log(JSON.stringify(scoreByKey, null, 4))
  console.log(JSON.stringify(scoreByKey))
}

run().catch(console.dir);