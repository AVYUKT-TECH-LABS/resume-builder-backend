/* eslint-disable @typescript-eslint/no-unused-vars */
import { Employer } from '@prisma/client';
import express from 'express';

declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        sub: string;
        email: string;
        usertype: 'employer' | 'user';
      };

      employer: Employer | null;
    }
  }
}
