import { Response } from 'express';
import { AuthRequest } from '../../middleware/authenticate';
import * as svc from './academic.service';

function wrap(fn: (req: AuthRequest) => Promise<any>) {
  return async (req: AuthRequest, res: Response) => {
    try { res.json(await fn(req)); } catch (err: any) { res.status(500).json({ error: err.message }); }
  };
}
function wrapCreate(fn: (req: AuthRequest) => Promise<any>) {
  return async (req: AuthRequest, res: Response) => {
    try { res.status(201).json(await fn(req)); } catch (err: any) { res.status(500).json({ error: err.message }); }
  };
}

export const getYears = wrap(req => svc.listYears(req.schoolId || ''));
export const postYear = wrapCreate(req => svc.createYear(req.schoolId || '', req.body));
export const patchYear = wrap(req => svc.updateYear(req.params.id, req.body));
export const patchActivateYear = wrap(req => svc.activateYear(req.schoolId || '', req.params.id));
export const patchArchiveYear = wrap(req => svc.archiveYear(req.params.id));

export const getTerms = wrap(req => svc.listTerms(req.schoolId || ''));
export const postTerm = wrapCreate(req => svc.createTerm(req.schoolId || '', req.body));
export const patchTerm = wrap(req => svc.updateTerm(req.params.id, req.body));
export const patchArchiveTerm = wrap(req => svc.archiveTerm(req.params.id));

export const getClasses = wrap(req => svc.listClasses(req.schoolId || ''));
export const postClass = wrapCreate(req => svc.createClass(req.schoolId || '', req.body));
export const patchClass = wrap(req => svc.updateClass(req.params.id, req.body));
export const patchArchiveClass = wrap(req => svc.archiveClass(req.params.id));

export const getStreams = wrap(req => svc.listStreams(req.schoolId || ''));
export const postStream = wrapCreate(req => svc.createStream(req.schoolId || '', req.body));
export const patchStream = wrap(req => svc.updateStream(req.params.id, req.body));
export const patchArchiveStream = wrap(req => svc.archiveStream(req.params.id));

export const getSubjects = wrap(req => svc.listSubjects(req.schoolId || ''));
export const postSubject = wrapCreate(req => svc.createSubject(req.schoolId || '', req.body));
export const patchSubject = wrap(req => svc.updateSubject(req.params.id, req.body));
export const patchArchiveSubject = wrap(req => svc.archiveSubject(req.params.id));

export const getDepartments = wrap(req => svc.listDepartments(req.schoolId || ''));
export const postDepartment = wrapCreate(req => svc.createDepartment(req.schoolId || '', req.body));
export const patchDepartment = wrap(req => svc.updateDepartment(req.params.id, req.body));
export const patchArchiveDepartment = wrap(req => svc.archiveDepartment(req.params.id));

export const getSubjectAssignments = wrap(req => svc.listSubjectAssignments(req.schoolId || ''));
export const postSubjectAssignment = wrapCreate(req => svc.createSubjectAssignment(req.schoolId || '', req.body));
export const patchArchiveSubjectAssignment = wrap(req => svc.archiveSubjectAssignment(req.params.id));

export const getClassSubjects = wrap(req => svc.listClassSubjects(req.schoolId || ''));
export const postClassSubject = wrapCreate(req => svc.createClassSubject(req.schoolId || '', req.body));
export const patchArchiveClassSubject = wrap(req => svc.archiveClassSubject(req.params.id));

export const getStreamSubjects = wrap(req => svc.listStreamSubjects(req.schoolId || ''));
export const postStreamSubject = wrapCreate(req => svc.createStreamSubject(req.schoolId || '', req.body));
export const patchArchiveStreamSubject = wrap(req => svc.archiveStreamSubject(req.params.id));

export const getSubjectGroups = wrap(req => svc.listSubjectGroups(req.schoolId || ''));
export const postSubjectGroup = wrapCreate(req => svc.createSubjectGroup(req.schoolId || '', req.body));
export const patchArchiveSubjectGroup = wrap(req => svc.archiveSubjectGroup(req.params.id));

export const getCurricula = wrap(req => svc.listCurricula(req.schoolId || ''));
export const postCurriculum = wrapCreate(req => svc.createCurriculum(req.schoolId || '', req.body));
export const patchCurriculum = wrap(req => svc.updateCurriculum(req.params.id, req.body));
export const patchArchiveCurriculum = wrap(req => svc.archiveCurriculum(req.params.id));

export const getTopics = wrap(req => svc.listTopics(req.params.curriculumId));
export const postTopic = wrapCreate(req => svc.createTopic(req.params.curriculumId, req.body));
export const patchArchiveTopic = wrap(req => svc.archiveTopic(req.params.id));

export const getObjectives = wrap(req => svc.listObjectives(req.params.topicId));
export const postObjective = wrapCreate(req => svc.createObjective(req.params.topicId, req.body));
export const patchArchiveObjective = wrap(req => svc.archiveObjective(req.params.id));

export const getOutcomes = wrap(req => svc.listOutcomes(req.schoolId || ''));
export const postOutcome = wrapCreate(req => svc.createOutcome(req.schoolId || '', req.body));
export const patchArchiveOutcome = wrap(req => svc.archiveOutcome(req.params.id));

export const getPromotionRules = wrap(req => svc.listPromotionRules(req.schoolId || ''));
export const postPromotionRule = wrapCreate(req => svc.createPromotionRule(req.schoolId || '', req.body));
export const patchArchivePromotionRule = wrap(req => svc.archivePromotionRule(req.params.id));

export const getClassTeachers = wrap(req => svc.listClassTeachers(req.schoolId || ''));
export const postClassTeacher = wrapCreate(req => svc.createClassTeacher(req.schoolId || '', req.body));
export const patchArchiveClassTeacher = wrap(req => svc.archiveClassTeacher(req.params.id));
