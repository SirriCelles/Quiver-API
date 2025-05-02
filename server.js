import app from './app.js';

import { PORT } from './config/env.js';
import connectToDB from './database/mongodb.js';

const server = app.listen(PORT, async () => {
  console.log(`Server running on http://localhost:${PORT}`);
  console.log(`Swagger UI available at http://localhost:${PORT}/api-docs`);

  await connectToDB();
});
