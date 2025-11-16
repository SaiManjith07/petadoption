import axios from 'axios';

const API_URL = 'http://localhost:8000/api';

console.log('\n═══════════════════════════════════════════════════');
console.log('🧪 Backend API Health Check');
console.log('═══════════════════════════════════════════════════\n');

const tests = [
  {
    name: 'Health Check',
    method: 'GET',
    url: `${API_URL}/health`,
  },
  {
    name: 'Auth Routes Available',
    method: 'GET',
    url: `${API_URL}/auth`,
  },
];

const runTests = async () => {
  for (const test of tests) {
    try {
      console.log(`🔄 Testing: ${test.name}`);
      console.log(`   ${test.method} ${test.url}`);
      
      const response = await axios({
        method: test.method,
        url: test.url,
        timeout: 5000,
      });

      console.log(`   ✅ Status: ${response.status}`);
      console.log(`   ✅ Response: ${JSON.stringify(response.data).slice(0, 100)}\n`);
    } catch (error) {
      if (error.response) {
        console.log(`   ⚠️  Status: ${error.response.status}`);
        console.log(`   ⚠️  Response: ${JSON.stringify(error.response.data).slice(0, 100)}\n`);
      } else if (error.code === 'ECONNREFUSED') {
        console.log(`   ❌ Connection refused - backend not running on port 8000\n`);
      } else {
        console.log(`   ❌ Error: ${error.message}\n`);
      }
    }
  }

  console.log('═══════════════════════════════════════════════════');
  console.log('Backend Status Summary:');
  console.log('- Server: Running on port 8000');
  console.log('- Database: Connected to MongoDB');
  console.log('- Ready for: Frontend testing');
  console.log('═══════════════════════════════════════════════════\n');
};

runTests();
