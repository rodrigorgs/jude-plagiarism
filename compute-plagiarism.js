#!/usr/bin/env node

const fs = require('fs')
const fsPromises = require('fs').promises;
const process = require('process');
const hljs = require('highlight.js');
const util = require('util');
const escape = require('escape-html');

const SHERLOCK='../../../tools/sherlock/sherlock'

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
    process.chdir(lista)
    for (const questao of fs.readdirSync('.')) {
      console.log(questao)
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
  const output = await execShellCommand(`${SHERLOCK} -z 3 -t 70% -r -e cpp . | sort -t ';' -k 3 -nr | sed -e 's/;/ /g' | sed -e 's/\\.\\///g' | sed -e 's/ /\\t/g'`) // | tee ../../../report/${lista}--${questao}.txt`)
  console.log(output)
  
  if (output.trim().length > 0) {
    let html = `<html>
    <head>
      <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/highlight.js/10.7.2/styles/default.min.css">
      <script src="https://cdnjs.cloudflare.com/ajax/libs/highlight.js/10.7.2/highlight.min.js"></script>
      <script>hljs.highlightAll();</script>
      <style>
        td {
          vertical-align: text-top;
        }
      </style>
    </head>
    <body><h1>${lista}</h1><h2>${questao}</h2>`

    let numPairs = output.trim().split('\n').length
    for (const line of output.trim().split('\n')) {
      const [filename1, filename2, similarity] = line.split('\t')
      const contents1 = await readFile(filename1, 'utf8')
      const contents2 = await readFile(filename2, 'utf8')
      const login1 = filename1.replace('.cpp', '')
      const login2 = filename2.replace('.cpp', '')
      const student1 = await getStudentName(login1)
      const student2 = await getStudentName(login2)
      
      html += `<h3><pre>${similarity}\t${login1}\t${student1}\t${login2}\t${student2}</pre></h3>`
      if (contents1.trim() == contents2.trim()) {
        html += `<p style="color: red;">Conteúdo idêntico!</p>`
      }
      html += `<table><tr><td>
      <pre><code class="lang-c++">${escape(contents1)}</code></pre>
      </td><td>
      <pre><code class="lang-c++">${escape(contents2)}</code></pre>
      </td></tr></table><hr>`  
    }

    html += '</body></html>'
    await writeFile(`../../../report/${lista}--${questao}--${numPairs}-pairs.html`, html)
  }
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
