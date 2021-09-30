#!/usr/bin/env node

OUTPUT_FOLDER = 'jplag'

const fs = require('fs')
const fsPromises = require('fs').promises;
const process = require('process');
const util = require('util');

main()
  .then(() => client.close())
  .catch(console.dir)

async function main() {
  try {
    await fsPromises.mkdir('report')
  } catch (e) {
  }

  process.chdir('out')
  for (const lista of fs.readdirSync('.')) {
    console.log(lista)
    if (lista.startsWith('.')) {
      continue
    }
    process.chdir(lista)
    for (const questao of fs.readdirSync('.')) {
      console.log(questao)
      if (questao.startsWith('.')) {
        continue
      }
      process.chdir(questao)

      await computePlagiarism(lista, questao)

      process.chdir('..')
    }
    process.chdir('..')
  }
  process.chdir('..')
}

const readFile = util.promisify(fs.readFile)
const writeFile = util.promisify(fs.writeFile)

async function computePlagiarism(lista, questao) {
  const output = await execShellCommand(`java -jar ../../../tools/jplag-2.12.1-SNAPSHOT-jar-with-dependencies.jar -s -l python3 -r ../../../${OUTPUT_FOLDER}/${lista}--${questao} .`)
  console.log(output)
}

// https://ali-dev.medium.com/how-to-use-promise-with-exec-in-node-js-a39c4d7bbf77
/**
 * Executes a shell command and return it as a Promise.
 * @param cmd {string}
 * @return {Promise<string>}
 */
 function execShellCommand(cmd) {
  const exec = require('child_process').exec;
  return new Promise((resolve, reject) => {
   exec(cmd, (error, stdout, stderr) => {
    if (error) {
     console.warn(error);
    }
    resolve(stdout? stdout : stderr);
   });
  });
 }


const students = {}

const { MongoClient } = require("mongodb");

const client = new MongoClient('mongodb://localhost/', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});
let db = undefined;

async function getStudentName(login) {
  if (!db) {
    await client.connect()
    db = client.db("jude-dev")    
  }
  if (!(login in students)) {
    const user = await db.collection('users').findOne({ "handle": login })
    students[login] = user.name
  }
  return students[login]
}
