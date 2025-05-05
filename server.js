import app from './app.js';

import { NODE_ENV, PORT } from './config/env.js';
import connectToDB from './database/mongodb.js';

// handlling uncaught exceptions
process.on('uncaughtException', (err) => {
  console.log(err.name, err.message);
  console.log('UNCAUGHT EXECEPTION! Shutting down....');

  process.exit(1);
});

const server = app.listen(PORT, async () => {
  if (NODE_ENV === 'development') {
    console.log(`Server running on http://localhost:${PORT}`);
    console.log(`Swagger UI available at http://localhost:${PORT}/api-docs`);
  }

  await connectToDB();
});

// Unhandled rejection will be handled here. basically unressolved promises
process.on('unhandledRejection', (err) => {
  console.log(err.name, err.message);
  console.log('UNCAUGHT REJECTION! Shutting down....');

  server.close(() => {
    // 1, stands for uncaught exception
    process.exit(1);
  });
});
