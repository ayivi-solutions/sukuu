import type { Prisma } from '@prisma/client';
import { withTenantContext } from '../../lib/tenantContext';

export class SchoolXCanonicalValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'SchoolXCanonicalValidationError';
  }
}

export class SchoolXCanonicalConflictError extends Error {
  constructor(message = 'The authoritative record changed concurrently. Reload and retry.') {
    super(message);
    this.name = 'SchoolXCanonicalConflictError';
  }
}

type Tx = Prisma.TransactionClient;

const READINESS = [
  { key: 'institution-profile', label: 'Institution profile complete', sourceDomain: 'SCHOOLX', activationRequired: true },
  { key: 'primary-campus', label: 'Exactly one active primary campus', sourceDomain: 'SCHOOLX', activationRequired: true },
  { key: 'tenant-superadmin', label: 'Operational Tenant Superadmin with MFA', sourceDomain: 'SYSTEMX', activationRequired: true },
  { key: 'timezone', label: 'Institution timezone configured', sourceDomain: 'SCHOOLX', activationRequired: true },
  { key: 'currency', label: 'Institution currency configured', sourceDomain: 'SCHOOLX', activationRequired: true },
  { key: 'academic-year', label: 'Exactly one current academic year', sourceDomain: 'ACADEMICX', activationRequired: false },
  { key: 'active-term', label: 'At least one active term in the current academic year', sourceDomain: 'ACADEMICX', activationRequired: false },
] as const;

const CONFIGURATION_REGISTRY = {
  timezone: {
    schemaVersion: 1,
    authority: 'SchoolX',
    fields: {
      timezone: 'IANA timezone identifier',
      dateFormat: ['YYYY-MM-DD', 'DD/MM/YYYY', 'MM/DD/YYYY'],
      timeFormat: ['TIME_12H', 'TIME_24H'],
    },
  },
  currency: {
    schemaVersion: 1,
    authority: 'SchoolX',
    fields: {
      currencyCode: 'three-letter uppercase code',
      currencySymbol: '1-8 characters',
      decimalPlaces: 'integer 0-4',
      locale: 'language or language-region',
    },
  },
} as const;

function clean(value: unknown): string {
  return String(value ?? '').trim();
}

function reason(value: unknown): string {
  const result = clean(value);
  if (result.length < 5) {
    throw new SchoolXCanonicalValidationError('A change reason of at least 5 characters is required.');
  }
  return result;
}

function version(value: unknown): number {
  const result = Number(value);
  if (!Number.isInteger(result) || result < 0) {
    throw new SchoolXCanonicalValidationError('A non-negative expectedVersion is required.');
  }
  return result;
}

async function rows<T>(tx: Tx, sql: string, ...params: any[]): Promise<T[]> {
  return tx.$queryRawUnsafe<T[]>(sql, ...params);
}

async function audit(
  tx: Tx,
  schoolId: string,
  actorId: string,
  action: string
) {
  await tx.$executeRawUnsafe(
    `INSERT INTO sukuux.school_audit_log
       (id,school_id,action,performed_by,created_at)
     VALUES (gen_random_uuid()::text,$1,$2,$3,CURRENT_TIMESTAMP)`,
    schoolId,
    action,
    actorId
  );
}

async function sameSchoolActiveStaff(tx: Tx, schoolId: string, staffId: string | null) {
  if (!staffId) return null;
  const found = await rows<{ id: string }>(
    tx,
    `SELECT id
       FROM sukuux.staff_staff
      WHERE id=$1
        AND school_id=$2
        AND employment_status='ACTIVE'::sukuux."StaffEmploymentStatus"
      LIMIT 1`,
    staffId,
    schoolId
  );
  if (!found[0]) {
    throw new SchoolXCanonicalValidationError('Department head must be active staff in the same school.');
  }
  return found[0].id;
}

export async function departmentWorkspace(schoolId: string, search = '') {
  return withTenantContext(undefined, async tx => {
    const q = clean(search);
    const departments = await rows<any>(
      tx,
      `SELECT id,school_id,name,code,head_id,is_active,row_version,changed_reason,
              created_at,updated_at,archived_at
         FROM sukuux.school_department
        WHERE school_id=$1
          AND archived_at IS NULL
          AND ($2='' OR name ILIKE '%'||$2||'%' OR code ILIKE '%'||$2||'%')
        ORDER BY name`,
      schoolId,
      q
    );
    const eligibleHeads = await rows<any>(
      tx,
      `SELECT id,staff_id,first_name,last_name,email
         FROM sukuux.staff_staff
        WHERE school_id=$1
          AND employment_status='ACTIVE'::sukuux."StaffEmploymentStatus"
        ORDER BY first_name,last_name`,
      schoolId
    );
    return { departments, eligibleHeads };
  });
}

