const { initDatabase, closeDatabase } = require('./database');

const initializeApp = async () => {
  try {
    console.log('Initializing database...');
    await initDatabase();
    console.log('Database initialization complete!');
    process.exit(0);
  } catch (error) {
    console.error('Database initialization failed:', error);
    process.exit(1);
  }
};

initializeApp();
