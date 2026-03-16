const fs = require('fs');
const path = require('path');

const dirPath = path.join('c:\\', 'CODING', 'CoreInventory', 'frontend', 'app', 'hooks');

try {
  fs.mkdirSync(dirPath, { recursive: true });
  console.log(`✓ Directory created successfully: ${dirPath}`);
} catch (error) {
  if (error.code === 'EEXIST') {
    console.log(`✓ Directory already exists: ${dirPath}`);
  } else {
    console.error(`✗ Error creating directory: ${error.message}`);
  }
}