export async function createDepartment(schoolId: string, actorId: string, input: any) {
  const name = clean(input.name);
  const code = clean(input.code).toUpperCase();
  const changeReason = reason(input.reason);
  if (name.length < 2 || code.length < 2 || code.length > 32) {
    throw new SchoolXCanonicalValidationError('Department name and a 2-32 character code are required.');
  }

  return withTenantContext(undefined, async tx => {
    const headId = await sameSchoolActiveStaff(tx, schoolId, clean(input.headId) || null);
    const duplicate = await rows<{ id: string }>(
      tx,
      `SELECT id FROM sukuux.school_department
        WHERE school_id=$1 AND archived_at IS NULL
          AND (lower(code)=lower($2) OR lower(name)=lower($3))
        LIMIT 1`,
      schoolId,
      code,
      name
    );
    if (duplicate[0]) {
      throw new SchoolXCanonicalValidationError('An active department with the same name or code already exists.');
    }
    const created = await rows<any>(
      tx,
      `INSERT INTO sukuux.school_department
         (id,school_id,name,code,head_id,is_active,row_version,changed_reason,
          created_at,updated_at,archived_at)
       VALUES
         (gen_random_uuid()::text,$1,$2,$3,$4,true,1,$5,
          CURRENT_TIMESTAMP,CURRENT_TIMESTAMP,NULL)
       RETURNING *`,
      schoolId,
      name,
      code,
      headId,
      changeReason
    );
    await audit(tx, schoolId, actorId, `CREATE department ${code}: ${changeReason}`);
    return created[0];
  });
}

export async function updateDepartment(schoolId: string, actorId: string, id: string, input: any) {
  const expected = version(input.expectedVersion);
  const changeReason = reason(input.reason);

  return withTenantContext(undefined, async tx => {
    const current = await rows<any>(
      tx,
      `SELECT * FROM sukuux.school_department
        WHERE id=$1 AND school_id=$2 AND archived_at IS NULL LIMIT 1`,
      id,
      schoolId
    );
    if (!current[0]) return null;
    if (Number(current[0].row_version) !== expected) throw new SchoolXCanonicalConflictError();

    const name = input.name === undefined ? current[0].name : clean(input.name);
    const code = input.code === undefined ? current[0].code : clean(input.code).toUpperCase();
    const headId = input.headId === undefined
      ? current[0].head_id
      : await sameSchoolActiveStaff(tx, schoolId, clean(input.headId) || null);

    if (name.length < 2 || code.length < 2 || code.length > 32) {
      throw new SchoolXCanonicalValidationError('Department name and a 2-32 character code are required.');
    }

    const updated = await rows<any>(
      tx,
      `UPDATE sukuux.school_department
          SET name=$3,
              code=$4,
              head_id=$5,
              is_active=COALESCE($6,is_active),
              row_version=row_version+1,
              changed_reason=$7,
              updated_at=CURRENT_TIMESTAMP
        WHERE id=$1 AND school_id=$2 AND archived_at IS NULL AND row_version=$8
        RETURNING *`,
      id,
      schoolId,
      name,
      code,
      headId,
      input.isActive === undefined ? null : !!input.isActive,
      changeReason,
      expected
    );
    if (!updated[0]) throw new SchoolXCanonicalConflictError();
    await audit(tx, schoolId, actorId, `CORRECT department ${id}: ${changeReason}`);
    return updated[0];
  });
}

