#!/usr/bin/env node

const fs = require('fs')
const fsPromises = require('fs').promises;
const process = require('process');
// const hljs = require('highlight.js');
const util = require('util');
const escape = require('escape-html');

const SHERLOCK='../../../tools/sherlock/sherlock'
const PYCODE='../../../tools/pycode_similar_wrapper.py'


Promise.resolve()
  // .then(() => main('sherlock', sherlockCompute, sherlockParse))
  .then(() => main('pycode', pycodeCompute, pycodeParse))
  .then(() => client.close())
  .catch(console.dir)

async function main(output_folder, computeFn, parseFn) {
  try {
    await fsPromises.mkdir(output_folder)
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

      await computePlagiarism(lista, questao, output_folder, computeFn, parseFn)

      process.chdir('..')
    }
    process.chdir('..')
  }
  process.chdir('..')
}

const readFile = util.promisify(fs.readFile)
const writeFile = util.promisify(fs.writeFile)

////////////////////////////

async function pycodeCompute() {
  return await execShellCommand(`${PYCODE} | sort -t '\t' -k 3 -nr`)
}

async function pycodeParse(output) {
  if (output.trim().length == 0) {
    return []
  }
  
  return output.trim().split('\n').map(line => line.trim().split('\t'))
}

////////////////////////////
// run from folder that contains files
async function sherlockCompute() {
  return await execShellCommand(`${SHERLOCK} -z 2 -t 70% -r -e py . | sort -t ';' -k 3 -nr | sed -e 's/;/ /g' | sed -e 's/\\.\\///g' | sed -e 's/.py /.py\\t/g'`)
}

async function sherlockParse(output) {
  if (output.trim().length == 0) {
    return []
  }
  
  return output.trim().split('\n').map(line => line.trim().split('\t'))
}

///////////////////////////

// parseFn deve gerar um array de itens, cada um no seguinte formato:
//    [filename1, filename2, similarity]
async function computePlagiarism(lista, questao, output_folder, computeFn, parseFn) {
  const output = await computeFn()
  console.log(output)
  const pairs = await parseFn(output)
  // console.log(pairs)
  
  if (pairs.length > 0) {
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

    for (pair of pairs) {
      const [filename1, filename2, similarity] = pair
      console.log('readFile ', filename1, filename2) //, 'dir: ', process.cwd())
      const contents1 = await readFile(filename1, 'utf8')
      const contents2 = await readFile(filename2, 'utf8')
      const login1 = filename1.replace(/ .*/, '')//filename1.replace('.cpp', '').replace(/^a\d+\s/, '')
      const login2 = filename2.replace(/ .*/, '')//filename2.replace('.cpp', '').replace(/^a\d+\s/, '')
      // console.log('login1', `'${login1}'`)
      const student1 = await getStudentName(login1)
      const student2 = await getStudentName(login2)
      
      html += `<h3><pre>${similarity}\t${login1}\t${student1}\t${login2}\t${student2}</pre></h3>`
      if (contents1.trim() == contents2.trim()) {
        html += `<p style="color: red;">Conteúdo idêntico!</p>`
      }
      html += `<table><tr><td>
      <pre><code class="lang-python">${escape(contents1)}</code></pre>
      </td><td>
      <pre><code class="lang-python">${escape(contents2)}</code></pre>
      </td></tr></table><hr>`  
    }

    html += '</body></html>'
    await writeFile(`../../../${output_folder}/${lista}--${questao}--${pairs.length}-pairs.html`, html)
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
