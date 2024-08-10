import { registerAs } from '@nestjs/config';
import { createClerkClient } from '@clerk/clerk-sdk-node';

export default registerAs('clerk', () => {
  const publishableKey = process.env.CLERK_PUBLISHABLE_KEY;
  const secretKey = process.env.CLERK_SECRET_KEY;

  if (!publishableKey || !secretKey) {
    throw new Error('Clerk environment variables are not set');
  }

  return createClerkClient({
    publishableKey,
    secretKey,
  });
});