export async function archiveDepartment(schoolId: string, actorId: string, id: string, input: any) {
  const expected = version(input.expectedVersion);
  const changeReason = reason(input.reason);

  return withTenantContext(undefined, async tx => {
    const archived = await rows<any>(
      tx,
      `UPDATE sukuux.school_department
          SET is_active=false,
              archived_at=CURRENT_TIMESTAMP,
              row_version=row_version+1,
              changed_reason=$4,
              updated_at=CURRENT_TIMESTAMP
        WHERE id=$1 AND school_id=$2 AND archived_at IS NULL AND row_version=$3
        RETURNING *`,
      id,
      schoolId,
      expected,
      changeReason
    );
    if (!archived[0]) {
      const exists = await rows<{ id: string }>(
        tx,
        `SELECT id FROM sukuux.school_department
          WHERE id=$1 AND school_id=$2 AND archived_at IS NULL`,
        id,
        schoolId
      );
      if (exists[0]) throw new SchoolXCanonicalConflictError();
      return null;
    }
    await audit(tx, schoolId, actorId, `ARCHIVE department ${id}: ${changeReason}`);
    return archived[0];
  });
}

export async function getConfiguration(schoolId: string) {
  return withTenantContext(undefined, async tx => {
    const timezone = await rows<any>(
      tx,
      `SELECT * FROM sukuux.school_timezone
        WHERE school_id=$1 AND archived_at IS NULL LIMIT 1`,
      schoolId
    );
    const currency = await rows<any>(
      tx,
      `SELECT * FROM sukuux.school_currency
        WHERE school_id=$1 AND archived_at IS NULL LIMIT 1`,
      schoolId
    );
    return {
      registry: CONFIGURATION_REGISTRY,
      timezone: timezone[0] ?? null,
      currency: currency[0] ?? null,
      legacyFlexibleStores: {
        writable: false,
        reason: 'SchoolSettings and SchoolConfiguration are retained for compatibility but are not canonical typed write targets.',
      },
    };
  });
}

function validTimezone(input: any) {
  const timezone = clean(input.timezone);
  const dateFormat = clean(input.dateFormat);
  const timeFormat = clean(input.timeFormat);
  if (!/^(?:UTC|[A-Za-z_]+\/[A-Za-z0-9_+\-]+(?:\/[A-Za-z0-9_+\-]+)?)$/.test(timezone)) {
    throw new SchoolXCanonicalValidationError('Timezone must be an IANA-style identifier such as Africa/Accra.');
  }
  if (!['YYYY-MM-DD', 'DD/MM/YYYY', 'MM/DD/YYYY'].includes(dateFormat)) {
    throw new SchoolXCanonicalValidationError('Unsupported date format.');
  }
  if (!['TIME_12H', 'TIME_24H'].includes(timeFormat)) {
    throw new SchoolXCanonicalValidationError('Unsupported time format.');
  }
  return { timezone, dateFormat, timeFormat };
}

export async function putTimezone(schoolId: string, actorId: string, input: any) {
  const expected = version(input.expectedVersion);
  const changeReason = reason(input.reason);
  const v = validTimezone(input);

  return withTenantContext(undefined, async tx => {
    const current = await rows<any>(
      tx,
      `SELECT * FROM sukuux.school_timezone
        WHERE school_id=$1 AND archived_at IS NULL LIMIT 1`,
      schoolId
    );
    if (!current[0]) {
      if (expected !== 0) throw new SchoolXCanonicalConflictError();
      const created = await rows<any>(
        tx,
        `INSERT INTO sukuux.school_timezone
           (id,school_id,timezone,date_format,time_format,row_version,updated_by,
            effective_from,effective_to,changed_reason,created_at,updated_at,archived_at)
         VALUES
           (gen_random_uuid()::text,$1,$2,$3,$4::sukuux."TimezoneTimeFormat",1,$5,
            CURRENT_TIMESTAMP,NULL,$6,CURRENT_TIMESTAMP,CURRENT_TIMESTAMP,NULL)
         RETURNING *`,
        schoolId,
        v.timezone,
        v.dateFormat,
        v.timeFormat,
        actorId,
        changeReason
      );
      await audit(tx, schoolId, actorId, `CONFIGURE timezone: ${changeReason}`);
      return created[0];
    }
    if (Number(current[0].row_version) !== expected) throw new SchoolXCanonicalConflictError();

    const updated = await rows<any>(
      tx,
      `UPDATE sukuux.school_timezone
          SET timezone=$2,
              date_format=$3,
              time_format=$4::sukuux."TimezoneTimeFormat",
              row_version=row_version+1,
              updated_by=$5,
              effective_from=CURRENT_TIMESTAMP,
              changed_reason=$6,
              updated_at=CURRENT_TIMESTAMP
        WHERE school_id=$1 AND archived_at IS NULL AND row_version=$7
        RETURNING *`,
      schoolId,
      v.timezone,
      v.dateFormat,
      v.timeFormat,
      actorId,
      changeReason,
      expected
    );
    if (!updated[0]) throw new SchoolXCanonicalConflictError();
    await audit(tx, schoolId, actorId, `CORRECT timezone: ${changeReason}`);
    return updated[0];
  });
}

