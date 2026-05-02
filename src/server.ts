import app from './app';
import { env, validateEnv } from './config/env';
import { connectDB } from './database/connect';

validateEnv();

const server = app.listen(env.PORT, () => {
  console.log(`Server running on port ${env.PORT} in ${env.NODE_ENV} mode`);
});

server.on('error', (error: NodeJS.ErrnoException) => {
  if (error.code === 'EADDRINUSE') {
    console.error(`Port ${env.PORT} is already in use`);
  } else {
    console.error('Server failed to start:', error);
  }
  process.exit(1);
});

connectDB();
