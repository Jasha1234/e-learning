import { pgTable, text, serial, integer, boolean, timestamp, pgEnum } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Define role enum
export const roleEnum = pgEnum('role', ['admin', 'faculty', 'student']);

// Users table
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  email: text("email").notNull().unique(),
  firstName: text("first_name").notNull(),
  lastName: text("last_name").notNull(),
  role: roleEnum("role").notNull().default('student'),
  profileImage: text("profile_image"),
});

// Courses table
export const courses = pgTable("courses", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description").notNull(),
  facultyId: integer("faculty_id").notNull(),
  isActive: boolean("is_active").notNull().default(true),
  category: text("category"),
  thumbnail: text("thumbnail"),
});

// Enrollments table
export const enrollments = pgTable("enrollments", {
  id: serial("id").primaryKey(),
  studentId: integer("student_id").notNull(),
  courseId: integer("course_id").notNull(),
  enrollmentDate: timestamp("enrollment_date").notNull().defaultNow(),
  completed: boolean("completed").notNull().default(false),
  progress: integer("progress").notNull().default(0),
});

// Assignments table
export const assignments = pgTable("assignments", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description").notNull(),
  courseId: integer("course_id").notNull(),
  dueDate: timestamp("due_date"),
  maxScore: integer("max_score").notNull().default(100),
});

// Submissions table
export const submissions = pgTable("submissions", {
  id: serial("id").primaryKey(),
  assignmentId: integer("assignment_id").notNull(),
  studentId: integer("student_id").notNull(),
  submissionDate: timestamp("submission_date").notNull().defaultNow(),
  content: text("content").notNull(),
  score: integer("score"),
  feedback: text("feedback"),
});

// Activities table
export const activities = pgTable("activities", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  action: text("action").notNull(),
  detail: text("detail").notNull(),
  timestamp: timestamp("timestamp").notNull().defaultNow(),
});

// Schema validation for inserts
export const insertUserSchema = createInsertSchema(users).omit({ id: true });
export const insertCourseSchema = createInsertSchema(courses).omit({ id: true });
export const insertEnrollmentSchema = createInsertSchema(enrollments).omit({ id: true, enrollmentDate: true });
export const insertAssignmentSchema = createInsertSchema(assignments).omit({ id: true });
export const insertSubmissionSchema = createInsertSchema(submissions).omit({ id: true, submissionDate: true });
export const insertActivitySchema = createInsertSchema(activities).omit({ id: true, timestamp: true });

// Login schema
export const loginSchema = z.object({
  username: z.string().min(1, "Username is required"),
  password: z.string().min(1, "Password is required"),
});

// Types for inserts and selects
export type InsertUser = z.infer<typeof insertUserSchema>;
export type InsertCourse = z.infer<typeof insertCourseSchema>;
export type InsertEnrollment = z.infer<typeof insertEnrollmentSchema>;
export type InsertAssignment = z.infer<typeof insertAssignmentSchema>;
export type InsertSubmission = z.infer<typeof insertSubmissionSchema>;
export type InsertActivity = z.infer<typeof insertActivitySchema>;
export type LoginCredentials = z.infer<typeof loginSchema>;

export type User = typeof users.$inferSelect;
export type Course = typeof courses.$inferSelect;
export type Enrollment = typeof enrollments.$inferSelect;
export type Assignment = typeof assignments.$inferSelect;
export type Submission = typeof submissions.$inferSelect;
export type Activity = typeof activities.$inferSelect;