function validCurrency(input: any) {
  const currencyCode = clean(input.currencyCode).toUpperCase();
  const currencySymbol = clean(input.currencySymbol);
  const decimalPlaces = Number(input.decimalPlaces);
  const locale = clean(input.locale);
  if (!/^[A-Z]{3}$/.test(currencyCode)) throw new SchoolXCanonicalValidationError('Currency code must be three uppercase letters.');
  if (!currencySymbol || currencySymbol.length > 8) throw new SchoolXCanonicalValidationError('Currency symbol is required and must not exceed 8 characters.');
  if (!Number.isInteger(decimalPlaces) || decimalPlaces < 0 || decimalPlaces > 4) throw new SchoolXCanonicalValidationError('Decimal places must be an integer from 0 to 4.');
  if (!/^[a-z]{2,3}(?:-[A-Z]{2})?$/.test(locale)) throw new SchoolXCanonicalValidationError('Locale must be a language or language-region value such as en-GH.');
  return { currencyCode, currencySymbol, decimalPlaces, locale };
}

export async function putCurrency(schoolId: string, actorId: string, input: any) {
  const expected = version(input.expectedVersion);
  const changeReason = reason(input.reason);
  const v = validCurrency(input);

  return withTenantContext(undefined, async tx => {
    const current = await rows<any>(
      tx,
      `SELECT * FROM sukuux.school_currency
        WHERE school_id=$1 AND archived_at IS NULL LIMIT 1`,
      schoolId
    );
    if (!current[0]) {
      if (expected !== 0) throw new SchoolXCanonicalConflictError();
      const created = await rows<any>(
        tx,
        `INSERT INTO sukuux.school_currency
           (id,school_id,currency_code,currency_symbol,decimal_places,locale,row_version,
            updated_by,effective_from,effective_to,changed_reason,created_at,updated_at,archived_at)
         VALUES
           (gen_random_uuid()::text,$1,$2,$3,$4,$5,1,$6,CURRENT_TIMESTAMP,NULL,$7,
            CURRENT_TIMESTAMP,CURRENT_TIMESTAMP,NULL)
         RETURNING *`,
        schoolId,
        v.currencyCode,
        v.currencySymbol,
        v.decimalPlaces,
        v.locale,
        actorId,
        changeReason
      );
      await audit(tx, schoolId, actorId, `CONFIGURE currency: ${changeReason}`);
      return created[0];
    }
    if (Number(current[0].row_version) !== expected) throw new SchoolXCanonicalConflictError();

    const updated = await rows<any>(
      tx,
      `UPDATE sukuux.school_currency
          SET currency_code=$2,
              currency_symbol=$3,
              decimal_places=$4,
              locale=$5,
              row_version=row_version+1,
              updated_by=$6,
              effective_from=CURRENT_TIMESTAMP,
              changed_reason=$7,
              updated_at=CURRENT_TIMESTAMP
        WHERE school_id=$1 AND archived_at IS NULL AND row_version=$8
        RETURNING *`,
      schoolId,
      v.currencyCode,
      v.currencySymbol,
      v.decimalPlaces,
      v.locale,
      actorId,
      changeReason,
      expected
    );
    if (!updated[0]) throw new SchoolXCanonicalConflictError();
    await audit(tx, schoolId, actorId, `CORRECT currency: ${changeReason}`);
    return updated[0];
  });
}

function isoDate(value: unknown, label: string) {
  const date = clean(value);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || Number.isNaN(Date.parse(`${date}T00:00:00Z`))) {
    throw new SchoolXCanonicalValidationError(`${label} must be YYYY-MM-DD.`);
  }
  return date;
}

