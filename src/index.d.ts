/* eslint-disable @typescript-eslint/no-unused-vars */
import { Employer, User as Candidate } from '@prisma/client';
import express from 'express';

declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        sub: string;
        email: string;
        usertype: 'employer' | 'candidate';
      };

      candidate: Candidate | null;
      employer: Employer | null;
    }
  }
}
