import { Response } from 'express';
import { AuthRequest } from '../../middleware/authenticate';
import * as svc from './library.service';

function wrap(fn: (req: AuthRequest) => Promise<any>) {
  return async (req: AuthRequest, res: Response) => { try { res.json(await fn(req)); } catch (err: any) { res.status(500).json({ error: err.message }); } };
}
function wrapCreate(fn: (req: AuthRequest) => Promise<any>) {
  return async (req: AuthRequest, res: Response) => { try { res.status(201).json(await fn(req)); } catch (err: any) { res.status(500).json({ error: err.message }); } };
}
function wrapMutateById(getSchoolId: (id: string) => Promise<string | undefined>, fn: (req: AuthRequest) => Promise<any>) {
  return async (req: AuthRequest, res: Response) => {
    try {
      const sid = await getSchoolId(req.params.id);
      if (!sid || sid !== req.schoolId) return res.status(403).json({ error: 'Not authorized for this record' });
      res.json(await fn(req));
    } catch (err: any) { res.status(500).json({ error: err.message }); }
  };
}

export const getBooks = wrap(req => svc.listBooks(req.schoolId || ''));
export const postBook = wrapCreate(req => svc.createBook(req.schoolId || '', req.body));

export const getAuthors = wrap(req => svc.listAuthors(req.schoolId || ''));
export const postAuthor = wrapCreate(req => svc.createAuthor(req.schoolId || '', req.body));

export const getCopies = wrap(req => svc.listCopies(req.schoolId || '', req.query.bookId as string | undefined));
export const postCopy = wrapCreate(req => svc.createCopy(req.schoolId || '', req.body));

export const getBorrows = wrap(req => svc.listBorrows(req.schoolId || '', req.query.borrowerId as string | undefined));
export const postBorrow = wrapCreate(req => svc.createBorrow(req.schoolId || '', req.body));
export const patchReturnBorrow = wrapMutateById(svc.getBorrowSchoolId, req => svc.returnBorrow(req.params.id));

export const getFines = wrap(req => svc.listFines(req.schoolId || '', req.query.borrowId as string | undefined));
export const postFine = wrapCreate(req => svc.createFine(req.schoolId || '', req.body));
export const patchFineStatus = wrapMutateById(svc.getFineSchoolId, req => svc.updateFineStatus(req.params.id, req.body.status));

export const getSummary = wrap(req => svc.getLibrarySummary(req.schoolId || ''));
