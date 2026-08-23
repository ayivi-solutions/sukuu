import { Router } from 'express';
import { authenticate } from '../../middleware/authenticate';
import { requireModuleAccess } from '../../middleware/requireModuleAccess';
import * as ctrl from './learn.controller';

export const learnRouter = Router();
const R = requireModuleAccess('learn', 'read');
const F = requireModuleAccess('learn', 'full');

learnRouter.get('/courses', authenticate, R, ctrl.getCourses);
learnRouter.post('/courses', authenticate, F, ctrl.postCourse);

learnRouter.get('/lesson-plans', authenticate, R, ctrl.getLessonPlans);
learnRouter.post('/lesson-plans', authenticate, F, ctrl.postLessonPlan);

learnRouter.get('/topic-deliveries', authenticate, R, ctrl.getTopicDeliveries);
learnRouter.post('/topic-deliveries', authenticate, F, ctrl.postTopicDelivery);
learnRouter.patch('/topic-deliveries/:id/status', authenticate, F, ctrl.patchTopicDeliveryStatus);

learnRouter.get('/assignments', authenticate, R, ctrl.getAssignments);
learnRouter.post('/assignments', authenticate, F, ctrl.postAssignment);

learnRouter.get('/submissions', authenticate, R, ctrl.getSubmissions);
learnRouter.post('/submissions', authenticate, F, ctrl.postSubmission);
learnRouter.patch('/submissions/:id/grade', authenticate, F, ctrl.patchGradeSubmission);

learnRouter.get('/homework-returns', authenticate, R, ctrl.getHomeworkReturns);
learnRouter.post('/homework-returns', authenticate, F, ctrl.postHomeworkReturn);

learnRouter.get('/mastery', authenticate, R, ctrl.getMastery);
learnRouter.put('/mastery', authenticate, F, ctrl.putMastery);

learnRouter.get('/quizzes', authenticate, R, ctrl.getQuizzes);
learnRouter.post('/quizzes', authenticate, F, ctrl.postQuiz);

learnRouter.get('/quiz-questions', authenticate, R, ctrl.getQuizQuestions);
learnRouter.post('/quiz-questions', authenticate, F, ctrl.postQuizQuestion);

learnRouter.get('/quiz-attempts', authenticate, R, ctrl.getQuizAttempts);
learnRouter.post('/quiz-attempts', authenticate, F, ctrl.postQuizAttempt);
learnRouter.patch('/quiz-attempts/:id/complete', authenticate, F, ctrl.patchCompleteQuizAttempt);

learnRouter.get('/observations', authenticate, R, ctrl.getObservations);
learnRouter.post('/observations', authenticate, F, ctrl.postObservation);

learnRouter.get('/reading-records', authenticate, R, ctrl.getReadingRecords);
learnRouter.post('/reading-records', authenticate, F, ctrl.postReadingRecord);

learnRouter.get('/resources', authenticate, R, ctrl.getResources);
learnRouter.post('/resources', authenticate, F, ctrl.postResource);

learnRouter.get('/summary', authenticate, R, ctrl.getSummary);