export async function calendarWorkspace(schoolId: string) {
  return withTenantContext(undefined, async tx => {
    const academicYears = await rows<any>(
      tx,
      `SELECT id,name,start_date,end_date,is_active,created_at
         FROM sukuux.academics_academic_year
        WHERE school_id=$1
        ORDER BY start_date DESC`,
      schoolId
    );
    const terms = await rows<any>(
      tx,
      `SELECT id,academic_year_id,name,term_order,start_date,end_date,is_active
         FROM sukuux.academics_term
        WHERE school_id=$1
        ORDER BY academic_year_id,term_order`,
      schoolId
    );
    const holidays = await rows<any>(
      tx,
      `SELECT id,name,date,is_recurring,holiday_type,row_version,changed_reason,archived_at
         FROM sukuux.school_holiday
        WHERE school_id=$1 AND archived_at IS NULL
        ORDER BY date,name`,
      schoolId
    );
    const legacyCalendar = await rows<any>(
      tx,
      `SELECT id,academic_year_id,event_name,event_type,start_date,end_date,is_blackout
         FROM sukuux.school_calendar
        WHERE school_id=$1
        ORDER BY start_date,event_name`,
      schoolId
    );
    return {
      authority: {
        academicYearsAndTerms: 'AcademicX',
        institutionalHolidays: 'SchoolX',
        legacySchoolCalendar: 'read-only compatibility projection',
      },
      academicYears,
      terms,
      holidays,
      legacyCalendar,
    };
  });
}

export async function createHoliday(schoolId: string, actorId: string, input: any) {
  const name = clean(input.name);
  const date = isoDate(input.date, 'Holiday date');
  const holidayType = clean(input.holidayType).toUpperCase();
  const changeReason = reason(input.reason);
  if (name.length < 2) throw new SchoolXCanonicalValidationError('Holiday name is required.');
  if (!['NATIONAL', 'PUBLIC', 'RELIGIOUS', 'SCHOOL'].includes(holidayType)) {
    throw new SchoolXCanonicalValidationError('Unsupported holiday type.');
  }

  return withTenantContext(undefined, async tx => {
    const created = await rows<any>(
      tx,
      `INSERT INTO sukuux.school_holiday
         (id,school_id,name,date,is_recurring,holiday_type,row_version,changed_reason,
          created_at,updated_at,archived_at)
       VALUES
         (gen_random_uuid()::text,$1,$2,$3,$4,$5::sukuux."HolidayHolidayType",1,$6,
          CURRENT_TIMESTAMP,CURRENT_TIMESTAMP,NULL)
       RETURNING *`,
      schoolId,
      name,
      date,
      !!input.isRecurring,
      holidayType,
      changeReason
    );
    await audit(tx, schoolId, actorId, `CREATE holiday ${name}: ${changeReason}`);
    return created[0];
  });
}

export async function updateHoliday(schoolId: string, actorId: string, id: string, input: any) {
  const expected = version(input.expectedVersion);
  const changeReason = reason(input.reason);

  return withTenantContext(undefined, async tx => {
    const current = await rows<any>(
      tx,
      `SELECT * FROM sukuux.school_holiday
        WHERE id=$1 AND school_id=$2 AND archived_at IS NULL LIMIT 1`,
      id,
      schoolId
    );
    if (!current[0]) return null;
    if (Number(current[0].row_version) !== expected) throw new SchoolXCanonicalConflictError();

    const name = input.name === undefined ? current[0].name : clean(input.name);
    const date = input.date === undefined ? current[0].date : isoDate(input.date, 'Holiday date');
    const holidayType = input.holidayType === undefined ? current[0].holiday_type : clean(input.holidayType).toUpperCase();
    if (!['NATIONAL', 'PUBLIC', 'RELIGIOUS', 'SCHOOL'].includes(String(holidayType))) {
      throw new SchoolXCanonicalValidationError('Unsupported holiday type.');
    }

    const updated = await rows<any>(
      tx,
      `UPDATE sukuux.school_holiday
          SET name=$3,
              date=$4,
              is_recurring=COALESCE($5,is_recurring),
              holiday_type=$6::sukuux."HolidayHolidayType",
              row_version=row_version+1,
              changed_reason=$7,
              updated_at=CURRENT_TIMESTAMP
        WHERE id=$1 AND school_id=$2 AND archived_at IS NULL AND row_version=$8
        RETURNING *`,
      id,
      schoolId,
      name,
      date,
      input.isRecurring === undefined ? null : !!input.isRecurring,
      holidayType,
      changeReason,
      expected
    );
    if (!updated[0]) throw new SchoolXCanonicalConflictError();
    await audit(tx, schoolId, actorId, `CORRECT holiday ${id}: ${changeReason}`);
    return updated[0];
  });
}

