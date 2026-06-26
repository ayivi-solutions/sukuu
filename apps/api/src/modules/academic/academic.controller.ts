import { Response } from 'express';
import { AuthRequest } from '../../middleware/authenticate';
import { logAuditEvent } from '../system/system.service';
import * as svc from './academic.service';

function wrap(fn: (req: AuthRequest) => Promise<any>) {
  return async (req: AuthRequest, res: Response) => {
    try { res.json(await fn(req)); } catch (err: any) { res.status(500).json({ error: err.message }); }
  };
}
function wrapCreate(action: string, entityType: string, fn: (req: AuthRequest) => Promise<any>) {
  return async (req: AuthRequest, res: Response) => {
    try {
      const result = await fn(req);
      if (req.schoolId) await logAuditEvent(req.schoolId, req.userId || '', action, entityType, result?.id);
      res.status(201).json(result);
    } catch (err: any) { res.status(500).json({ error: err.message }); }
  };
}
function wrapMutate(action: string, entityType: string, fn: (req: AuthRequest) => Promise<any>) {
  return async (req: AuthRequest, res: Response) => {
    try {
      const result = await fn(req);
      if (req.schoolId) await logAuditEvent(req.schoolId, req.userId || '', action, entityType, req.params.id);
      res.json(result);
    } catch (err: any) { res.status(500).json({ error: err.message }); }
  };
}

export const getYears = wrap(req => svc.listYears(req.schoolId || ''));
export const postYear = wrapCreate('CREATE_YEAR', 'academics_academic_year', req => svc.createYear(req.schoolId || '', req.body));
export const patchYear = wrapMutate('UPDATE_YEAR', 'academics_academic_year', req => svc.updateYear(req.params.id, req.body));
export const patchActivateYear = wrapMutate('ACTIVATE_YEAR', 'academics_academic_year', req => svc.activateYear(req.schoolId || '', req.params.id));
export const patchArchiveYear = wrapMutate('ARCHIVE_YEAR', 'academics_academic_year', req => svc.archiveYear(req.params.id));

export const getTerms = wrap(req => svc.listTerms(req.schoolId || ''));
export const postTerm = wrapCreate('CREATE_TERM', 'academics_term', req => svc.createTerm(req.schoolId || '', req.body));
export const patchTerm = wrapMutate('UPDATE_TERM', 'academics_term', req => svc.updateTerm(req.params.id, req.body));
export const patchArchiveTerm = wrapMutate('ARCHIVE_TERM', 'academics_term', req => svc.archiveTerm(req.params.id));

export const getClasses = wrap(req => svc.listClasses(req.schoolId || ''));
export const postClass = wrapCreate('CREATE_CLASS', 'academics_class', req => svc.createClass(req.schoolId || '', req.body));
export const patchClass = wrapMutate('UPDATE_CLASS', 'academics_class', req => svc.updateClass(req.params.id, req.body));
export const patchArchiveClass = wrapMutate('ARCHIVE_CLASS', 'academics_class', req => svc.archiveClass(req.params.id));

export const getStreams = wrap(req => svc.listStreams(req.schoolId || ''));
export const postStream = wrapCreate('CREATE_STREAM', 'academics_stream', req => svc.createStream(req.schoolId || '', req.body));
export const patchStream = wrapMutate('UPDATE_STREAM', 'academics_stream', req => svc.updateStream(req.params.id, req.body));
export const patchArchiveStream = wrapMutate('ARCHIVE_STREAM', 'academics_stream', req => svc.archiveStream(req.params.id));

export const getSubjects = wrap(req => svc.listSubjects(req.schoolId || ''));
export const postSubject = wrapCreate('CREATE_SUBJECT', 'academics_subject', req => svc.createSubject(req.schoolId || '', req.body));
export const patchSubject = wrapMutate('UPDATE_SUBJECT', 'academics_subject', req => svc.updateSubject(req.params.id, req.body));
export const patchArchiveSubject = wrapMutate('ARCHIVE_SUBJECT', 'academics_subject', req => svc.archiveSubject(req.params.id));

export const getDepartments = wrap(req => svc.listDepartments(req.schoolId || ''));
export const postDepartment = wrapCreate('CREATE_DEPARTMENT', 'academics_department', req => svc.createDepartment(req.schoolId || '', req.body));
export const patchDepartment = wrapMutate('UPDATE_DEPARTMENT', 'academics_department', req => svc.updateDepartment(req.params.id, req.body));
export const patchArchiveDepartment = wrapMutate('ARCHIVE_DEPARTMENT', 'academics_department', req => svc.archiveDepartment(req.params.id));

