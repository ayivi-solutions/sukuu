import { Router } from 'express';
import { authenticate } from '../../middleware/authenticate';
import { requireModuleAccess } from '../../middleware/requireModuleAccess';
import * as ctrl from './library.controller';

export const libraryRouter = Router();
const R = requireModuleAccess('library', 'read');
const F = requireModuleAccess('library', 'full');

libraryRouter.get('/books', authenticate, R, ctrl.getBooks);
libraryRouter.post('/books', authenticate, F, ctrl.postBook);

libraryRouter.get('/authors', authenticate, R, ctrl.getAuthors);
libraryRouter.post('/authors', authenticate, F, ctrl.postAuthor);

libraryRouter.get('/copies', authenticate, R, ctrl.getCopies);
libraryRouter.post('/copies', authenticate, F, ctrl.postCopy);

libraryRouter.get('/borrows', authenticate, R, ctrl.getBorrows);
libraryRouter.post('/borrows', authenticate, F, ctrl.postBorrow);
libraryRouter.patch('/borrows/:id/return', authenticate, F, ctrl.patchReturnBorrow);

libraryRouter.get('/fines', authenticate, R, ctrl.getFines);
libraryRouter.post('/fines', authenticate, F, ctrl.postFine);
libraryRouter.patch('/fines/:id/status', authenticate, F, ctrl.patchFineStatus);

libraryRouter.get('/summary', authenticate, R, ctrl.getSummary);
