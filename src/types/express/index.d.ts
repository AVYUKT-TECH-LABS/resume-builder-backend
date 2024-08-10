declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        sessionId: string;
        issuedAt: number;
        expiresAt: number;
      };
    }
  }
}
