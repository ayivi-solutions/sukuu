import { Response } from 'express';
import { AuthRequest } from '../../middleware/authenticate';
import * as svc from './learn.service';

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

export const getCourses = wrap(req => svc.listCourses(req.schoolId || ''));
export const postCourse = wrapCreate(req => svc.createCourse(req.schoolId || '', req.body));

export const getLessonPlans = wrap(req => svc.listLessonPlans(req.schoolId || '', req.query.courseId as string | undefined));
export const postLessonPlan = wrapCreate(req => svc.createLessonPlan(req.schoolId || '', req.body));

export const getTopicDeliveries = wrap(req => svc.listTopicDeliveries(req.schoolId || '', req.query.lessonPlanId as string | undefined));
export const postTopicDelivery = wrapCreate(req => svc.createTopicDelivery(req.schoolId || '', req.body));
export const patchTopicDeliveryStatus = wrapMutateById(svc.getTopicDeliverySchoolId, req => svc.updateTopicDeliveryStatus(req.params.id, req.body.status));

export const getAssignments = wrap(req => svc.listAssignments(req.schoolId || '', req.query.courseId as string | undefined));
export const postAssignment = wrapCreate(req => svc.createAssignment(req.schoolId || '', req.body));

export const getSubmissions = wrap(req => svc.listSubmissions(req.schoolId || '', req.query.assignmentId as string | undefined));
export const postSubmission = wrapCreate(req => svc.createSubmission(req.schoolId || '', req.body));
export const patchGradeSubmission = wrapMutateById(svc.getSubmissionSchoolId, req => svc.gradeSubmission(req.params.id, req.body.score, req.body.feedback));

export const getHomeworkReturns = wrap(req => svc.listHomeworkReturns(req.schoolId || '', req.query.assignmentId as string | undefined));
export const postHomeworkReturn = wrapCreate(req => svc.createHomeworkReturn(req.schoolId || '', req.userId || '', req.body));

export const getMastery = wrap(req => svc.listMastery(req.schoolId || '', req.query.studentId as string | undefined));
export const putMastery = wrapCreate(req => svc.upsertMastery(req.schoolId || '', req.body));

export const getQuizzes = wrap(req => svc.listQuizzes(req.schoolId || '', req.query.courseId as string | undefined));
export const postQuiz = wrapCreate(req => svc.createQuiz(req.schoolId || '', req.body));

export const getQuizQuestions = wrap(req => svc.listQuizQuestions(req.schoolId || '', req.query.quizId as string | undefined));
export const postQuizQuestion = wrapCreate(req => svc.createQuizQuestion(req.schoolId || '', req.body));

export const getQuizAttempts = wrap(req => svc.listQuizAttempts(req.schoolId || '', req.query.quizId as string | undefined));
export const postQuizAttempt = wrapCreate(req => svc.createQuizAttempt(req.schoolId || '', req.body));
export const patchCompleteQuizAttempt = wrapMutateById(svc.getQuizAttemptSchoolId, req => svc.completeQuizAttempt(req.params.id, req.body.score));

export const getObservations = wrap(req => svc.listObservations(req.schoolId || '', req.query.teacherId as string | undefined));
export const postObservation = wrapCreate(req => svc.createObservation(req.schoolId || '', req.userId || '', req.body));

export const getReadingRecords = wrap(req => svc.listReadingRecords(req.schoolId || '', req.query.studentId as string | undefined));
export const postReadingRecord = wrapCreate(req => svc.createReadingRecord(req.schoolId || '', req.userId || '', req.body));

export const getResources = wrap(req => svc.listResources(req.schoolId || '', req.query.courseId as string | undefined));
export const postResource = wrapCreate(req => svc.createResource(req.schoolId || '', req.body));

export const getSummary = wrap(req => svc.getLearnSummary(req.schoolId || ''));
