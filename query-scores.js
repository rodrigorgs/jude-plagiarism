const { MongoClient, ObjectID } = require("mongodb");
const fs = require('fs').promises;

CONTEST_REGEX = /(?<type>Lista|Prova) (?<number>\d+) - \b(?:ILP|PD|IPD)\b/

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

async function run() {
  await client.connect()
  
  const db = client.db("jude-dev")
  
  for await (contest of db.collection('contests').find()) {
    // console.log(contest.name)
    let match = contest.name.match(CONTEST_REGEX)
    if (match) {
      const contest_type = match.groups.type
      const contest_number = match.groups.number
      const contest_key = `${contest_type[0]}${contest_number}`
      // console.log(`*** Contest ${contest_key}`)

      // TODO: verificar
      const acceptedFilter = {
        'contest': contest._id,
        'verdict.main.verdict': 'VERDICT_AC',
        'verdict.main.score': 1,
        'timeInContest': { $gte: 0 },
      }
      const submissions = await db.collection('submissions').find(acceptedFilter).toArray(); 
      const aluno_ids = new Set(submissions.map(s => s._creator.toString()))
      
      for (aluno_id of aluno_ids) {
        const alunoNome = (await db.collection('users').findOne({ '_id': new ObjectID(aluno_id) })).name;
        const problemsSolved = new Set(submissions.filter(s => s._creator.toString() == aluno_id).map(s => s.problem.toString()))
        if (!data[alunoNome]) {
          // const alunoNome = 'x';
          data[alunoNome] = { nome: alunoNome, contest_scores: {}}
        }
        data[alunoNome].contest_scores[contest._id] = {'name': contest.name, 'key': contest_key, 'score': problemsSolved.size}
      }
    }
  }
  client.close()

  let scoreByKey = {}
  Object.entries(data).forEach(([alunoNome, alunoData]) => {
    scoreByKey[alunoNome] = {}
    for (contestData of Object.values(alunoData.contest_scores)) {
      if (!scoreByKey[alunoNome][contestData.key]) {
        scoreByKey[alunoNome][contestData.key] = 0
      }
      if (contestData.score > scoreByKey[alunoNome][contestData.key]) {
        scoreByKey[alunoNome][contestData.key] = contestData.score
      }
    }
  })

  // console.log(JSON.stringify(scoreByKey, null, 4))
  console.log(JSON.stringify(scoreByKey))
}

run().catch(console.dir);