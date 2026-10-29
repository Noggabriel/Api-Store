require('dotenv').config();
if (!process.env.JWT_SECRET || process.env.JWT_SECRET.length < 32) throw new Error('JWT_SECRET deve estar definido e ter pelo menos 32 caracteres.');
const app = require('./app');
const sequelize = require('./config/database');
require('./models');
const port = Number(process.env.PORT || 3000);
async function start() {
  try {
    await sequelize.authenticate();
    await sequelize.sync();
    app.listen(port, () => console.log(`Moda Store API disponível em http://localhost:${port}`));
  } catch (error) {
    console.error('Não foi possível iniciar a API:', error.message);
    process.exit(1);
  }
}
start();
