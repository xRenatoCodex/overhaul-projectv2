const http = require('http');

const testData = {
  proyecto: "Test Actor Validation",
  cliente: "Minería Test S.A.",
  ubicacion: "Pasco",
  tallerDestino: "Taller Central",
  fechaEstimada: "2025-12-31",
  fechaTarifa: "2025-12-20",
  maquinas: [
    {
      model: "Excavadora 390F",
      serial: "EXC390F-2020"
    }
  ]
};

const body = JSON.stringify(testData);

const options = {
  hostname: 'localhost',
  port: 3000,
  path: '/api/overhaul/crear',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(body)
  }
};

const req = http.request(options, (res) => {
  console.log(`\n✓ Response Status: ${res.statusCode}`);
  
  let data = '';
  res.on('data', (chunk) => { data += chunk; });
  res.on('end', () => {
    try {
      const json = JSON.parse(data);
      console.log(`✓ Response ID: ${json.id || 'N/A'}`);
      if (res.statusCode === 201) {
        console.log('✅ SUCCESS: Unauthenticated creation works (201)');
      } else {
        console.log(`⚠️ Status: ${res.statusCode}`);
        console.log('Response:', json);
      }
    } catch (e) {
      console.log('Response:', data);
    }
  });
});

req.on('error', (e) => {
  console.error(`❌ Error: ${e.message}`);
});

console.log('Testing unauthenticated overhaul creation...');
console.log('Payload:', JSON.stringify(testData, null, 2));
req.write(body);
req.end();
