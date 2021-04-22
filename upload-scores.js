const { GoogleSpreadsheet } = require('google-spreadsheet');
const scores = require('./scores.json')

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
  for (let i = 1; i < sheet.rowCount; i++) {
    const rowName = simplifyString(sheet.getCell(i, 0).value)
    rowNameToIndex[rowName] = i
  }

  // iterate over students and update scores
  console.log('Modifying sheet cache...')
  Object.entries(scores).forEach(([aluno, contestScores]) => {
    console.log(aluno)
    const row = rowNameToIndex[simplifyString(aluno)]
    if (row) {
      Object.entries(contestScores).forEach(([contest, points]) => {
        const col = colNameToIndex[contest]
        if (col) {
          sheet.getCell(row, col).value = points
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