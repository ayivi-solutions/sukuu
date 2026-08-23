import { prisma } from '../../lib/prisma';

export async function listCourses(schoolId: string) { return prisma.learnCourse.findMany({ where: { school_id: schoolId } }); }
export async function createCourse(schoolId: string, data: any) {
  return prisma.learnCourse.create({ data: { school_id: schoolId, subject_id: data.subjectId, teacher_id: data.teacherId, class_id: data.classId, stream_id: data.streamId || null, academic_year_id: data.academicYearId, title: data.title, description: data.description } });
}
export async function getCourseSchoolId(id: string) { return (await prisma.learnCourse.findUnique({ where: { id } }))?.school_id; }

export async function listLessonPlans(schoolId: string, courseId?: string) { return prisma.learnLessonPlan.findMany({ where: { school_id: schoolId, ...(courseId && { course_id: courseId }) } }); }
export async function createLessonPlan(schoolId: string, data: any) {
  return prisma.learnLessonPlan.create({ data: { school_id: schoolId, course_id: data.courseId, topic: data.topic, objectives: data.objectives, lesson_date: data.lessonDate, duration_minutes: data.durationMinutes ? Number(data.durationMinutes) : null, notes: data.notes } });
}
export async function getLessonPlanSchoolId(id: string) { return (await prisma.learnLessonPlan.findUnique({ where: { id } }))?.school_id; }

export async function listTopicDeliveries(schoolId: string, lessonPlanId?: string) { return prisma.learnTopicDelivery.findMany({ where: { school_id: schoolId, ...(lessonPlanId && { lesson_plan_id: lessonPlanId }) } }); }
export async function createTopicDelivery(schoolId: string, data: any) {
  return prisma.learnTopicDelivery.create({ data: { school_id: schoolId, lesson_plan_id: data.lessonPlanId, curriculum_topic_id: data.curriculumTopicId, delivery_status: data.deliveryStatus || 'PLANNED', teacher_notes: data.teacherNotes } });
}
export async function updateTopicDeliveryStatus(id: string, status: string) { return prisma.learnTopicDelivery.update({ where: { id }, data: { delivery_status: status as any, delivered_at: status === 'DELIVERED' ? new Date() : undefined } }); }
export async function getTopicDeliverySchoolId(id: string) { return (await prisma.learnTopicDelivery.findUnique({ where: { id } }))?.school_id; }

export async function listAssignments(schoolId: string, courseId?: string) { return prisma.learnAssignment.findMany({ where: { school_id: schoolId, ...(courseId && { course_id: courseId }) } }); }
export async function createAssignment(schoolId: string, data: any) {
  return prisma.learnAssignment.create({ data: { school_id: schoolId, course_id: data.courseId, title: data.title, instructions: data.instructions, due_date: data.dueDate, max_score: data.maxScore } });
}
export async function getAssignmentSchoolId(id: string) { return (await prisma.learnAssignment.findUnique({ where: { id } }))?.school_id; }

export async function listSubmissions(schoolId: string, assignmentId?: string) { return prisma.learnSubmission.findMany({ where: { school_id: schoolId, ...(assignmentId && { assignment_id: assignmentId }) } }); }
export async function createSubmission(schoolId: string, data: any) {
  return prisma.learnSubmission.create({ data: { school_id: schoolId, assignment_id: data.assignmentId, student_id: data.studentId, submission_file: data.submissionFile, submitted_at: new Date() } });
}
export async function gradeSubmission(id: string, score: number, feedback?: string) { return prisma.learnSubmission.update({ where: { id }, data: { score, feedback } }); }
export async function getSubmissionSchoolId(id: string) { return (await prisma.learnSubmission.findUnique({ where: { id } }))?.school_id; }

export async function listHomeworkReturns(schoolId: string, assignmentId?: string) { return prisma.learnHomeworkReturn.findMany({ where: { school_id: schoolId, ...(assignmentId && { assignment_id: assignmentId }) } }); }
export async function createHomeworkReturn(schoolId: string, markedBy: string, data: any) {
  return prisma.learnHomeworkReturn.create({ data: { school_id: schoolId, assignment_id: data.assignmentId, student_id: data.studentId, returned: !!data.returned, return_date: data.returnDate, teacher_comment: data.teacherComment, marked_by: markedBy, marked_at: new Date() } });
}
export async function getHomeworkReturnSchoolId(id: string) { return (await prisma.learnHomeworkReturn.findUnique({ where: { id } }))?.school_id; }

export async function listMastery(schoolId: string, studentId?: string) { return prisma.learnStudentMastery.findMany({ where: { school_id: schoolId, ...(studentId && { student_id: studentId }) } }); }
export async function upsertMastery(schoolId: string, data: any) {
  const existing = await prisma.learnStudentMastery.findFirst({ where: { school_id: schoolId, student_id: data.studentId, curriculum_topic_id: data.curriculumTopicId } });
  if (existing) return prisma.learnStudentMastery.update({ where: { id: existing.id }, data: { mastery_state: data.masteryState, last_assessment_score: data.lastAssessmentScore, flagged_for_sukuu_kids: !!data.flaggedForSukuuKids } });
  return prisma.learnStudentMastery.create({ data: { school_id: schoolId, student_id: data.studentId, curriculum_topic_id: data.curriculumTopicId, mastery_state: data.masteryState || 'EMERGING', last_assessment_score: data.lastAssessmentScore, flagged_for_sukuu_kids: !!data.flaggedForSukuuKids } });
}
export async function getMasterySchoolId(id: string) { return (await prisma.learnStudentMastery.findUnique({ where: { id } }))?.school_id; }

