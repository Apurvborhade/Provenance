import type { Request, Response, NextFunction, RequestHandler } from 'express';

/** Wrap async route handlers so thrown errors reach the error middleware. */
export const asyncHandler =
  (fn: (req: Request, res: Response, next: NextFunction) => Promise<unknown>): RequestHandler =>
  (req, res, next) => {
    fn(req, res, next).catch(next);
  };

export const ok = (res: Response, data: unknown, status = 200) => res.status(status).json({ data });
export const fail = (res: Response, error: string, status = 400) => res.status(status).json({ error });
