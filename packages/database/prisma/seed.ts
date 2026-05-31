import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();
const SCHOOL_ID = 'SCH-001';

async function main() {
  console.log('Seeding Sukuu pilot school...');

  // ── School ───────────────────────────────────────────────────────
  await prisma.schoolSchool.upsert({
    where: { id: SCHOOL_ID },
    update: {},
    create: {
      id: SCHOOL_ID,
      name: 'Presec Academy',
      code: 'PRESEC-001',
      school_type: 'COMBINED',
      registration_number: 'GES/2009/0042',
      address: 'P.O. Box 14, Presec Road',
      city: 'Legon',
      region: 'Greater Accra',
      country: 'Ghana',
      phone: '+233302960403',
      email: 'admin@presec.edu.gh',
      website: 'https://presec.edu.gh',
      is_active: true,
    },
  });

  // ── System Roles (9) ─────────────────────────────────────────────
  const roles = [
    { id: 'ROL-001', name: 'headmaster',   label: 'Headmaster' },
    { id: 'ROL-002', name: 'school_admin', label: 'Admin Officer' },
    { id: 'ROL-003', name: 'teacher',      label: 'Teacher' },
    { id: 'ROL-004', name: 'bursar',       label: 'Bursar' },
    { id: 'ROL-005', name: 'registrar',    label: 'Registrar' },
    { id: 'ROL-006', name: 'parent',       label: 'Parent/Guardian' },
    { id: 'ROL-007', name: 'student',      label: 'Student' },
    { id: 'ROL-008', name: 'hod',          label: 'Head of Department' },
    { id: 'ROL-009', name: 'nurse',        label: 'School Nurse' },
  ];
  for (const role of roles) {
    await prisma.systemRole.upsert({
      where: { id: role.id },
      update: {},
      create: { ...role, is_system: true },
    });
  }

  // ── Departments ───────────────────────────────────────────────────
  const depts = [
    { id: 'DEP-MGT', name: 'Management',          code: 'MGT' },
    { id: 'DEP-ADM', name: 'Administration',       code: 'ADM' },
    { id: 'DEP-MAT', name: 'Mathematics',          code: 'MAT' },
    { id: 'DEP-SCI', name: 'Sciences',             code: 'SCI' },
    { id: 'DEP-ENG', name: 'English & Languages',  code: 'ENG' },
    { id: 'DEP-SOC', name: 'Social Studies',       code: 'SOC' },
    { id: 'DEP-ICT', name: 'ICT',                  code: 'ICT' },
    { id: 'DEP-PE',  name: 'Physical Education',   code: 'PE' },
  ];
  for (const dept of depts) {
    await prisma.schoolDepartment.upsert({
      where: { id: dept.id },
      update: {},
      create: { ...dept, school_id: SCHOOL_ID, is_active: true },
    });
  }

  // ── Academic Year + Terms ─────────────────────────────────────────
  await prisma.academicsAcademicYear.upsert({
    where: { id: 'AY-2026' },
    update: {},
    create: {
      id: 'AY-2026', school_id: SCHOOL_ID,
      name: '2025/2026',
      start_date: '2025-09-01', end_date: '2026-07-31',
      is_active: true,
    },
  });
  const terms = [
    { id: 'TRM-2026-1', name: 'Term 1', term_order: 1, start_date: '2025-09-07', end_date: '2025-12-12', is_active: false },
    { id: 'TRM-2026-2', name: 'Term 2', term_order: 2, start_date: '2026-01-12', end_date: '2026-04-11', is_active: true  },
    { id: 'TRM-2026-3', name: 'Term 3', term_order: 3, start_date: '2026-05-04', end_date: '2026-07-25', is_active: false },
  ];
  for (const term of terms) {
    await prisma.academicsTerm.upsert({
      where: { id: term.id },
      update: {},
      create: { ...term, academic_year_id: 'AY-2026', school_id: SCHOOL_ID },
    });
  }

  // ── Class Levels (11) ─────────────────────────────────────────────
  const classes = [
    { id: 'CLS-KG1', name: 'Kindergarten 1', code: 'KG1', level_order: 1 },
    { id: 'CLS-KG2', name: 'Kindergarten 2', code: 'KG2', level_order: 2 },
    { id: 'CLS-P1',  name: 'Primary 1',       code: 'P1',  level_order: 3 },
    { id: 'CLS-P2',  name: 'Primary 2',       code: 'P2',  level_order: 4 },
    { id: 'CLS-P3',  name: 'Primary 3',       code: 'P3',  level_order: 5 },
    { id: 'CLS-P4',  name: 'Primary 4',       code: 'P4',  level_order: 6 },
    { id: 'CLS-P5',  name: 'Primary 5',       code: 'P5',  level_order: 7 },
    { id: 'CLS-P6',  name: 'Primary 6',       code: 'P6',  level_order: 8 },
    { id: 'CLS-J1',  name: 'JHS 1',           code: 'J1',  level_order: 9 },
    { id: 'CLS-J2',  name: 'JHS 2',           code: 'J2',  level_order: 10 },
    { id: 'CLS-J3',  name: 'JHS 3',           code: 'J3',  level_order: 11 },
  ];
  for (const cls of classes) {
    await prisma.academicsClass.upsert({
      where: { id: cls.id },
      update: {},
      create: { ...cls, school_id: SCHOOL_ID, is_active: true },
    });
  }

  // ── Streams ───────────────────────────────────────────────────────
  const streams = [
    { id: 'STR-J1A', class_id: 'CLS-J1', name: 'JHS 1A', code: 'J1A', capacity: 40 },
    { id: 'STR-J1B', class_id: 'CLS-J1', name: 'JHS 1B', code: 'J1B', capacity: 40 },
    { id: 'STR-J2A', class_id: 'CLS-J2', name: 'JHS 2A', code: 'J2A', capacity: 40 },
    { id: 'STR-J2B', class_id: 'CLS-J2', name: 'JHS 2B', code: 'J2B', capacity: 40 },
    { id: 'STR-J3A', class_id: 'CLS-J3', name: 'JHS 3A', code: 'J3A', capacity: 40 },
  ];
  for (const stream of streams) {
    await prisma.academicsStream.upsert({
      where: { id: stream.id },
      update: {},
      create: { ...stream, school_id: SCHOOL_ID, is_active: true },
    });
  }

  // ── Subjects ──────────────────────────────────────────────────────
  const subjects = [
    { id: 'SUB-MAT', dept: 'DEP-MAT', name: 'Mathematics',           code: 'MAT', type: 'CORE',      credits: 6 },
    { id: 'SUB-ENG', dept: 'DEP-ENG', name: 'English Language',      code: 'ENG', type: 'CORE',      credits: 6 },
    { id: 'SUB-SCI', dept: 'DEP-SCI', name: 'Integrated Science',    code: 'SCI', type: 'CORE',      credits: 4 },
    { id: 'SUB-SOC', dept: 'DEP-SOC', name: 'Social Studies',        code: 'SOC', type: 'CORE',      credits: 4 },
    { id: 'SUB-RME', dept: 'DEP-SOC', name: 'RME',                   code: 'RME', type: 'CORE',      credits: 2 },
    { id: 'SUB-CRE', dept: 'DEP-ENG', name: 'Creative Arts',         code: 'CRE', type: 'CORE',      credits: 2 },
    { id: 'SUB-GHA', dept: 'DEP-ENG', name: 'Ghanaian Language',     code: 'GHA', type: 'CORE',      credits: 2 },
    { id: 'SUB-ICT', dept: 'DEP-ICT', name: 'Information Technology',code: 'ICT', type: 'ELECTIVE',  credits: 2 },
    { id: 'SUB-FRE', dept: 'DEP-ENG', name: 'French',                code: 'FRE', type: 'ELECTIVE',  credits: 2 },
    { id: 'SUB-BIO', dept: 'DEP-SCI', name: 'Biology',               code: 'BIO', type: 'ELECTIVE',  credits: 3 },
    { id: 'SUB-PHY', dept: 'DEP-SCI', name: 'Physics',               code: 'PHY', type: 'ELECTIVE',  credits: 3 },
    { id: 'SUB-CHM', dept: 'DEP-SCI', name: 'Chemistry',             code: 'CHM', type: 'ELECTIVE',  credits: 3 },
    { id: 'SUB-PE',  dept: 'DEP-PE',  name: 'Physical Education',    code: 'PE',  type: 'EXTRA_CURRICULAR', credits: 2 },
  ];
  for (const sub of subjects) {
    await prisma.academicsSubject.upsert({
      where: { id: sub.id },
      update: {},
      create: {
        id: sub.id, school_id: SCHOOL_ID, department_id: sub.dept,
        name: sub.name, code: sub.code, subject_type: sub.type,
        credit_hours: sub.credits, is_active: true,
      },
    });
  }

  // ── Feature Flags ─────────────────────────────────────────────────
  const flags = [
    { id: 'FF-001', key: 'enable_hostel_module',  enabled: false, desc: 'Hostel/boarding module' },
    { id: 'FF-002', key: 'enable_paystack_momo',  enabled: true,  desc: 'Paystack MoMo collection' },
    { id: 'FF-003', key: 'enable_biometric_att',  enabled: false, desc: 'Biometric attendance' },
    { id: 'FF-004', key: 'enable_sukuu_kids',      enabled: true,  desc: 'Sukuu Kids bridge' },
    { id: 'FF-005', key: 'enable_parent_portal',  enabled: true,  desc: 'Parent portal (Sukuu App)' },
    { id: 'FF-006', key: 'enable_sms_alerts',     enabled: true,  desc: 'Twilio SMS notifications' },
  ];
  for (const flag of flags) {
    await prisma.systemFeatureFlag.upsert({
      where: { id: flag.id },
      update: {},
      create: {
        id: flag.id, flag_key: flag.key,
        is_enabled: flag.enabled, school_id: SCHOOL_ID,
        description: flag.desc,
      },
    });
  }

  // ── Users + Staff ─────────────────────────────────────────────────
  const staffSeed = [
    {
      userId: 'USR-EA-001', staffId: 'STF-EA-001',
      email: 'e.asante@presec.edu.gh', password: 'Sukuu@Head2026!',
      firstName: 'Emmanuel', lastName: 'Asante', gender: 'MALE',
      dob: '1972-04-15', phone: '+233244001001',
      roleId: 'ROL-001', deptId: 'DEP-MGT', empType: 'PERMANENT',
      startDate: '2009-09-01', ssnit: 'G-0001-1234-A', tin: 'C0012341001',
    },
    {
      userId: 'USR-AO-002', staffId: 'STF-AO-002',
      email: 'admin@presec.edu.gh', password: 'Sukuu@Admin2026!',
      firstName: 'Abena', lastName: 'Owusu', gender: 'FEMALE',
      dob: '1985-07-22', phone: '+233244001002',
      roleId: 'ROL-002', deptId: 'DEP-ADM', empType: 'PERMANENT',
      startDate: '2018-01-08', ssnit: 'G-0002-2345-B', tin: 'C0012342002',
    },
    {
      userId: 'USR-KO-003', staffId: 'STF-KO-003',
      email: 'k.owusu@presec.edu.gh', password: 'Sukuu@Teacher2026!',
      firstName: 'Kwame', lastName: 'Owusu-Acheampong', gender: 'MALE',
      dob: '1988-11-03', phone: '+233244001003',
      roleId: 'ROL-003', deptId: 'DEP-MAT', empType: 'PERMANENT',
      startDate: '2019-09-02', ssnit: 'G-0003-3456-C', tin: 'C0012343003',
    },
    {
      userId: 'USR-BT-007', staffId: 'STF-BT-006',
      email: 'b.twum@presec.edu.gh', password: 'Sukuu@Bursar2026!',
      firstName: 'Benjamin', lastName: 'Twum', gender: 'MALE',
      dob: '1987-09-14', phone: '+233244001007',
      roleId: 'ROL-004', deptId: 'DEP-ADM', empType: 'PERMANENT',
      startDate: '2020-09-01', ssnit: 'G-0006-6789-F', tin: 'C0012346006',
    },
    {
      userId: 'USR-EY-008', staffId: 'STF-EY-007',
      email: 'e.yeboah@presec.edu.gh', password: 'Sukuu@Reg2026!',
      firstName: 'Efua', lastName: 'Yeboah', gender: 'FEMALE',
      dob: '1992-12-01', phone: '+233244001008',
      roleId: 'ROL-005', deptId: 'DEP-ADM', empType: 'CONTRACT',
      startDate: '2023-01-09', ssnit: 'G-0007-7890-G', tin: 'C0012347007',
    },
  ];

  for (const s of staffSeed) {
    const hash = await bcrypt.hash(s.password, 12);
    await prisma.systemUser.upsert({
      where: { id: s.userId },
      update: {},
      create: {
        id: s.userId, email: s.email, phone: s.phone,
        password_hash: hash, is_active: true, is_verified: true,
      },
    });
    await prisma.staffStaff.upsert({
      where: { id: s.staffId },
      update: {},
      create: {
        id: s.staffId, school_id: SCHOOL_ID, staff_id: s.staffId,
        user_id: s.userId,
        first_name: s.firstName, last_name: s.lastName,
        gender: s.gender, date_of_birth: s.dob,
        phone: s.phone, email: s.email,
        ssnit_id: s.ssnit, tax_identification_number: s.tin,
        employment_status: 'ACTIVE',
      },
    });
    await prisma.staffEmployment.upsert({
      where: { id: 'EMP-' + s.staffId },
      update: {},
      create: {
        id: 'EMP-' + s.staffId,
        staff_id: s.staffId, school_id: SCHOOL_ID,
        role_id: s.roleId, department_id: s.deptId,
        employment_type: s.empType,
        start_date: s.startDate, is_current: true,
      },
    });
  }

  console.log('');
  console.log('✓ Presec Academy seeded');
  console.log('  School ID:   SCH-001');
  console.log('');
  console.log('  Credentials:');
  console.log('  Headmaster:  e.asante@presec.edu.gh     / Sukuu@Head2026!');
  console.log('  Admin:       admin@presec.edu.gh          / Sukuu@Admin2026!');
  console.log('  Teacher:     k.owusu@presec.edu.gh       / Sukuu@Teacher2026!');
  console.log('  Bursar:      b.twum@presec.edu.gh         / Sukuu@Bursar2026!');
  console.log('  Registrar:   e.yeboah@presec.edu.gh      / Sukuu@Reg2026!');
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