export async function archiveHoliday(schoolId: string, actorId: string, id: string, input: any) {
  const expected = version(input.expectedVersion);
  const changeReason = reason(input.reason);
  return withTenantContext(undefined, async tx => {
    const archived = await rows<any>(
      tx,
      `UPDATE sukuux.school_holiday
          SET archived_at=CURRENT_TIMESTAMP,
              row_version=row_version+1,
              changed_reason=$4,
              updated_at=CURRENT_TIMESTAMP
        WHERE id=$1 AND school_id=$2 AND archived_at IS NULL AND row_version=$3
        RETURNING *`,
      id,
      schoolId,
      expected,
      changeReason
    );
    if (!archived[0]) {
      const exists = await rows<any>(
        tx,
        `SELECT id FROM sukuux.school_holiday WHERE id=$1 AND school_id=$2 AND archived_at IS NULL`,
        id,
        schoolId
      );
      if (exists[0]) throw new SchoolXCanonicalConflictError();
      return null;
    }
    await audit(tx, schoolId, actorId, `ARCHIVE holiday ${id}: ${changeReason}`);
    return archived[0];
  });
}

async function readinessSnapshot(tx: Tx, schoolId: string) {
  const school = await rows<any>(
    tx,
    `SELECT id,name,code,address,city,region,country,status,row_version
       FROM sukuux.school_school
      WHERE id=$1 LIMIT 1`,
    schoolId
  );
  if (!school[0]) return null;

  const counts = await rows<any>(
    tx,
    `SELECT
       (SELECT count(*)::int FROM sukuux.school_campus
         WHERE school_id=$1 AND is_primary=true AND is_active=true) AS primary_campus,
       (SELECT count(*)::int FROM sukuux.school_timezone
         WHERE school_id=$1 AND archived_at IS NULL) AS timezone,
       (SELECT count(*)::int FROM sukuux.school_currency
         WHERE school_id=$1 AND archived_at IS NULL) AS currency,
       (SELECT count(*)::int FROM sukuux.academics_academic_year
         WHERE school_id=$1 AND is_active=true) AS active_year`,
    schoolId
  );

  const activeYear = await rows<any>(
    tx,
    `SELECT id,name FROM sukuux.academics_academic_year
      WHERE school_id=$1 AND is_active=true
      ORDER BY created_at DESC LIMIT 2`,
    schoolId
  );
  const activeTerms = activeYear.length === 1
    ? await rows<any>(
        tx,
        `SELECT id,name FROM sukuux.academics_term
          WHERE school_id=$1 AND academic_year_id=$2 AND is_active=true
          ORDER BY term_order`,
        schoolId,
        activeYear[0].id
      )
    : [];

  const superadmin = await rows<any>(
    tx,
    `SELECT count(*)::int AS count
       FROM system.system_user_role ur
       JOIN system.system_role r ON r.id=ur.role_id
       JOIN system.system_user u ON u.id=ur.user_id
       JOIN system.system_mfa m
         ON m.user_id=u.id
        AND m.method='TOTP'::sukuux."MfaMethod"
      WHERE ur.school_id=$1
        AND r.name='superadmin'
        AND r.archived_at IS NULL
        AND u.archived_at IS NULL
        AND u.status='ACTIVE'
        AND u.is_active=true
        AND m.is_enabled=true
        AND m.verified_at IS NOT NULL
        AND m.secret IS NOT NULL
        AND (ur.expires_at IS NULL OR ur.expires_at > CURRENT_TIMESTAMP)`,
    schoolId
  );

  const profile = [school[0].name, school[0].code, school[0].address, school[0].city, school[0].region, school[0].country]
    .every(v => clean(v).length > 0);

  const values: Record<string, boolean> = {
    'institution-profile': profile,
    'primary-campus': Number(counts[0]?.primary_campus || 0) === 1,
    'tenant-superadmin': Number(superadmin[0]?.count || 0) === 1,
    'timezone': Number(counts[0]?.timezone || 0) === 1,
    'currency': Number(counts[0]?.currency || 0) === 1,
    'academic-year': Number(counts[0]?.active_year || 0) === 1,
    'active-term': activeTerms.length > 0,
  };

  const workItems = await rows<any>(
    tx,
    `SELECT * FROM sukuux.school_onboarding
      WHERE school_id=$1 AND archived_at IS NULL`,
    schoolId
  );
  const byStep = new Map(workItems.map(item => [item.step, item]));

  const checks = READINESS.map(def => ({
    ...def,
    complete: values[def.key],
    workItem: byStep.get(def.key) ?? null,
  }));

  return {
    schoolId,
    schoolStatus: school[0].status,
    schoolVersion: Number(school[0].row_version),
    providerActivationReady: checks.filter(c => c.activationRequired).every(c => c.complete),
    operationalReady: checks.every(c => c.complete),
    currentAcademicYear: activeYear.length === 1 ? activeYear[0] : null,
    activeTerms,
    checks,
  };
}

