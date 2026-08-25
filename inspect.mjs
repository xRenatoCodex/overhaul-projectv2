const readXlsxFile = require('read-excel-file/node');
readXlsxFile('Copia de REF-2026-00023 700002C000_740B_LBB.xlsx', { sheet: 'Resumen' })
  .then(rows => {
    console.log('total rows:', rows.length);
    rows.slice(23, 60).forEach((row, i) => {
      const rn = 24 + i;
      const a = row[0] != null ? String(row[0]) : '';
      const b = row[1] != null ? String(row[1]) : '';
      const m = row[12] != null ? String(row[12]) : '';
      const n = row[13] != null ? String(row[13]) : '';
      const o = row[14] != null ? String(row[14]) : '';
      if (a || b || m || n || o) {
        process.stdout.write('Row'+rn+'|A:'+a+'|B:'+b+'|M:'+m+'|N:'+n+'|O:'+o+'\n');
      }
    });
  })
  .catch(e => console.error(e));
