'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { authedFetch } from '../../lib/api';
import AppShell from '../../components/AppShell';

const TABS = [
  { key: 'catalogue', label: 'Catalogue' },
  { key: 'borrowing', label: 'Borrowing & Returns' },
  { key: 'fines', label: 'Fines' },
];

export default function LibraryXPage() {
  const router = useRouter();
  const [token, setToken] = useState('');
  const [user, setUser] = useState<any>(null);
  const [school, setSchool] = useState<any>(null);
  const [tab, setTab] = useState('catalogue');
  const [error, setError] = useState('');
  const [students, setStudents] = useState<any[]>([]);
  const [staff, setStaff] = useState<any[]>([]);

  const [books, setBooks] = useState<any[]>([]);
  const [copies, setCopies] = useState<any[]>([]);
  const [borrows, setBorrows] = useState<any[]>([]);
  const [fines, setFines] = useState<any[]>([]);

  const [bookForm, setBookForm] = useState({ isbn: '', title: '', publisher: '', publicationYear: '', subjectArea: '' });
  const [copyForm, setCopyForm] = useState({ bookId: '', barcode: '' });
  const [borrowForm, setBorrowForm] = useState({ copyId: '', borrowerType: 'STUDENT', borrowerId: '', borrowDate: '', dueDate: '' });
  const [fineForm, setFineForm] = useState({ borrowId: '', amount: '' });

  const [summary, setSummary] = useState<any>(null);
  const [summaryLoading, setSummaryLoading] = useState(true);
  const [summaryError, setSummaryError] = useState('');

  useEffect(() => {
    const t = 'cookie';
    const userStr = sessionStorage.getItem('sukuu_user');
    if (!t) { router.push('/login'); return; }
    setToken(t); setUser(userStr ? JSON.parse(userStr) : null);
    loadAll(t);
  }, [router]);

  function loadAll(t: string) {
    authedFetch('/api/v1/school/profile', t).then(d => d && !d.error && setSchool(d));
    authedFetch('/api/v1/students', t).then(d => Array.isArray(d) ? setStudents(d) : setError(d?.error));
    authedFetch('/api/v1/staff', t).then(d => Array.isArray(d) && setStaff(d));
    authedFetch('/api/v1/library/books', t).then(d => Array.isArray(d) && setBooks(d));
    authedFetch('/api/v1/library/copies', t).then(d => Array.isArray(d) && setCopies(d));
    authedFetch('/api/v1/library/borrows', t).then(d => Array.isArray(d) && setBorrows(d));
    authedFetch('/api/v1/library/fines', t).then(d => Array.isArray(d) && setFines(d));
    setSummaryLoading(true);
    authedFetch('/api/v1/library/summary', t)
      .then(d => { if (d && !d.error) { setSummary(d); setSummaryError(''); } else setSummaryError(d?.error || 'Failed to load summary'); })
      .catch(() => setSummaryError('Failed to load summary')).finally(() => setSummaryLoading(false));
  }

  function personName(type: string, id: string) {
    if (type === 'STAFF') { const s = staff.find(x => x.id === id); return s ? `${s.first_name} ${s.last_name}` : id?.slice(0, 8); }
    const s = students.find(x => x.id === id); return s ? `${s.first_name} ${s.last_name}` : id?.slice(0, 8) || '—';
  }
  function bookTitle(bookId: string) { return books.find(b => b.id === bookId)?.title || bookId?.slice(0, 8) || '—'; }
  async function post(url: string, body: any, resetFn: () => void) { await authedFetch(url, token, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) }); resetFn(); loadAll(token); }
  async function patch(url: string, body: any = {}) { await authedFetch(url, token, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) }); loadAll(token); }

  if (error) return <AppShell user={user}><div style={{ padding: 40, color: 'var(--er)' }}>{error}</div></AppShell>;

  return (
    <AppShell user={user} schoolName={school?.name}>
      <div className="ph">
        <div className="ph-row">
          <div>
            <div className="ph-ey">SUKUU ERP · LIBRARYX · 5 TABLES · sukuux SCHEMA</div>
            <div className="ph-title">📚 LibraryX</div>
            <div className="ph-sub">Catalogue · Borrowing · Returns · Reservations · Fines</div>
          </div>
        </div>
      </div>

      {summaryError && <div style={{ padding: '0 var(--pad)', marginBottom: 'var(--gap)' }}><div className="alert al-er"><span className="al-ic">⚠️</span><div>Couldn't load the library overview: {summaryError}.</div></div></div>}

      {summaryLoading ? (
        <div className="fx-overview"><div className="stat-grid">{[1, 2, 3, 4].map(i => <div key={i} className="skel skel-card" />)}</div></div>
      ) : summary && (
        <div className="fx-overview">
          <div className="stat-grid">
            <button className="fx-card-btn" onClick={() => setTab('catalogue')}>
              <div className="sc" title="Active books, and total physical copies across all titles"><div className="sc-top"><div className="sc-icon" style={{ background: 'var(--inB)' }}>📚</div></div><div className="sc-val">{summary.totalBooks}</div><div className="sc-lbl">TITLES</div><div className="sc-foot">{summary.totalCopies} copies total</div></div>
            </button>
            <button className="fx-card-btn" onClick={() => setTab('borrowing')}>
              <div className="sc" title="Copies with status BORROWED"><div className="sc-top"><div className="sc-icon" style={{ background: 'var(--okB)' }}>📖</div></div><div className="sc-val">{summary.borrowedCopies}</div><div className="sc-lbl">CURRENTLY BORROWED</div></div>
            </button>
            <button className="fx-card-btn" onClick={() => setTab('borrowing')}>
              <div className="sc" title="Unreturned borrows past their due_date"><div className="sc-top"><div className="sc-icon" style={{ background: summary.overdue > 0 ? 'var(--erB)' : 'var(--okB)' }}>⏰</div></div><div className="sc-val">{summary.overdue}</div><div className="sc-lbl">OVERDUE</div></div>
            </button>
            <button className="fx-card-btn" onClick={() => setTab('fines')}>
              <div className="sc" title="Fines with status PENDING"><div className="sc-top"><div className="sc-icon" style={{ background: summary.pendingFines > 0 ? 'var(--erB)' : 'var(--okB)' }}>💰</div></div><div className="sc-val">{summary.pendingFines}</div><div className="sc-lbl">PENDING FINES</div></div>
            </button>
          </div>
        </div>
      )}

      <div className="sys-tabs">{TABS.map(t => <button key={t.key} className={`sys-tab-btn${tab === t.key ? ' act' : ''}`} onClick={() => setTab(t.key)}>{t.label}</button>)}</div>

      {tab === 'catalogue' && (
        <div style={{ padding: 'var(--pad)' }}>
          <form className="card" onSubmit={e => { e.preventDefault(); post('/api/v1/library/books', bookForm, () => setBookForm({ isbn: '', title: '', publisher: '', publicationYear: '', subjectArea: '' })); }} style={{ marginBottom: 16 }}>
            <div className="ch"><span className="ch-t">BOOKS</span></div>
            <div className="cb" style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              <input className="fi" placeholder="Title" value={bookForm.title} onChange={e => setBookForm({ ...bookForm, title: e.target.value })} required style={{ flex: 1, minWidth: 160 }} />
              <input className="fi" placeholder="ISBN" value={bookForm.isbn} onChange={e => setBookForm({ ...bookForm, isbn: e.target.value })} style={{ width: 140 }} />
              <input className="fi" placeholder="Subject area" value={bookForm.subjectArea} onChange={e => setBookForm({ ...bookForm, subjectArea: e.target.value })} style={{ width: 140 }} />
              <button type="submit" style={{ background: 'var(--navy)', color: 'var(--gold)', padding: '9px 16px', borderRadius: 'var(--rS)', fontSize: 12, fontWeight: 600 }}>Add Book</button>
            </div>
            {books.map(b => <div key={b.id} className="ri na"><div className="ri-b"><div className="ri-t">{b.title}</div><div className="ri-s">{b.subject_area || 'Uncategorized'} · {copies.filter(c => c.book_id === b.id).length} copies</div></div></div>)}
            {books.length === 0 && <div className="ri na"><div className="ri-s">No books yet.</div></div>}
          </form>
          <form className="card" onSubmit={e => { e.preventDefault(); post('/api/v1/library/copies', copyForm, () => setCopyForm({ bookId: '', barcode: '' })); }}>
            <div className="ch"><span className="ch-t">COPIES</span></div>
            <div className="cb" style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              <select className="fi" value={copyForm.bookId} onChange={e => setCopyForm({ ...copyForm, bookId: e.target.value })} required><option value="">Book...</option>{books.map(b => <option key={b.id} value={b.id}>{b.title}</option>)}</select>
              <input className="fi" placeholder="Barcode" value={copyForm.barcode} onChange={e => setCopyForm({ ...copyForm, barcode: e.target.value })} required style={{ width: 140 }} />
              <button type="submit" style={{ background: 'var(--navy)', color: 'var(--gold)', padding: '9px 16px', borderRadius: 'var(--rS)', fontSize: 12, fontWeight: 600 }}>Add Copy</button>
            </div>
            <div className="tbl">
              <table className="data-table">
                <thead><tr><th>Book</th><th>Barcode</th><th>Status</th></tr></thead>
                <tbody>
                  {copies.map(c => <tr key={c.id}><td>{bookTitle(c.book_id)}</td><td style={{ fontFamily: 'monospace', fontSize: 11 }}>{c.barcode}</td><td><span className={`bdg ${c.status === 'AVAILABLE' ? 'bok' : c.status === 'BORROWED' ? 'bin' : 'ber'}`}>{c.status}</span></td></tr>)}
                  {copies.length === 0 && <tr><td colSpan={3} style={{ textAlign: 'center', padding: 24, color: 'var(--muted)' }}>No copies yet.</td></tr>}
                </tbody>
              </table>
            </div>
          </form>
        </div>
      )}

      {tab === 'borrowing' && (
        <div style={{ padding: 'var(--pad)' }}>
          <form className="card" onSubmit={e => { e.preventDefault(); post('/api/v1/library/borrows', borrowForm, () => setBorrowForm({ copyId: '', borrowerType: 'STUDENT', borrowerId: '', borrowDate: '', dueDate: '' })); }}>
            <div className="ch"><span className="ch-t">BORROWING</span></div>
            <div className="cb" style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              <select className="fi" value={borrowForm.copyId} onChange={e => setBorrowForm({ ...borrowForm, copyId: e.target.value })} required><option value="">Copy...</option>{copies.filter(c => c.status === 'AVAILABLE').map(c => <option key={c.id} value={c.id}>{bookTitle(c.book_id)} - {c.barcode}</option>)}</select>
              <select className="fi" value={borrowForm.borrowerType} onChange={e => setBorrowForm({ ...borrowForm, borrowerType: e.target.value, borrowerId: '' })}><option value="STUDENT">Student</option><option value="STAFF">Staff</option></select>
              <select className="fi" value={borrowForm.borrowerId} onChange={e => setBorrowForm({ ...borrowForm, borrowerId: e.target.value })} required>
                <option value="">Borrower...</option>
                {(borrowForm.borrowerType === 'STAFF' ? staff : students).map(p => <option key={p.id} value={p.id}>{p.first_name} {p.last_name}</option>)}
              </select>
              <input className="fi" type="date" value={borrowForm.borrowDate} onChange={e => setBorrowForm({ ...borrowForm, borrowDate: e.target.value })} required />
              <input className="fi" type="date" value={borrowForm.dueDate} onChange={e => setBorrowForm({ ...borrowForm, dueDate: e.target.value })} required />
              <button type="submit" style={{ background: 'var(--navy)', color: 'var(--gold)', padding: '9px 16px', borderRadius: 'var(--rS)', fontSize: 12, fontWeight: 600 }}>Borrow</button>
            </div>
            <div className="tbl">
              <table className="data-table">
                <thead><tr><th>Book</th><th>Borrower</th><th>Due</th><th>Status</th><th></th></tr></thead>
                <tbody>
                  {borrows.map(b => (
                    <tr key={b.id}>
                      <td>{bookTitle(copies.find(c => c.id === b.copy_id)?.book_id || '')}</td><td>{personName(b.borrower_type, b.borrower_id)}</td><td style={{ fontSize: 11 }}>{b.due_date}</td>
                      <td><span className={`bdg ${b.returned_date ? 'bok' : new Date(b.due_date) < new Date() ? 'ber' : 'bin'}`}>{b.returned_date ? 'Returned' : new Date(b.due_date) < new Date() ? 'Overdue' : 'Borrowed'}</span></td>
                      <td>{!b.returned_date && <button onClick={() => patch(`/api/v1/library/borrows/${b.id}/return`)} style={{ fontSize: 11, padding: '4px 10px', borderRadius: 6, background: 'var(--soft)', color: 'var(--ink)', fontWeight: 600 }}>Return</button>}</td>
                    </tr>
                  ))}
                  {borrows.length === 0 && <tr><td colSpan={5} style={{ textAlign: 'center', padding: 24, color: 'var(--muted)' }}>No borrows yet.</td></tr>}
                </tbody>
              </table>
            </div>
          </form>
        </div>
      )}

      {tab === 'fines' && (
        <div style={{ padding: 'var(--pad)' }}>
          <form className="card" onSubmit={e => { e.preventDefault(); post('/api/v1/library/fines', fineForm, () => setFineForm({ borrowId: '', amount: '' })); }}>
            <div className="ch"><span className="ch-t">FINES</span></div>
            <div className="cb" style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              <select className="fi" value={fineForm.borrowId} onChange={e => setFineForm({ ...fineForm, borrowId: e.target.value })} required><option value="">Borrow record...</option>{borrows.map(b => <option key={b.id} value={b.id}>{personName(b.borrower_type, b.borrower_id)} - {bookTitle(copies.find(c => c.id === b.copy_id)?.book_id || '')}</option>)}</select>
              <input className="fi" type="number" placeholder="Amount" value={fineForm.amount} onChange={e => setFineForm({ ...fineForm, amount: e.target.value })} required style={{ width: 120 }} />
              <button type="submit" style={{ background: 'var(--erB)', color: 'var(--er)', padding: '9px 16px', borderRadius: 'var(--rS)', fontSize: 12, fontWeight: 600 }}>Issue Fine</button>
            </div>
            <div className="tbl">
              <table className="data-table">
                <thead><tr><th>Borrower</th><th>Amount</th><th>Status</th><th></th></tr></thead>
                <tbody>
                  {fines.map(f => {
                    const b = borrows.find(x => x.id === f.borrow_id);
                    return (
                      <tr key={f.id}>
                        <td>{b ? personName(b.borrower_type, b.borrower_id) : '—'}</td><td>GHS {f.amount}</td>
                        <td><span className={`bdg ${f.status === 'PAID' ? 'bok' : f.status === 'WAIVED' ? 'bin' : 'bwn'}`}>{f.status}</span></td>
                        <td>
                          {f.status === 'PENDING' && (
                            <>
                              <button onClick={() => patch(`/api/v1/library/fines/${f.id}/status`, { status: 'PAID' })} style={{ fontSize: 11, padding: '4px 10px', borderRadius: 6, background: 'var(--okB)', color: 'var(--ok)', fontWeight: 600, marginRight: 6 }}>Mark Paid</button>
                              <button onClick={() => patch(`/api/v1/library/fines/${f.id}/status`, { status: 'WAIVED' })} style={{ fontSize: 11, padding: '4px 10px', borderRadius: 6, background: 'var(--soft)', color: 'var(--ink)', fontWeight: 600 }}>Waive</button>
                            </>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                  {fines.length === 0 && <tr><td colSpan={4} style={{ textAlign: 'center', padding: 24, color: 'var(--muted)' }}>No fines issued.</td></tr>}
                </tbody>
              </table>
            </div>
          </form>
        </div>
      )}
    </AppShell>
  );
}
