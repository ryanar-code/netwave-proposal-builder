const fs = require('fs');
const path = require('path');
const FormData = require('form-data');
const fetch = require('node-fetch');

async function testAPI() {
  console.log('🧪 Testing Netwave Proposal Accelerator API\n');

  // Create form data
  const formData = new FormData();
  formData.append('clientName', 'GreenLeaf Organics');
  formData.append('projectType', 'Website');
  formData.append('deadline', '2026-06-01');
  formData.append('documentType', 'statementOfWork');

  // Add test documents
  const testDocsPath = path.join(__dirname, 'test-documents');
  const files = [
    'client-brief.txt',
    'rate-card.txt',
    'previous-sow.md',
    'kickoff-call-transcript.txt'
  ];

  files.forEach(filename => {
    const filepath = path.join(testDocsPath, filename);
    if (fs.existsSync(filepath)) {
      const fileBuffer = fs.readFileSync(filepath);
      formData.append('files', fileBuffer, filename);
      console.log(`✅ Added: ${filename}`);
    }
  });

  console.log('\n📤 Sending request to API...\n');

  try {
    const response = await fetch('http://localhost:3000/api/generate', {
      method: 'POST',
      body: formData,
      headers: formData.getHeaders()
    });

    const data = await response.json();

    if (data.success) {
      console.log('✅ API Response: SUCCESS\n');
      console.log('📄 Generated Statement of Work:');
      console.log('─'.repeat(80));
      console.log(data.content);
      console.log('─'.repeat(80));
      console.log(`\n📊 Output length: ${data.content.length} characters`);
      console.log(`💰 Estimated cost: ~$0.05\n`);

      // Check if output is formatted correctly (not JSON)
      if (data.content.startsWith('{') || data.content.startsWith('```')) {
        console.log('⚠️  WARNING: Output appears to be wrapped in JSON or markdown!');
      } else {
        console.log('✅ Output format looks good - plain text as expected');
      }
    } else {
      console.log('❌ API Response: FAILED');
      console.log(`Error: ${data.error}`);
    }
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

testAPI();
