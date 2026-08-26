'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { authedFetch } from '../../lib/api';
import AppShell from '../../components/AppShell';

const TABS = [
  { key: 'fleet', label: 'Vehicles & Drivers' },
  { key: 'routes', label: 'Routes & Stops' },
  { key: 'assignments', label: 'Student Assignments' },
  { key: 'trips', label: 'Trip Logs' },
];

export default function TransportXPage() {
  const router = useRouter();
  const [token, setToken] = useState('');
  const [user, setUser] = useState<any>(null);
  const [school, setSchool] = useState<any>(null);
  const [tab, setTab] = useState('fleet');
  const [error, setError] = useState('');
  const [students, setStudents] = useState<any[]>([]);
  const [staff, setStaff] = useState<any[]>([]);

  const [vehicles, setVehicles] = useState<any[]>([]);
  const [drivers, setDrivers] = useState<any[]>([]);
  const [routes, setRoutes] = useState<any[]>([]);
  const [stops, setStops] = useState<any[]>([]);
  const [assignments, setAssignments] = useState<any[]>([]);
  const [tripLogs, setTripLogs] = useState<any[]>([]);

  const [vehicleForm, setVehicleForm] = useState({ registrationNumber: '', capacity: '', vehicleType: 'BUS' });
  const [driverForm, setDriverForm] = useState({ staffId: '', licenseNumber: '', licenseExpiry: '' });
  const [routeForm, setRouteForm] = useState({ name: '', startPoint: '', endPoint: '' });
  const [stopForm, setStopForm] = useState({ routeId: '', stopName: '', pickupTime: '', stopOrder: '' });
  const [assignForm, setAssignForm] = useState({ studentId: '', routeId: '', vehicleId: '' });
  const [tripForm, setTripForm] = useState({ vehicleId: '', driverId: '', tripDate: '', departureTime: '', tripType: 'MORNING' });

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
    authedFetch('/api/v1/transport/vehicles', t).then(d => Array.isArray(d) && setVehicles(d));
    authedFetch('/api/v1/transport/drivers', t).then(d => Array.isArray(d) && setDrivers(d));
    authedFetch('/api/v1/transport/routes', t).then(d => Array.isArray(d) && setRoutes(d));
    authedFetch('/api/v1/transport/stops', t).then(d => Array.isArray(d) && setStops(d));
    authedFetch('/api/v1/transport/assignments', t).then(d => Array.isArray(d) && setAssignments(d));
    authedFetch('/api/v1/transport/trip-logs', t).then(d => Array.isArray(d) && setTripLogs(d));
    setSummaryLoading(true);
    authedFetch('/api/v1/transport/summary', t)
      .then(d => { if (d && !d.error) { setSummary(d); setSummaryError(''); } else setSummaryError(d?.error || 'Failed to load summary'); })
      .catch(() => setSummaryError('Failed to load summary')).finally(() => setSummaryLoading(false));
  }

  function staffName(id: string) { const s = staff.find(x => x.id === id); return s ? `${s.first_name} ${s.last_name}` : id?.slice(0, 8) || '—'; }
  function routeName(id: string) { return routes.find(r => r.id === id)?.name || id?.slice(0, 8) || '—'; }
  async function post(url: string, body: any, resetFn: () => void) { await authedFetch(url, token, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) }); resetFn(); loadAll(token); }
  async function patch(url: string, body: any = {}) { await authedFetch(url, token, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) }); loadAll(token); }

  if (error) return <AppShell user={user}><div style={{ padding: 40, color: 'var(--er)' }}>{error}</div></AppShell>;

  return (
    <AppShell user={user} schoolName={school?.name}>
      <div className="ph">
        <div className="ph-row">
          <div>
            <div className="ph-ey">SUKUU ERP · TRANSPORTX · 6 TABLES · sukuux SCHEMA</div>
            <div className="ph-title">🚌 TransportX</div>
            <div className="ph-sub">Vehicles · Routes · Stops · Assignments · Service Events</div>
          </div>
        </div>
      </div>

      {summaryError && <div style={{ padding: '0 var(--pad)', marginBottom: 'var(--gap)' }}><div className="alert al-er"><span className="al-ic">⚠️</span><div>Couldn't load the transport overview: {summaryError}.</div></div></div>}

      {summaryLoading ? (
        <div className="fx-overview"><div className="stat-grid">{[1, 2, 3, 4].map(i => <div key={i} className="skel skel-card" />)}</div></div>
      ) : summary && (
        <div className="fx-overview">
          <div className="stat-grid">
            <button className="fx-card-btn" onClick={() => setTab('fleet')}>
              <div className="sc" title="Vehicles with status ACTIVE"><div className="sc-top"><div className="sc-icon" style={{ background: 'var(--okB)' }}>🚌</div></div><div className="sc-val">{summary.activeVehicles}</div><div className="sc-lbl">ACTIVE VEHICLES</div></div>
            </button>
            <button className="fx-card-btn" onClick={() => setTab('fleet')}>
              <div className="sc" title="Vehicles with status MAINTENANCE"><div className="sc-top"><div className="sc-icon" style={{ background: summary.maintenanceVehicles > 0 ? 'var(--erB)' : 'var(--okB)' }}>🔧</div></div><div className="sc-val">{summary.maintenanceVehicles}</div><div className="sc-lbl">IN MAINTENANCE</div></div>
            </button>
            <button className="fx-card-btn" onClick={() => setTab('assignments')}>
              <div className="sc" title="Student route assignments with is_active true"><div className="sc-top"><div className="sc-icon" style={{ background: 'var(--inB)' }}>🎒</div></div><div className="sc-val">{summary.activeAssignments}</div><div className="sc-lbl">STUDENTS ON ROUTES</div></div>
            </button>
            <button className="fx-card-btn" onClick={() => setTab('trips')}>
              <div className="sc" title="Trip logs with trip_date today"><div className="sc-top"><div className="sc-icon" style={{ background: 'var(--puB)' }}>🗺️</div></div><div className="sc-val">{summary.tripsToday}</div><div className="sc-lbl">TRIPS TODAY</div></div>
            </button>
          </div>
        </div>
      )}

      <div className="sys-tabs">{TABS.map(t => <button key={t.key} className={`sys-tab-btn${tab === t.key ? ' act' : ''}`} onClick={() => setTab(t.key)}>{t.label}</button>)}</div>

      {tab === 'fleet' && (
        <div style={{ padding: 'var(--pad)' }}>
          <form className="card" onSubmit={e => { e.preventDefault(); post('/api/v1/transport/vehicles', vehicleForm, () => setVehicleForm({ registrationNumber: '', capacity: '', vehicleType: 'BUS' })); }} style={{ marginBottom: 16 }}>
            <div className="ch"><span className="ch-t">VEHICLES</span></div>
            <div className="cb" style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              <input className="fi" placeholder="Registration #" value={vehicleForm.registrationNumber} onChange={e => setVehicleForm({ ...vehicleForm, registrationNumber: e.target.value })} required style={{ width: 150 }} />
              <select className="fi" value={vehicleForm.vehicleType} onChange={e => setVehicleForm({ ...vehicleForm, vehicleType: e.target.value })}><option value="BUS">Bus</option><option value="MINIBUS">Minibus</option><option value="VAN">Van</option><option value="CAR">Car</option></select>
              <input className="fi" type="number" placeholder="Capacity" value={vehicleForm.capacity} onChange={e => setVehicleForm({ ...vehicleForm, capacity: e.target.value })} required style={{ width: 110 }} />
              <button type="submit" style={{ background: 'var(--navy)', color: 'var(--gold)', padding: '9px 16px', borderRadius: 'var(--rS)', fontSize: 12, fontWeight: 600 }}>Add Vehicle</button>
            </div>
            <div className="tbl">
              <table className="data-table">
                <thead><tr><th>Registration</th><th>Type</th><th>Capacity</th><th>Status</th><th></th></tr></thead>
                <tbody>
                  {vehicles.map(v => (
                    <tr key={v.id}>
                      <td>{v.registration_number}</td><td>{v.vehicle_type}</td><td>{v.capacity}</td>
                      <td><span className={`bdg ${v.status === 'ACTIVE' ? 'bok' : v.status === 'MAINTENANCE' ? 'bwn' : 'ber'}`}>{v.status}</span></td>
                      <td>
                        <select className="fi" style={{ fontSize: 11, padding: '4px 8px' }} value={v.status} onChange={e => patch(`/api/v1/transport/vehicles/${v.id}/status`, { status: e.target.value })}>
                          <option value="ACTIVE">Active</option><option value="MAINTENANCE">Maintenance</option><option value="RETIRED">Retired</option>
                        </select>
                      </td>
                    </tr>
                  ))}
                  {vehicles.length === 0 && <tr><td colSpan={5} style={{ textAlign: 'center', padding: 24, color: 'var(--muted)' }}>No vehicles yet.</td></tr>}
                </tbody>
              </table>
            </div>
          </form>
          <form className="card" onSubmit={e => { e.preventDefault(); post('/api/v1/transport/drivers', driverForm, () => setDriverForm({ staffId: '', licenseNumber: '', licenseExpiry: '' })); }}>
            <div className="ch"><span className="ch-t">DRIVERS</span></div>
            <div className="cb" style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              <select className="fi" value={driverForm.staffId} onChange={e => setDriverForm({ ...driverForm, staffId: e.target.value })} required><option value="">Staff...</option>{staff.map(s => <option key={s.id} value={s.id}>{s.first_name} {s.last_name}</option>)}</select>
              <input className="fi" placeholder="License #" value={driverForm.licenseNumber} onChange={e => setDriverForm({ ...driverForm, licenseNumber: e.target.value })} required style={{ width: 150 }} />
              <input className="fi" type="date" value={driverForm.licenseExpiry} onChange={e => setDriverForm({ ...driverForm, licenseExpiry: e.target.value })} required />
              <button type="submit" style={{ background: 'var(--navy)', color: 'var(--gold)', padding: '9px 16px', borderRadius: 'var(--rS)', fontSize: 12, fontWeight: 600 }}>Add Driver</button>
            </div>
            {drivers.map(d => <div key={d.id} className="ri na"><div className="ri-b"><div className="ri-t">{staffName(d.staff_id)}</div><div className="ri-s">Licence expires {d.license_expiry}</div></div></div>)}
            {drivers.length === 0 && <div className="ri na"><div className="ri-s">No drivers yet.</div></div>}
          </form>
        </div>
      )}

      {tab === 'routes' && (
        <div style={{ padding: 'var(--pad)' }}>
          <form className="card" onSubmit={e => { e.preventDefault(); post('/api/v1/transport/routes', routeForm, () => setRouteForm({ name: '', startPoint: '', endPoint: '' })); }} style={{ marginBottom: 16 }}>
            <div className="ch"><span className="ch-t">ROUTES</span></div>
            <div className="cb" style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              <input className="fi" placeholder="Route name" value={routeForm.name} onChange={e => setRouteForm({ ...routeForm, name: e.target.value })} required style={{ flex: 1, minWidth: 140 }} />
              <input className="fi" placeholder="Start point" value={routeForm.startPoint} onChange={e => setRouteForm({ ...routeForm, startPoint: e.target.value })} required style={{ flex: 1, minWidth: 140 }} />
              <input className="fi" placeholder="End point" value={routeForm.endPoint} onChange={e => setRouteForm({ ...routeForm, endPoint: e.target.value })} required style={{ flex: 1, minWidth: 140 }} />
              <button type="submit" style={{ background: 'var(--navy)', color: 'var(--gold)', padding: '9px 16px', borderRadius: 'var(--rS)', fontSize: 12, fontWeight: 600 }}>Add Route</button>
            </div>
            {routes.map(r => <div key={r.id} className="ri na"><div className="ri-b"><div className="ri-t">{r.name}</div><div className="ri-s">{r.start_point} → {r.end_point}</div></div></div>)}
            {routes.length === 0 && <div className="ri na"><div className="ri-s">No routes yet.</div></div>}
          </form>
          <form className="card" onSubmit={e => { e.preventDefault(); post('/api/v1/transport/stops', stopForm, () => setStopForm({ routeId: '', stopName: '', pickupTime: '', stopOrder: '' })); }}>
            <div className="ch"><span className="ch-t">STOPS</span></div>
            <div className="cb" style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              <select className="fi" value={stopForm.routeId} onChange={e => setStopForm({ ...stopForm, routeId: e.target.value })} required><option value="">Route...</option>{routes.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}</select>
              <input className="fi" placeholder="Stop name" value={stopForm.stopName} onChange={e => setStopForm({ ...stopForm, stopName: e.target.value })} required style={{ flex: 1, minWidth: 140 }} />
              <input className="fi" type="time" value={stopForm.pickupTime} onChange={e => setStopForm({ ...stopForm, pickupTime: e.target.value })} required />
              <input className="fi" type="number" placeholder="Order" value={stopForm.stopOrder} onChange={e => setStopForm({ ...stopForm, stopOrder: e.target.value })} style={{ width: 90 }} />
              <button type="submit" style={{ background: 'var(--navy)', color: 'var(--gold)', padding: '9px 16px', borderRadius: 'var(--rS)', fontSize: 12, fontWeight: 600 }}>Add Stop</button>
            </div>
            {stops.map(s => <div key={s.id} className="ri na"><div className="ri-b"><div className="ri-t">{s.stop_name}</div><div className="ri-s">{routeName(s.route_id)} · {s.pickup_time}</div></div></div>)}
            {stops.length === 0 && <div className="ri na"><div className="ri-s">No stops yet.</div></div>}
          </form>
        </div>
      )}

      {tab === 'assignments' && (
        <div style={{ padding: 'var(--pad)' }}>
          <form className="card" onSubmit={e => { e.preventDefault(); post('/api/v1/transport/assignments', assignForm, () => setAssignForm({ studentId: '', routeId: '', vehicleId: '' })); }}>
            <div className="ch"><span className="ch-t">STUDENT ASSIGNMENTS</span></div>
            <div className="cb" style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              <select className="fi" value={assignForm.studentId} onChange={e => setAssignForm({ ...assignForm, studentId: e.target.value })} required><option value="">Student...</option>{students.map(s => <option key={s.id} value={s.id}>{s.first_name} {s.last_name}</option>)}</select>
              <select className="fi" value={assignForm.routeId} onChange={e => setAssignForm({ ...assignForm, routeId: e.target.value })} required><option value="">Route...</option>{routes.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}</select>
              <select className="fi" value={assignForm.vehicleId} onChange={e => setAssignForm({ ...assignForm, vehicleId: e.target.value })}><option value="">Vehicle (optional)...</option>{vehicles.map(v => <option key={v.id} value={v.id}>{v.registration_number}</option>)}</select>
              <button type="submit" style={{ background: 'var(--navy)', color: 'var(--gold)', padding: '9px 16px', borderRadius: 'var(--rS)', fontSize: 12, fontWeight: 600 }}>Assign</button>
            </div>
            {assignments.filter(a => a.is_active).map(a => {
              const s = students.find(x => x.id === a.student_id);
              return <div key={a.id} className="ri na"><div className="ri-b"><div className="ri-t">{s ? `${s.first_name} ${s.last_name}` : a.student_id.slice(0, 8)}</div><div className="ri-s">{routeName(a.route_id)}</div></div><button onClick={() => patch(`/api/v1/transport/assignments/${a.id}/deactivate`)} style={{ fontSize: 11, padding: '4px 10px', borderRadius: 6, background: 'var(--erB)', color: 'var(--er)', fontWeight: 600 }}>Remove</button></div>;
            })}
            {assignments.filter(a => a.is_active).length === 0 && <div className="ri na"><div className="ri-s">No active assignments.</div></div>}
          </form>
        </div>
      )}

      {tab === 'trips' && (
        <div style={{ padding: 'var(--pad)' }}>
          <form className="card" onSubmit={e => { e.preventDefault(); post('/api/v1/transport/trip-logs', tripForm, () => setTripForm({ vehicleId: '', driverId: '', tripDate: '', departureTime: '', tripType: 'MORNING' })); }}>
            <div className="ch"><span className="ch-t">TRIP LOGS</span></div>
            <div className="cb" style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              <select className="fi" value={tripForm.vehicleId} onChange={e => setTripForm({ ...tripForm, vehicleId: e.target.value })} required><option value="">Vehicle...</option>{vehicles.map(v => <option key={v.id} value={v.id}>{v.registration_number}</option>)}</select>
              <select className="fi" value={tripForm.driverId} onChange={e => setTripForm({ ...tripForm, driverId: e.target.value })} required><option value="">Driver...</option>{drivers.map(d => <option key={d.id} value={d.id}>{staffName(d.staff_id)}</option>)}</select>
              <input className="fi" type="date" value={tripForm.tripDate} onChange={e => setTripForm({ ...tripForm, tripDate: e.target.value })} required />
              <input className="fi" type="datetime-local" value={tripForm.departureTime} onChange={e => setTripForm({ ...tripForm, departureTime: e.target.value })} required />
              <select className="fi" value={tripForm.tripType} onChange={e => setTripForm({ ...tripForm, tripType: e.target.value })}><option value="MORNING">Morning</option><option value="AFTERNOON">Afternoon</option><option value="FIELD_TRIP">Field Trip</option><option value="OTHER">Other</option></select>
              <button type="submit" style={{ background: 'var(--navy)', color: 'var(--gold)', padding: '9px 16px', borderRadius: 'var(--rS)', fontSize: 12, fontWeight: 600 }}>Log Trip</button>
            </div>
            <div className="tbl">
              <table className="data-table">
                <thead><tr><th>Vehicle</th><th>Driver</th><th>Type</th><th>Status</th><th></th></tr></thead>
                <tbody>
                  {tripLogs.map(t => (
                    <tr key={t.id}>
                      <td>{vehicles.find(v => v.id === t.vehicle_id)?.registration_number || '—'}</td><td>{staffName(drivers.find(d => d.id === t.driver_id)?.staff_id || '')}</td><td>{t.trip_type}</td>
                      <td><span className={`bdg ${t.arrival_time ? 'bok' : 'bin'}`}>{t.arrival_time ? 'Complete' : 'In Progress'}</span></td>
                      <td>{!t.arrival_time && <button onClick={() => patch(`/api/v1/transport/trip-logs/${t.id}/complete`)} style={{ fontSize: 11, padding: '4px 10px', borderRadius: 6, background: 'var(--soft)', color: 'var(--ink)', fontWeight: 600 }}>Mark Arrived</button>}</td>
                    </tr>
                  ))}
                  {tripLogs.length === 0 && <tr><td colSpan={5} style={{ textAlign: 'center', padding: 24, color: 'var(--muted)' }}>No trips logged yet.</td></tr>}
                </tbody>
              </table>
            </div>
          </form>
        </div>
      )}
    </AppShell>
  );
}
