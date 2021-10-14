#!/usr/bin/env node

const { GoogleSpreadsheet } = require('google-spreadsheet');
const scores = require('./scores.json')

const ROW_OF_FIRST_STUDENT = 2
const COLUMN_OF_STUDENT_MATRICULA = 0  // 0-based

/*
Required environment variables:
  - GOOGLE_SERVICE_ACCOUNT_EMAIL
  - GOOGLE_PRIVATE_KEY
  - SPREADSHEET_ID
*/

colNameToIndex = {};
rowNameToIndex = {};

function simplifyString(str) {
  if (!str) {
    return str;
  } else {
    str = str.normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    return str.replace(/[^A-Za-z_0-9]| /g, '_').toUpperCase()
  }
}

function convertMatriculaToHandle(matricula) {
  return 'a' + matricula
}

async function run() {
  const doc = new GoogleSpreadsheet(process.env.SPREADSHEET_ID);
  
  console.log('Authenticating...')
  await doc.useServiceAccountAuth({
    client_email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
    private_key: process.env.GOOGLE_PRIVATE_KEY,
  });
  
  await doc.loadInfo();

  // map col names to indices
  console.log('Reading header...')
  const sheet = doc.sheetsByIndex[0]
  await sheet.loadHeaderRow()
  sheet.headerValues.forEach((name, index) => {
    colNameToIndex[name] = index
  });

  // map row names to indices
  console.log('Reading row names...')
  await sheet.loadCells()
  for (let i = ROW_OF_FIRST_STUDENT; i < sheet.rowCount; i++) {
    const cellValue = sheet.getCell(i, COLUMN_OF_STUDENT_MATRICULA).value
    console.log(i, cellValue)
    if (cellValue !== null) {
      const rowName = '' + cellValue
      const handle = convertMatriculaToHandle(rowName)
      rowNameToIndex[handle] = i
    }
  }
  // console.log(rowNameToIndex)

  // iterate over students and update scores
  console.log('Modifying sheet cache...')
  Object.entries(scores).forEach(([aluno, contestScores]) => {
    console.log(aluno)
    const row = rowNameToIndex[aluno]
    if (row) {
      Object.entries(contestScores).forEach(([contest, points]) => {
        const col = colNameToIndex[contest]
        if (col) {
          const cell = sheet.getCell(row, col)
          // Update the cell only if it was not marked as plagiarism (P)
          if (cell.value != 'P') {
            cell.value = points
          }
        }
      })
    } else {
      console.log(`!!! Student not found: ${aluno}`)
    }
  })

  console.log('Saving updated cells...')
  await sheet.saveUpdatedCells()
  console.log('Done.')
}

run().catch(console.dir);