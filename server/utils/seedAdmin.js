const bcrypt = require('bcryptjs');
const User = require('../models/User');

function env(name) {
  return String(process.env[name] || '').trim().replace(/^["']|["']$/g, '');
}

async function seedAdmin() {
  const username = env('ADMIN_USERNAME');
  const email = env('ADMIN_EMAIL');
  const password = env('ADMIN_PASSWORD');

  const existing = await User.findOne({ role: 'Admin' });
  if (existing) return;

  if (!username || !email || !password) {
    console.warn(
      'No Admin user exists. Set ADMIN_USERNAME, ADMIN_EMAIL, and ADMIN_PASSWORD to seed one.'
    );
    return;
  }

  const hashedPassword = await bcrypt.hash(password, 10);
  await User.create({ username, email, password: hashedPassword, role: 'Admin' });
  console.log(`Seeded Admin user "${username}"`);
}

module.exports = { seedAdmin };
