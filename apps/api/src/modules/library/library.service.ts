import { prisma } from '../../lib/prisma';

export async function listBooks(schoolId: string) { return prisma.libraryBook.findMany({ where: { school_id: schoolId } }); }
export async function createBook(schoolId: string, data: any) {
  return prisma.libraryBook.create({ data: { school_id: schoolId, isbn: data.isbn, title: data.title, publisher: data.publisher, publication_year: data.publicationYear ? Number(data.publicationYear) : null, subject_area: data.subjectArea, is_active: true } });
}
export async function getBookSchoolId(id: string) { return (await prisma.libraryBook.findUnique({ where: { id } }))?.school_id; }

export async function listAuthors(schoolId: string) { return prisma.libraryAuthor.findMany({ where: { OR: [{ school_id: schoolId }, { school_id: null }] } }); }
export async function createAuthor(schoolId: string, data: any) {
  return prisma.libraryAuthor.create({ data: { school_id: schoolId, name: data.name, bio: data.bio } });
}

export async function listCopies(schoolId: string, bookId?: string) { return prisma.libraryBookCopy.findMany({ where: { school_id: schoolId, ...(bookId && { book_id: bookId }) } }); }
export async function createCopy(schoolId: string, data: any) {
  return prisma.libraryBookCopy.create({ data: { school_id: schoolId, book_id: data.bookId, barcode: data.barcode, status: 'AVAILABLE' } });
}
export async function getCopySchoolId(id: string) { return (await prisma.libraryBookCopy.findUnique({ where: { id } }))?.school_id; }

export async function listBorrows(schoolId: string, borrowerId?: string) { return prisma.libraryBorrow.findMany({ where: { school_id: schoolId, ...(borrowerId && { borrower_id: borrowerId }) } }); }
export async function createBorrow(schoolId: string, data: any) {
  await prisma.libraryBookCopy.update({ where: { id: data.copyId }, data: { status: 'BORROWED' } });
  return prisma.libraryBorrow.create({ data: { school_id: schoolId, copy_id: data.copyId, borrower_type: data.borrowerType, borrower_id: data.borrowerId, borrow_date: data.borrowDate, due_date: data.dueDate } });
}
export async function returnBorrow(id: string) {
  const b = await prisma.libraryBorrow.update({ where: { id }, data: { returned_date: new Date().toISOString().slice(0, 10) } });
  await prisma.libraryBookCopy.update({ where: { id: b.copy_id }, data: { status: 'AVAILABLE' } });
  return b;
}
export async function getBorrowSchoolId(id: string) { return (await prisma.libraryBorrow.findUnique({ where: { id } }))?.school_id; }

export async function listFines(schoolId: string, borrowId?: string) { return prisma.libraryFine.findMany({ where: { school_id: schoolId, ...(borrowId && { borrow_id: borrowId }) } }); }
export async function createFine(schoolId: string, data: any) {
  return prisma.libraryFine.create({ data: { school_id: schoolId, borrow_id: data.borrowId, amount: data.amount, status: 'PENDING' } });
}
export async function updateFineStatus(id: string, status: string) { return prisma.libraryFine.update({ where: { id }, data: { status: status as any } }); }
export async function getFineSchoolId(id: string) { return (await prisma.libraryFine.findUnique({ where: { id } }))?.school_id; }

export async function getLibrarySummary(schoolId: string) {
  const [totalBooks, totalCopies, borrowedCopies, overdue, pendingFines] = await Promise.all([
    prisma.libraryBook.count({ where: { school_id: schoolId, is_active: true } }),
    prisma.libraryBookCopy.count({ where: { school_id: schoolId } }),
    prisma.libraryBookCopy.count({ where: { school_id: schoolId, status: 'BORROWED' } }),
    prisma.libraryBorrow.count({ where: { school_id: schoolId, returned_date: null, due_date: { lt: new Date().toISOString().slice(0, 10) } } }),
    prisma.libraryFine.count({ where: { school_id: schoolId, status: 'PENDING' } }),
  ]);
  return { totalBooks, totalCopies, borrowedCopies, overdue, pendingFines };
}
