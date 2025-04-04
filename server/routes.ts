import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import session from "express-session";
import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import MemoryStore from "memorystore";
import { 
  insertUserSchema, 
  insertCourseSchema, 
  insertEnrollmentSchema, 
  insertAssignmentSchema, 
  insertSubmissionSchema, 
  loginSchema,
  insertActivitySchema
} from "@shared/schema";

export async function registerRoutes(app: Express): Promise<Server> {
  const httpServer = createServer(app);

  // Setup session storage
  const SessionStore = MemoryStore(session);
  app.use(
    session({
      secret: process.env.SESSION_SECRET || "edulearn-secret-key",
      resave: false,
      saveUninitialized: false,
      cookie: { secure: process.env.NODE_ENV === "production", maxAge: 24 * 60 * 60 * 1000 },
      store: new SessionStore({
        checkPeriod: 86400000, // 24 hours
      }),
    })
  );

  // Setup passport authentication
  app.use(passport.initialize());
  app.use(passport.session());

  // Configure passport local strategy
  passport.use(
    new LocalStrategy(async (username, password, done) => {
      try {
        const user = await storage.getUserByUsername(username);
        if (!user) {
          return done(null, false, { message: "Incorrect username or password" });
        }
        if (user.password !== password) { // Note: In production, use proper password hashing
          return done(null, false, { message: "Incorrect username or password" });
        }
        return done(null, user);
      } catch (error) {
        return done(error);
      }
    })
  );

  // Serialize and deserialize user
  passport.serializeUser((user: any, done) => {
    done(null, user.id);
  });

  passport.deserializeUser(async (id: number, done) => {
    try {
      const user = await storage.getUser(id);
      done(null, user);
    } catch (error) {
      done(error);
    }
  });

  // Middleware to check if user is authenticated
  const isAuthenticated = (req: Request, res: Response, next: any) => {
    if (req.isAuthenticated()) {
      return next();
    }
    res.status(401).json({ message: "Unauthorized" });
  };

  // Middleware to check if user has required role
  const hasRole = (roles: string[]) => {
    return (req: Request, res: Response, next: any) => {
      const user = req.user as any;
      if (!user || !roles.includes(user.role)) {
        return res.status(403).json({ message: "Forbidden" });
      }
      next();
    };
  };

  // Authentication routes
  app.post("/api/auth/login", (req, res, next) => {
    try {
      const result = loginSchema.safeParse(req.body);
      if (!result.success) {
        return res.status(400).json({ message: "Invalid credentials format" });
      }
      
      passport.authenticate("local", (err: any, user: any, info: any) => {
        if (err) return next(err);
        if (!user) return res.status(401).json({ message: info.message });
        
        req.logIn(user, async (err) => {
          if (err) return next(err);
          
          // Log activity
          try {
            await storage.createActivity({
              userId: user.id,
              action: "Login",
              detail: `User ${user.username} logged in`
            });
          } catch (activityError) {
            console.error("Failed to log activity:", activityError);
          }
          
          return res.json({ 
            id: user.id,
            username: user.username,
            firstName: user.firstName,
            lastName: user.lastName,
            email: user.email,
            role: user.role,
            profileImage: user.profileImage
          });
        });
      })(req, res, next);
    } catch (error) {
      next(error);
    }
  });

  app.post("/api/auth/register", async (req, res, next) => {
    try {
      const result = insertUserSchema.safeParse(req.body);
      if (!result.success) {
        return res.status(400).json({ message: "Invalid user data", errors: result.error.errors });
      }
      
      // Check if username or email already exists
      const existingUsername = await storage.getUserByUsername(result.data.username);
      if (existingUsername) {
        return res.status(400).json({ message: "Username already exists" });
      }
      
      const newUser = await storage.createUser(result.data);
      
      // Auto login after registration
      req.logIn(newUser, async (err) => {
        if (err) return next(err);
        
        // Log activity
        await storage.createActivity({
          userId: newUser.id,
          action: "Registration",
          detail: `New user registered: ${newUser.username}`
        });
        
        return res.status(201).json({ 
          id: newUser.id,
          username: newUser.username,
          firstName: newUser.firstName,
          lastName: newUser.lastName,
          email: newUser.email,
          role: newUser.role,
          profileImage: newUser.profileImage
        });
      });
    } catch (error) {
      next(error);
    }
  });

  app.get("/api/auth/session", (req, res) => {
    if (req.isAuthenticated()) {
      const user = req.user as any;
      return res.json({ 
        id: user.id,
        username: user.username,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        role: user.role,
        profileImage: user.profileImage
      });
    }
    res.status(401).json({ message: "Not authenticated" });
  });

  app.post("/api/auth/logout", (req, res) => {
    req.logout((err) => {
      if (err) {
        return res.status(500).json({ message: "Logout failed" });
      }
      res.json({ message: "Logged out successfully" });
    });
  });

  // User management routes
  app.get("/api/users", isAuthenticated, hasRole(["admin"]), async (req, res, next) => {
    try {
      const users = await storage.getAllUsers();
      res.json(users.map(user => ({
        ...user,
        password: undefined // Don't send passwords to client
      })));
    } catch (error) {
      next(error);
    }
  });

  app.get("/api/users/:id", isAuthenticated, async (req, res, next) => {
    try {
      const user = await storage.getUser(parseInt(req.params.id));
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      // Only allow users to access their own data unless they're an admin
      const currentUser = req.user as any;
      if (currentUser.role !== "admin" && currentUser.id !== user.id) {
        return res.status(403).json({ message: "Forbidden" });
      }
      
      res.json({
        ...user,
        password: undefined
      });
    } catch (error) {
      next(error);
    }
  });

  app.put("/api/users/:id", isAuthenticated, async (req, res, next) => {
    try {
      const userId = parseInt(req.params.id);
      const currentUser = req.user as any;
      
      // Only allow users to update their own data unless they're an admin
      if (currentUser.role !== "admin" && currentUser.id !== userId) {
        return res.status(403).json({ message: "Forbidden" });
      }
      
      // Don't allow role changes unless admin
      if (req.body.role && currentUser.role !== "admin") {
        delete req.body.role;
      }
      
      const updatedUser = await storage.updateUser(userId, req.body);
      if (!updatedUser) {
        return res.status(404).json({ message: "User not found" });
      }
      
      res.json({
        ...updatedUser,
        password: undefined
      });
    } catch (error) {
      next(error);
    }
  });

  app.delete("/api/users/:id", isAuthenticated, hasRole(["admin"]), async (req, res, next) => {
    try {
      const userId = parseInt(req.params.id);
      const success = await storage.deleteUser(userId);
      if (!success) {
        return res.status(404).json({ message: "User not found" });
      }
      res.json({ message: "User deleted successfully" });
    } catch (error) {
      next(error);
    }
  });

  // Course management routes
  app.get("/api/courses", async (req, res, next) => {
    try {
      let courses;
      // Filter by faculty if requested
      if (req.query.facultyId) {
        courses = await storage.getCoursesByFaculty(parseInt(req.query.facultyId as string));
      } else if (req.query.active === 'true') {
        courses = await storage.getActiveCourses();
      } else {
        courses = await storage.getAllCourses();
      }
      res.json(courses);
    } catch (error) {
      next(error);
    }
  });

  app.get("/api/courses/:id", async (req, res, next) => {
    try {
      const course = await storage.getCourse(parseInt(req.params.id));
      if (!course) {
        return res.status(404).json({ message: "Course not found" });
      }
      res.json(course);
    } catch (error) {
      next(error);
    }
  });

  app.post("/api/courses", isAuthenticated, hasRole(["admin", "faculty"]), async (req, res, next) => {
    try {
      const result = insertCourseSchema.safeParse(req.body);
      if (!result.success) {
        return res.status(400).json({ message: "Invalid course data", errors: result.error.errors });
      }
      
      const newCourse = await storage.createCourse(result.data);
      
      // Log activity
      const user = req.user as any;
      await storage.createActivity({
        userId: user.id,
        action: "Course Created",
        detail: `Created course: ${newCourse.title}`
      });
      
      res.status(201).json(newCourse);
    } catch (error) {
      next(error);
    }
  });

  app.put("/api/courses/:id", isAuthenticated, async (req, res, next) => {
    try {
      const courseId = parseInt(req.params.id);
      const course = await storage.getCourse(courseId);
      if (!course) {
        return res.status(404).json({ message: "Course not found" });
      }
      
      const user = req.user as any;
      // Only allow faculty who owns the course or admins to update
      if (user.role !== "admin" && (user.role !== "faculty" || course.facultyId !== user.id)) {
        return res.status(403).json({ message: "Forbidden" });
      }
      
      const updatedCourse = await storage.updateCourse(courseId, req.body);
      
      // Log activity
      await storage.createActivity({
        userId: user.id,
        action: "Course Updated",
        detail: `Updated course: ${updatedCourse?.title}`
      });
      
      res.json(updatedCourse);
    } catch (error) {
      next(error);
    }
  });

  app.delete("/api/courses/:id", isAuthenticated, hasRole(["admin"]), async (req, res, next) => {
    try {
      const courseId = parseInt(req.params.id);
      const success = await storage.deleteCourse(courseId);
      if (!success) {
        return res.status(404).json({ message: "Course not found" });
      }
      
      // Log activity
      const user = req.user as any;
      await storage.createActivity({
        userId: user.id,
        action: "Course Deleted",
        detail: `Deleted course ID: ${courseId}`
      });
      
      res.json({ message: "Course deleted successfully" });
    } catch (error) {
      next(error);
    }
  });

  // Enrollment routes
  app.get("/api/enrollments", isAuthenticated, async (req, res, next) => {
    try {
      let enrollments;
      
      if (req.query.studentId) {
        enrollments = await storage.getEnrollmentsByStudent(parseInt(req.query.studentId as string));
      } else if (req.query.courseId) {
        enrollments = await storage.getEnrollmentsByCourse(parseInt(req.query.courseId as string));
      } else {
        return res.status(400).json({ message: "Either studentId or courseId query parameter is required" });
      }
      
      res.json(enrollments);
    } catch (error) {
      next(error);
    }
  });

  app.post("/api/enrollments", isAuthenticated, async (req, res, next) => {
    try {
      const result = insertEnrollmentSchema.safeParse(req.body);
      if (!result.success) {
        return res.status(400).json({ message: "Invalid enrollment data", errors: result.error.errors });
      }
      
      const user = req.user as any;
      // Only allow students to enroll themselves or admins to enroll anyone
      if (user.role === "student" && result.data.studentId !== user.id) {
        return res.status(403).json({ message: "Students can only enroll themselves" });
      }
      
      const newEnrollment = await storage.createEnrollment(result.data);
      
      // Log activity
      await storage.createActivity({
        userId: user.id,
        action: "Course Enrollment",
        detail: `Enrolled in course ID: ${newEnrollment.courseId}`
      });
      
      res.status(201).json(newEnrollment);
    } catch (error) {
      next(error);
    }
  });

  app.put("/api/enrollments/:id", isAuthenticated, async (req, res, next) => {
    try {
      const enrollmentId = parseInt(req.params.id);
      const enrollment = await storage.getEnrollment(enrollmentId);
      if (!enrollment) {
        return res.status(404).json({ message: "Enrollment not found" });
      }
      
      const user = req.user as any;
      // Students can only update their own progress, faculty/admin can update any
      if (user.role === "student" && enrollment.studentId !== user.id) {
        return res.status(403).json({ message: "Forbidden" });
      }
      
      const updatedEnrollment = await storage.updateEnrollment(enrollmentId, req.body);
      res.json(updatedEnrollment);
    } catch (error) {
      next(error);
    }
  });

  app.delete("/api/enrollments/:id", isAuthenticated, async (req, res, next) => {
    try {
      const enrollmentId = parseInt(req.params.id);
      const enrollment = await storage.getEnrollment(enrollmentId);
      if (!enrollment) {
        return res.status(404).json({ message: "Enrollment not found" });
      }
      
      const user = req.user as any;
      // Only allow students to unenroll themselves or admins to unenroll anyone
      if (user.role === "student" && enrollment.studentId !== user.id) {
        return res.status(403).json({ message: "Students can only unenroll themselves" });
      }
      
      const success = await storage.deleteEnrollment(enrollmentId);
      
      // Log activity
      await storage.createActivity({
        userId: user.id,
        action: "Course Unenrollment",
        detail: `Unenrolled from course ID: ${enrollment.courseId}`
      });
      
      res.json({ message: "Enrollment deleted successfully" });
    } catch (error) {
      next(error);
    }
  });

  // Assignment routes
  app.get("/api/assignments", async (req, res, next) => {
    try {
      if (!req.query.courseId) {
        return res.status(400).json({ message: "courseId query parameter is required" });
      }
      
      const assignments = await storage.getAssignmentsByCourse(parseInt(req.query.courseId as string));
      res.json(assignments);
    } catch (error) {
      next(error);
    }
  });

  app.get("/api/assignments/:id", async (req, res, next) => {
    try {
      const assignment = await storage.getAssignment(parseInt(req.params.id));
      if (!assignment) {
        return res.status(404).json({ message: "Assignment not found" });
      }
      res.json(assignment);
    } catch (error) {
      next(error);
    }
  });

  app.post("/api/assignments", isAuthenticated, hasRole(["admin", "faculty"]), async (req, res, next) => {
    try {
      const result = insertAssignmentSchema.safeParse(req.body);
      if (!result.success) {
        return res.status(400).json({ message: "Invalid assignment data", errors: result.error.errors });
      }
      
      // Verify the course exists
      const course = await storage.getCourse(result.data.courseId);
      if (!course) {
        return res.status(404).json({ message: "Course not found" });
      }
      
      const user = req.user as any;
      // Faculty can only create assignments for their own courses
      if (user.role === "faculty" && course.facultyId !== user.id) {
        return res.status(403).json({ message: "Faculty can only create assignments for their own courses" });
      }
      
      const newAssignment = await storage.createAssignment(result.data);
      
      // Log activity
      await storage.createActivity({
        userId: user.id,
        action: "Assignment Created",
        detail: `Created assignment: ${newAssignment.title}`
      });
      
      res.status(201).json(newAssignment);
    } catch (error) {
      next(error);
    }
  });

  app.put("/api/assignments/:id", isAuthenticated, hasRole(["admin", "faculty"]), async (req, res, next) => {
    try {
      const assignmentId = parseInt(req.params.id);
      const assignment = await storage.getAssignment(assignmentId);
      if (!assignment) {
        return res.status(404).json({ message: "Assignment not found" });
      }
      
      // Verify course ownership for faculty
      const user = req.user as any;
      if (user.role === "faculty") {
        const course = await storage.getCourse(assignment.courseId);
        if (!course || course.facultyId !== user.id) {
          return res.status(403).json({ message: "Faculty can only update assignments for their own courses" });
        }
      }
      
      const updatedAssignment = await storage.updateAssignment(assignmentId, req.body);
      
      // Log activity
      await storage.createActivity({
        userId: user.id,
        action: "Assignment Updated",
        detail: `Updated assignment: ${updatedAssignment?.title}`
      });
      
      res.json(updatedAssignment);
    } catch (error) {
      next(error);
    }
  });

  app.delete("/api/assignments/:id", isAuthenticated, hasRole(["admin", "faculty"]), async (req, res, next) => {
    try {
      const assignmentId = parseInt(req.params.id);
      const assignment = await storage.getAssignment(assignmentId);
      if (!assignment) {
        return res.status(404).json({ message: "Assignment not found" });
      }
      
      // Verify course ownership for faculty
      const user = req.user as any;
      if (user.role === "faculty") {
        const course = await storage.getCourse(assignment.courseId);
        if (!course || course.facultyId !== user.id) {
          return res.status(403).json({ message: "Faculty can only delete assignments for their own courses" });
        }
      }
      
      const success = await storage.deleteAssignment(assignmentId);
      
      // Log activity
      await storage.createActivity({
        userId: user.id,
        action: "Assignment Deleted",
        detail: `Deleted assignment ID: ${assignmentId}`
      });
      
      res.json({ message: "Assignment deleted successfully" });
    } catch (error) {
      next(error);
    }
  });

  // Submission routes
  app.get("/api/submissions", isAuthenticated, async (req, res, next) => {
    try {
      let submissions;
      
      if (req.query.assignmentId) {
        submissions = await storage.getSubmissionsByAssignment(parseInt(req.query.assignmentId as string));
      } else if (req.query.studentId) {
        submissions = await storage.getSubmissionsByStudent(parseInt(req.query.studentId as string));
      } else {
        return res.status(400).json({ message: "Either assignmentId or studentId query parameter is required" });
      }
      
      // Filter based on user role
      const user = req.user as any;
      if (user.role === "student") {
        // Students can only see their own submissions
        submissions = submissions.filter(sub => sub.studentId === user.id);
      } else if (user.role === "faculty") {
        // Faculty can only see submissions for assignments in their courses
        const assignmentIds = new Set();
        for (const submission of submissions) {
          const assignment = await storage.getAssignment(submission.assignmentId);
          if (assignment) {
            const course = await storage.getCourse(assignment.courseId);
            if (course && course.facultyId === user.id) {
              assignmentIds.add(submission.assignmentId);
            }
          }
        }
        submissions = submissions.filter(sub => assignmentIds.has(sub.assignmentId));
      }
      
      res.json(submissions);
    } catch (error) {
      next(error);
    }
  });

  app.post("/api/submissions", isAuthenticated, async (req, res, next) => {
    try {
      const result = insertSubmissionSchema.safeParse(req.body);
      if (!result.success) {
        return res.status(400).json({ message: "Invalid submission data", errors: result.error.errors });
      }
      
      const user = req.user as any;
      // Students can only submit assignments for themselves
      if (user.role === "student" && result.data.studentId !== user.id) {
        return res.status(403).json({ message: "Students can only submit assignments for themselves" });
      }
      
      // Verify the assignment exists
      const assignment = await storage.getAssignment(result.data.assignmentId);
      if (!assignment) {
        return res.status(404).json({ message: "Assignment not found" });
      }
      
      // Check if the student is enrolled in the course
      const enrollments = await storage.getEnrollmentsByStudent(result.data.studentId);
      const isEnrolled = enrollments.some(e => e.courseId === assignment.courseId);
      if (!isEnrolled) {
        return res.status(403).json({ message: "Student is not enrolled in this course" });
      }
      
      // Create the submission
      const newSubmission = await storage.createSubmission(result.data);
      
      // Log activity
      await storage.createActivity({
        userId: user.id,
        action: "Assignment Submission",
        detail: `Submitted assignment: ${assignment.title}`
      });
      
      res.status(201).json(newSubmission);
    } catch (error) {
      next(error);
    }
  });

  app.put("/api/submissions/:id", isAuthenticated, async (req, res, next) => {
    try {
      const submissionId = parseInt(req.params.id);
      const submission = await storage.getSubmission(submissionId);
      if (!submission) {
        return res.status(404).json({ message: "Submission not found" });
      }
      
      const user = req.user as any;
      
      // Role-based permissions
      if (user.role === "student") {
        // Students can only update their own submissions and can't update score/feedback
        if (submission.studentId !== user.id) {
          return res.status(403).json({ message: "Students can only update their own submissions" });
        }
        
        // Remove score and feedback from update data
        delete req.body.score;
        delete req.body.feedback;
      } else if (user.role === "faculty") {
        // Faculty can only grade assignments for their courses
        const assignment = await storage.getAssignment(submission.assignmentId);
        if (assignment) {
          const course = await storage.getCourse(assignment.courseId);
          if (!course || course.facultyId !== user.id) {
            return res.status(403).json({ message: "Faculty can only grade assignments for their own courses" });
          }
        }
        
        // Faculty can only update score and feedback
        const allowedFields = ["score", "feedback"];
        Object.keys(req.body).forEach(key => {
          if (!allowedFields.includes(key)) {
            delete req.body[key];
          }
        });
      }
      
      const updatedSubmission = await storage.updateSubmission(submissionId, req.body);
      
      // Log activity (only for grading)
      if (req.body.score !== undefined) {
        await storage.createActivity({
          userId: user.id,
          action: "Submission Graded",
          detail: `Graded submission ID: ${submissionId} with score: ${req.body.score}`
        });
      }
      
      res.json(updatedSubmission);
    } catch (error) {
      next(error);
    }
  });

  // Analytics routes
  app.get("/api/analytics/enrollment-stats", isAuthenticated, async (req, res, next) => {
    try {
      const stats = await storage.getEnrollmentStats();
      res.json(stats);
    } catch (error) {
      next(error);
    }
  });

  app.get("/api/analytics/user-distribution", isAuthenticated, async (req, res, next) => {
    try {
      const distribution = await storage.getUserDistribution();
      res.json(distribution);
    } catch (error) {
      next(error);
    }
  });

  app.get("/api/analytics/completion-rate", isAuthenticated, async (req, res, next) => {
    try {
      const rate = await storage.getCompletionRate();
      res.json({ rate });
    } catch (error) {
      next(error);
    }
  });

  app.get("/api/analytics/popular-courses", isAuthenticated, async (req, res, next) => {
    try {
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 3;
      const courses = await storage.getPopularCourses(limit);
      res.json(courses);
    } catch (error) {
      next(error);
    }
  });

  // Activity routes
  app.get("/api/activities", isAuthenticated, async (req, res, next) => {
    try {
      if (req.query.userId) {
        const activities = await storage.getActivitiesByUser(parseInt(req.query.userId as string));
        res.json(activities);
      } else {
        const limit = req.query.limit ? parseInt(req.query.limit as string) : 10;
        const activities = await storage.getRecentActivities(limit);
        res.json(activities);
      }
    } catch (error) {
      next(error);
    }
  });

  app.post("/api/activities", isAuthenticated, async (req, res, next) => {
    try {
      const result = insertActivitySchema.safeParse(req.body);
      if (!result.success) {
        return res.status(400).json({ message: "Invalid activity data", errors: result.error.errors });
      }
      
      const user = req.user as any;
      // Can only create activities for self unless admin
      if (user.role !== "admin" && result.data.userId !== user.id) {
        return res.status(403).json({ message: "Can only create activities for yourself" });
      }
      
      const newActivity = await storage.createActivity(result.data);
      res.status(201).json(newActivity);
    } catch (error) {
      next(error);
    }
  });

  return httpServer;
}
