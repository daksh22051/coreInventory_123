const fs = require('fs');
const path = require('path');

const BASE = path.join(__dirname, 'frontend');

const dirs = [
  'app',
  'app/(landing)',
  'app/dashboard',
  'app/dashboard/products',
  'app/dashboard/receipts',
  'app/dashboard/deliveries',
  'app/dashboard/transfers',
  'app/dashboard/adjustments',
  'app/dashboard/warehouses',
  'app/dashboard/analytics',
  'app/dashboard/settings',
  'app/dashboard/profile',
  'app/login',
  'app/signup',
  'components/landing',
  'components/dashboard',
  'components/ui',
  'components/3d',
  'hooks',
  'lib',
  'store',
  'styles',
  'public',
];

dirs.forEach(d => {
  fs.mkdirSync(path.join(BASE, d), { recursive: true });
});

console.log('Frontend directories created!');