export async function listQuizzes(schoolId: string, courseId?: string) { return prisma.learnQuiz.findMany({ where: { school_id: schoolId, ...(courseId && { course_id: courseId }) } }); }
export async function createQuiz(schoolId: string, data: any) {
  return prisma.learnQuiz.create({ data: { school_id: schoolId, course_id: data.courseId, title: data.title, time_limit: data.timeLimit ? Number(data.timeLimit) : null, attempt_limit: data.attemptLimit || 1 } });
}
export async function getQuizSchoolId(id: string) { return (await prisma.learnQuiz.findUnique({ where: { id } }))?.school_id; }

export async function listQuizQuestions(schoolId: string, quizId?: string) { return prisma.learnQuizQuestion.findMany({ where: { school_id: schoolId, ...(quizId && { quiz_id: quizId }) } }); }
export async function createQuizQuestion(schoolId: string, data: any) {
  return prisma.learnQuizQuestion.create({ data: { school_id: schoolId, quiz_id: data.quizId, question_text: data.questionText, question_type: data.questionType, marks: data.marks } });
}
export async function getQuizQuestionSchoolId(id: string) { return (await prisma.learnQuizQuestion.findUnique({ where: { id } }))?.school_id; }

export async function listQuizAttempts(schoolId: string, quizId?: string) { return prisma.learnQuizAttempt.findMany({ where: { school_id: schoolId, ...(quizId && { quiz_id: quizId }) } }); }
export async function createQuizAttempt(schoolId: string, data: any) {
  return prisma.learnQuizAttempt.create({ data: { school_id: schoolId, quiz_id: data.quizId, student_id: data.studentId, started_at: new Date() } });
}
export async function completeQuizAttempt(id: string, score: number) { return prisma.learnQuizAttempt.update({ where: { id }, data: { score, completed_at: new Date() } }); }
export async function getQuizAttemptSchoolId(id: string) { return (await prisma.learnQuizAttempt.findUnique({ where: { id } }))?.school_id; }

export async function listObservations(schoolId: string, teacherId?: string) { return prisma.learnClassroomObservation.findMany({ where: { school_id: schoolId, ...(teacherId && { teacher_id: teacherId }) } }); }
export async function createObservation(schoolId: string, observerId: string, data: any) {
  return prisma.learnClassroomObservation.create({ data: { school_id: schoolId, lesson_plan_id: data.lessonPlanId, observer_id: observerId, teacher_id: data.teacherId, observation_date: data.observationDate, rating: data.rating, strengths: data.strengths, areas_for_improvement: data.areasForImprovement, feedback_shared: !!data.feedbackShared } });
}
export async function getObservationSchoolId(id: string) { return (await prisma.learnClassroomObservation.findUnique({ where: { id } }))?.school_id; }

export async function listReadingRecords(schoolId: string, studentId?: string) { return prisma.learnReadingRecord.findMany({ where: { school_id: schoolId, ...(studentId && { student_id: studentId }) } }); }
export async function createReadingRecord(schoolId: string, teacherId: string, data: any) {
  return prisma.learnReadingRecord.create({ data: { school_id: schoolId, student_id: data.studentId, teacher_id: teacherId, reading_level: data.readingLevel, book_title: data.bookTitle, completed: !!data.completed, assessment_notes: data.assessmentNotes, recorded_date: data.recordedDate, academic_year_id: data.academicYearId } });
}
export async function getReadingRecordSchoolId(id: string) { return (await prisma.learnReadingRecord.findUnique({ where: { id } }))?.school_id; }

export async function listResources(schoolId: string, courseId?: string) { return prisma.learnResource.findMany({ where: { school_id: schoolId, ...(courseId && { course_id: courseId }) } }); }
export async function createResource(schoolId: string, data: any) {
  return prisma.learnResource.create({ data: { school_id: schoolId, course_id: data.courseId, title: data.title, resource_type: data.resourceType, file_url: data.fileUrl, external_url: data.externalUrl, uploaded_at: new Date() } });
}
export async function getResourceSchoolId(id: string) { return (await prisma.learnResource.findUnique({ where: { id } }))?.school_id; }

export async function getLearnSummary(schoolId: string) {
  const [courseCount, lessonsPlanned, lessonsDelivered, assignmentCount, pendingSubmissions, masteredCount, developingCount] = await Promise.all([
    prisma.learnCourse.count({ where: { school_id: schoolId } }),
    prisma.learnLessonPlan.count({ where: { school_id: schoolId } }),
    prisma.learnTopicDelivery.count({ where: { school_id: schoolId, delivery_status: 'DELIVERED' } }),
    prisma.learnAssignment.count({ where: { school_id: schoolId } }),
    prisma.learnSubmission.count({ where: { school_id: schoolId, score: null } }),
    prisma.learnStudentMastery.count({ where: { school_id: schoolId, mastery_state: 'MASTERED' } }),
    prisma.learnStudentMastery.count({ where: { school_id: schoolId, mastery_state: { in: ['EMERGING', 'DEVELOPING'] } } }),
  ]);
  return { courseCount, lessonsPlanned, lessonsDelivered, assignmentCount, pendingSubmissions, masteredCount, developingCount };
}
