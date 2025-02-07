const bcrypt = require('bcrypt');

const ADMIN_EMAIL = 'admin@gmail.com';
const ADMIN_PASSWORD = bcrypt.hashSync('admin1234', 10);
// admin login validation
const validateAdminCredentials = (req, res, next) => {
  const { email, password } = req.headers;

  if (email === ADMIN_EMAIL && bcrypt.compareSync(password, ADMIN_PASSWORD)) {
    next();
  } else {
    res.status(401).json({ message: 'Invalid email or password' });
  }
};

module.exports = { validateAdminCredentials };
