import { clerkClient } from '@clerk/clerk-sdk-node';

async function deductCredits(userId: string, amt: number) {
  try {
    const user = await clerkClient.users.getUser(userId);
    let currentCredits = user.publicMetadata.credits;

    if (typeof currentCredits !== 'number') {
      currentCredits = 0;
    }

    if (Number(currentCredits) < amt) {
      throw new Error('Insufficient credits');
    }

    const newCredits = Number(currentCredits) - amt;

    await clerkClient.users.updateUser(userId, {
      publicMetadata: { ...user.publicMetadata, credits: newCredits },
    });

    return newCredits;
  } catch (err) {
    throw err;
  }
}

async function hasCredits(userId: string, min: number) {
  try {
    const user = await clerkClient.users.getUser(userId);
    const credits = user.publicMetadata.credits;
    if (credits && Number(credits) >= min) return true;
    return false;
  } catch (err) {
    throw err;
  }
}

export { hasCredits, deductCredits };