export async function getReadiness(schoolId: string) {
  return withTenantContext(undefined, tx => readinessSnapshot(tx, schoolId));
}

export async function putReadinessWorkItem(schoolId: string, actorId: string, step: string, input: any) {
  const def = READINESS.find(item => item.key === step);
  if (!def) throw new SchoolXCanonicalValidationError('Unknown readiness step.');
  const expected = version(input.expectedVersion);
  const changeReason = reason(input.reason);
  const status = clean(input.status || 'PENDING').toUpperCase();
  if (!['PENDING', 'IN_REVIEW', 'BLOCKED', 'RESOLVED'].includes(status)) {
    throw new SchoolXCanonicalValidationError('Unsupported readiness work-item status.');
  }

  return withTenantContext(undefined, async tx => {
    const snapshot = await readinessSnapshot(tx, schoolId);
    if (!snapshot) return null;
    const check = snapshot.checks.find(item => item.key === step)!;
    const current = await rows<any>(
      tx,
      `SELECT * FROM sukuux.school_onboarding
        WHERE school_id=$1 AND step=$2 AND archived_at IS NULL LIMIT 1`,
      schoolId,
      step
    );

    if (!current[0]) {
      if (expected !== 0) throw new SchoolXCanonicalConflictError();
      const created = await rows<any>(
        tx,
        `INSERT INTO sukuux.school_onboarding
           (id,school_id,step,is_complete,completed_at,completed_by,status,source_domain,
            owner_user_id,exception_reason,evidence_reference,row_version,changed_reason,
            updated_at,archived_at)
         VALUES
           (gen_random_uuid()::text,$1,$2,$3,
            CASE WHEN $3 THEN CURRENT_TIMESTAMP ELSE NULL END,
            CASE WHEN $3 THEN $4 ELSE NULL END,
            $5,$6,$7,$8,$9,1,$10,CURRENT_TIMESTAMP,NULL)
         RETURNING *`,
        schoolId,
        step,
        check.complete,
        actorId,
        status,
        def.sourceDomain,
        clean(input.ownerUserId) || null,
        clean(input.exceptionReason) || null,
        clean(input.evidenceReference) || null,
        changeReason
      );
      await audit(tx, schoolId, actorId, `READINESS ${step}: ${changeReason}`);
      return created[0];
    }

    if (Number(current[0].row_version) !== expected) throw new SchoolXCanonicalConflictError();
    const updated = await rows<any>(
      tx,
      `UPDATE sukuux.school_onboarding
          SET is_complete=$3,
              completed_at=CASE WHEN $3 THEN COALESCE(completed_at,CURRENT_TIMESTAMP) ELSE NULL END,
              completed_by=CASE WHEN $3 THEN COALESCE(completed_by,$4) ELSE NULL END,
              status=$5,
              source_domain=$6,
              owner_user_id=$7,
              exception_reason=$8,
              evidence_reference=$9,
              row_version=row_version+1,
              changed_reason=$10,
              updated_at=CURRENT_TIMESTAMP
        WHERE id=$1 AND school_id=$2 AND archived_at IS NULL AND row_version=$11
        RETURNING *`,
      current[0].id,
      schoolId,
      check.complete,
      actorId,
      status,
      def.sourceDomain,
      clean(input.ownerUserId) || null,
      clean(input.exceptionReason) || null,
      clean(input.evidenceReference) || null,
      changeReason,
      expected
    );
    if (!updated[0]) throw new SchoolXCanonicalConflictError();
    await audit(tx, schoolId, actorId, `READINESS ${step}: ${changeReason}`);
    return updated[0];
  });
}
