import { pgTable, text, serial, integer, boolean, timestamp, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { relations } from 'drizzle-orm';

// User schema with role-based access
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  email: text("email").notNull(),
  firstName: text("first_name").notNull(),
  lastName: text("last_name").notNull(),
  role: text("role", { enum: ["admin", "faculty", "student"] }).notNull().default("student"),
  profileImage: text("profile_image"),
  department: text("department"),
  bio: text("bio"),
});

// Course schema
export const courses = pgTable("courses", {
  id: serial("id").primaryKey(),
  code: text("code").notNull().unique(),
  name: text("name").notNull(),
  description: text("description"),
  facultyId: integer("faculty_id").notNull(),
  semester: text("semester").notNull(),
  year: integer("year").notNull(),
  status: text("status", { enum: ["active", "inactive", "pending"] }).notNull().default("active"),
  startDate: timestamp("start_date").notNull(),
  endDate: timestamp("end_date").notNull(),
  thumbnail: text("thumbnail"),
});

// Course enrollment schema linking students to courses
export const enrollments = pgTable("enrollments", {
  id: serial("id").primaryKey(),
  studentId: integer("student_id").notNull(),
  courseId: integer("course_id").notNull(),
  enrollmentDate: timestamp("enrollment_date").notNull().defaultNow(),
  progress: integer("progress").notNull().default(0),
  grade: text("grade"),
  status: text("status", { enum: ["active", "completed", "dropped"] }).notNull().default("active"),
});

// Assignments schema
export const assignments = pgTable("assignments", {
  id: serial("id").primaryKey(),
  courseId: integer("course_id").notNull(),
  title: text("title").notNull(),
  description: text("description"),
  dueDate: timestamp("due_date").notNull(),
  totalPoints: integer("total_points").notNull().default(100),
  status: text("status", { enum: ["draft", "published", "closed"] }).notNull().default("draft"),
  type: text("type", { enum: ["assignment", "quiz", "exam", "project"] }).notNull(),
  instructions: text("instructions"),
});

// Assignment submissions schema
export const submissions = pgTable("submissions", {
  id: serial("id").primaryKey(),
  assignmentId: integer("assignment_id").notNull(),
  studentId: integer("student_id").notNull(),
  submissionDate: timestamp("submission_date").notNull().defaultNow(),
  content: text("content"),
  fileUrl: text("file_url"),
  grade: integer("grade"),
  feedback: text("feedback"),
  status: text("status", { enum: ["submitted", "graded", "late", "resubmitted"] }).notNull().default("submitted"),
});

// Announcements schema
export const announcements = pgTable("announcements", {
  id: serial("id").primaryKey(),
  courseId: integer("course_id"),
  userId: integer("user_id").notNull(),
  title: text("title").notNull(),
  content: text("content").notNull(),
  datePosted: timestamp("date_posted").notNull().defaultNow(),
  isGlobal: boolean("is_global").notNull().default(false),
});

// Create insert schemas
export const insertUserSchema = createInsertSchema(users).omit({ id: true });
export const insertCourseSchema = createInsertSchema(courses).omit({ id: true });
export const insertEnrollmentSchema = createInsertSchema(enrollments).omit({ id: true, enrollmentDate: true });
export const insertAssignmentSchema = createInsertSchema(assignments).omit({ id: true });
export const insertSubmissionSchema = createInsertSchema(submissions).omit({ id: true, submissionDate: true });
export const insertAnnouncementSchema = createInsertSchema(announcements).omit({ id: true, datePosted: true });

// Create types for inserting and selecting from tables
export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

export type InsertCourse = z.infer<typeof insertCourseSchema>;
export type Course = typeof courses.$inferSelect;

export type InsertEnrollment = z.infer<typeof insertEnrollmentSchema>;
export type Enrollment = typeof enrollments.$inferSelect;

export type InsertAssignment = z.infer<typeof insertAssignmentSchema>;
export type Assignment = typeof assignments.$inferSelect;

export type InsertSubmission = z.infer<typeof insertSubmissionSchema>;
export type Submission = typeof submissions.$inferSelect;

export type InsertAnnouncement = z.infer<typeof insertAnnouncementSchema>;
export type Announcement = typeof announcements.$inferSelect;

// Define relations
export const usersRelations = relations(users, ({ many }) => ({
  taughtCourses: many(courses, { relationName: "faculty" }),
  enrollments: many(enrollments, { relationName: "student" }),
  submissions: many(submissions, { relationName: "student" }),
  announcements: many(announcements, { relationName: "author" })
}));

export const coursesRelations = relations(courses, ({ one, many }) => ({
  faculty: one(users, {
    fields: [courses.facultyId],
    references: [users.id],
    relationName: "faculty"
  }),
  enrollments: many(enrollments),
  assignments: many(assignments),
  announcements: many(announcements)
}));

export const enrollmentsRelations = relations(enrollments, ({ one }) => ({
  student: one(users, {
    fields: [enrollments.studentId],
    references: [users.id],
    relationName: "student"
  }),
  course: one(courses, {
    fields: [enrollments.courseId],
    references: [courses.id]
  })
}));

export const assignmentsRelations = relations(assignments, ({ one, many }) => ({
  course: one(courses, {
    fields: [assignments.courseId],
    references: [courses.id]
  }),
  submissions: many(submissions)
}));

export const submissionsRelations = relations(submissions, ({ one }) => ({
  assignment: one(assignments, {
    fields: [submissions.assignmentId],
    references: [assignments.id]
  }),
  student: one(users, {
    fields: [submissions.studentId],
    references: [users.id],
    relationName: "student"
  })
}));

export const announcementsRelations = relations(announcements, ({ one }) => ({
  course: one(courses, {
    fields: [announcements.courseId],
    references: [courses.id]
  }),
  author: one(users, {
    fields: [announcements.userId],
    references: [users.id],
    relationName: "author"
  })
}));