export const getSubjectAssignments = wrap(req => svc.listSubjectAssignments(req.schoolId || ''));
export const postSubjectAssignment = wrapCreate('CREATE_SUBJECT_ASSIGNMENT', 'academics_subject_assignment', req => svc.createSubjectAssignment(req.schoolId || '', req.body));
export const patchArchiveSubjectAssignment = wrapMutate('ARCHIVE_SUBJECT_ASSIGNMENT', 'academics_subject_assignment', req => svc.archiveSubjectAssignment(req.params.id));

export const getClassSubjects = wrap(req => svc.listClassSubjects(req.schoolId || ''));
export const postClassSubject = wrapCreate('CREATE_CLASS_SUBJECT', 'academics_class_subject', req => svc.createClassSubject(req.schoolId || '', req.body));
export const patchArchiveClassSubject = wrapMutate('ARCHIVE_CLASS_SUBJECT', 'academics_class_subject', req => svc.archiveClassSubject(req.params.id));

export const getStreamSubjects = wrap(req => svc.listStreamSubjects(req.schoolId || ''));
export const postStreamSubject = wrapCreate('CREATE_STREAM_SUBJECT', 'academics_stream_subject', req => svc.createStreamSubject(req.schoolId || '', req.body));
export const patchArchiveStreamSubject = wrapMutate('ARCHIVE_STREAM_SUBJECT', 'academics_stream_subject', req => svc.archiveStreamSubject(req.params.id));

export const getSubjectGroups = wrap(req => svc.listSubjectGroups(req.schoolId || ''));
export const postSubjectGroup = wrapCreate('CREATE_SUBJECT_GROUP', 'academics_subject_group', req => svc.createSubjectGroup(req.schoolId || '', req.body));
export const patchArchiveSubjectGroup = wrapMutate('ARCHIVE_SUBJECT_GROUP', 'academics_subject_group', req => svc.archiveSubjectGroup(req.params.id));

export const getCurricula = wrap(req => svc.listCurricula(req.schoolId || ''));
export const postCurriculum = wrapCreate('CREATE_CURRICULUM', 'academics_curriculum', req => svc.createCurriculum(req.schoolId || '', req.body));
export const patchCurriculum = wrapMutate('UPDATE_CURRICULUM', 'academics_curriculum', req => svc.updateCurriculum(req.params.id, req.body));
export const patchArchiveCurriculum = wrapMutate('ARCHIVE_CURRICULUM', 'academics_curriculum', req => svc.archiveCurriculum(req.params.id));

export const getTopics = wrap(req => svc.listTopics(req.params.curriculumId));
export const postTopic = wrapCreate('CREATE_TOPIC', 'academics_curriculum_topic', req => svc.createTopic(req.params.curriculumId, req.body));
export const patchArchiveTopic = wrapMutate('ARCHIVE_TOPIC', 'academics_curriculum_topic', req => svc.archiveTopic(req.params.id));

export const getObjectives = wrap(req => svc.listObjectives(req.params.topicId));
export const postObjective = wrapCreate('CREATE_OBJECTIVE', 'academics_curriculum_objective', req => svc.createObjective(req.params.topicId, req.body));
export const patchArchiveObjective = wrapMutate('ARCHIVE_OBJECTIVE', 'academics_curriculum_objective', req => svc.archiveObjective(req.params.id));

export const getOutcomes = wrap(req => svc.listOutcomes(req.schoolId || ''));
export const postOutcome = wrapCreate('CREATE_OUTCOME', 'academics_learning_outcome', req => svc.createOutcome(req.schoolId || '', req.body));
export const patchArchiveOutcome = wrapMutate('ARCHIVE_OUTCOME', 'academics_learning_outcome', req => svc.archiveOutcome(req.params.id));

export const getPromotionRules = wrap(req => svc.listPromotionRules(req.schoolId || ''));
export const postPromotionRule = wrapCreate('CREATE_PROMOTION_RULE', 'academics_promotion_rule', req => svc.createPromotionRule(req.schoolId || '', req.body));
export const patchArchivePromotionRule = wrapMutate('ARCHIVE_PROMOTION_RULE', 'academics_promotion_rule', req => svc.archivePromotionRule(req.params.id));

export const getClassTeachers = wrap(req => svc.listClassTeachers(req.schoolId || ''));
export const postClassTeacher = wrapCreate('CREATE_CLASS_TEACHER', 'academics_class_teacher_assignment', req => svc.createClassTeacher(req.schoolId || '', req.body));
export const patchArchiveClassTeacher = wrapMutate('ARCHIVE_CLASS_TEACHER', 'academics_class_teacher_assignment', req => svc.archiveClassTeacher(req.params.id));
