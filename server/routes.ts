import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import session from "express-session";
import memorystore from "memorystore";
import { storage } from "./storage";
import { insertUserSchema, insertCourseSchema, insertEnrollmentSchema, insertAssignmentSchema, insertSubmissionSchema, insertAnnouncementSchema } from "@shared/schema";
import { ZodError } from "zod";

const MemoryStore = memorystore(session);

export async function registerRoutes(app: Express): Promise<Server> {
  // Set up session middleware
  app.use(
    session({
      cookie: { maxAge: 86400000 },
      store: new MemoryStore({
        checkPeriod: 86400000 // prune expired entries every 24h
      }),
      resave: false,
      saveUninitialized: false,
      secret: "edulearn-secret-key" // In production, use a proper environment variable
    })
  );

  // Error handler for zod validation
  const validateRequest = (schema: any, data: any) => {
    try {
      return { data: schema.parse(data), error: null };
    } catch (error) {
      if (error instanceof ZodError) {
        return { data: null, error: error.format() };
      }
      return { data: null, error };
    }
  };

  // Middleware to check authentication
  const isAuthenticated = (req: Request, res: Response, next: any) => {
    if (req.session.userId) {
      return next();
    }
    res.status(401).json({ message: "Unauthorized" });
  };

  // Middleware to check role authorization
  const hasRole = (roles: string[]) => (req: Request, res: Response, next: any) => {
    if (!req.session.userRole || !roles.includes(req.session.userRole)) {
      return res.status(403).json({ message: "Forbidden" });
    }
    next();
  };

  // Authentication routes
  app.post("/api/auth/login", async (req, res) => {
    const { username, password } = req.body;
    
    if (!username || !password) {
      return res.status(400).json({ message: "Username and password are required" });
    }
    
    try {
      const user = await storage.getUserByUsername(username);
      
      if (!user || user.password !== password) {
        return res.status(401).json({ message: "Invalid credentials" });
      }
      
      // Set user session data
      req.session.userId = user.id;
      req.session.userRole = user.role;
      req.session.username = user.username;
      
      res.json({
        id: user.id,
        username: user.username,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        role: user.role,
        profileImage: user.profileImage
      });
    } catch (error) {
      res.status(500).json({ message: "Error during login" });
    }
  });

  app.post("/api/auth/logout", (req, res) => {
    req.session.destroy((err) => {
      if (err) {
        return res.status(500).json({ message: "Failed to logout" });
      }
      res.json({ message: "Logged out successfully" });
    });
  });

  app.get("/api/auth/me", async (req, res) => {
    if (!req.session.userId) {
      return res.status(401).json({ message: "Not authenticated" });
    }
    
    try {
      const user = await storage.getUser(req.session.userId);
      
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      res.json({
        id: user.id,
        username: user.username,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        role: user.role,
        profileImage: user.profileImage
      });
    } catch (error) {
      res.status(500).json({ message: "Server error" });
    }
  });

  // User routes
  app.get("/api/users", isAuthenticated, hasRole(["admin"]), async (req, res) => {
    try {
      const users = await storage.getUsers();
      
      // Don't return password in the response
      const safeUsers = users.map(user => {
        const { password, ...safeUser } = user;
        return safeUser;
      });
      
      res.json(safeUsers);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch users" });
    }
  });

  app.get("/api/users/:id", isAuthenticated, async (req, res) => {
    try {
      const userId = parseInt(req.params.id);
      const user = await storage.getUser(userId);
      
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      // Only admins can view any user, otherwise users can only view themselves
      if (req.session.userRole !== "admin" && req.session.userId !== userId) {
        return res.status(403).json({ message: "Forbidden" });
      }
      
      const { password, ...safeUser } = user;
      res.json(safeUser);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  app.post("/api/users", isAuthenticated, hasRole(["admin"]), async (req, res) => {
    const { data, error } = validateRequest(insertUserSchema, req.body);
    
    if (error) {
      return res.status(400).json({ message: "Validation error", errors: error });
    }
    
    try {
      const existingUser = await storage.getUserByUsername(data.username);
      if (existingUser) {
        return res.status(409).json({ message: "Username already exists" });
      }
      
      const newUser = await storage.createUser(data);
      const { password, ...safeUser } = newUser;
      res.status(201).json(safeUser);
    } catch (error) {
      res.status(500).json({ message: "Failed to create user" });
    }
  });

  app.put("/api/users/:id", isAuthenticated, async (req, res) => {
    const userId = parseInt(req.params.id);
    
    // Only admins can edit any user, otherwise users can only edit themselves
    if (req.session.userRole !== "admin" && req.session.userId !== userId) {
      return res.status(403).json({ message: "Forbidden" });
    }
    
    try {
      const user = await storage.getUser(userId);
      
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      // Don't allow role changes unless you're an admin
      if (req.body.role && req.session.userRole !== "admin") {
        delete req.body.role;
      }
      
      const updatedUser = await storage.updateUser(userId, req.body);
      
      if (!updatedUser) {
        return res.status(404).json({ message: "User not found" });
      }
      
      const { password, ...safeUser } = updatedUser;
      res.json(safeUser);
    } catch (error) {
      res.status(500).json({ message: "Failed to update user" });
    }
  });

  app.delete("/api/users/:id", isAuthenticated, hasRole(["admin"]), async (req, res) => {
    try {
      const userId = parseInt(req.params.id);
      const result = await storage.deleteUser(userId);
      
      if (!result) {
        return res.status(404).json({ message: "User not found" });
      }
      
      res.json({ message: "User deleted successfully" });
    } catch (error) {
      res.status(500).json({ message: "Failed to delete user" });
    }
  });

  // Course routes
  app.get("/api/courses", isAuthenticated, async (req, res) => {
    try {
      let courses;
      const facultyId = req.query.facultyId ? parseInt(req.query.facultyId as string) : undefined;
      const studentId = req.query.studentId ? parseInt(req.query.studentId as string) : undefined;
      
      if (facultyId) {
        courses = await storage.getCoursesByFaculty(facultyId);
      } else if (studentId) {
        courses = await storage.getCoursesByStudent(studentId);
      } else {
        courses = await storage.getCourses();
      }
      
      res.json(courses);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch courses" });
    }
  });

  app.get("/api/courses/:id", isAuthenticated, async (req, res) => {
    try {
      const courseId = parseInt(req.params.id);
      const course = await storage.getCourse(courseId);
      
      if (!course) {
        return res.status(404).json({ message: "Course not found" });
      }
      
      res.json(course);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch course" });
    }
  });

  app.post("/api/courses", isAuthenticated, hasRole(["admin", "faculty"]), async (req, res) => {
    const { data, error } = validateRequest(insertCourseSchema, req.body);
    
    if (error) {
      return res.status(400).json({ message: "Validation error", errors: error });
    }
    
    try {
      // If faculty is creating a course, set facultyId to their own id
      if (req.session.userRole === "faculty" && data.facultyId !== req.session.userId) {
        data.facultyId = req.session.userId;
      }
      
      const newCourse = await storage.createCourse(data);
      res.status(201).json(newCourse);
    } catch (error) {
      res.status(500).json({ message: "Failed to create course" });
    }
  });

  app.put("/api/courses/:id", isAuthenticated, async (req, res) => {
    const courseId = parseInt(req.params.id);
    
    try {
      const course = await storage.getCourse(courseId);
      
      if (!course) {
        return res.status(404).json({ message: "Course not found" });
      }
      
      // Check if user has permission to update this course
      if (
        req.session.userRole !== "admin" && 
        !(req.session.userRole === "faculty" && course.facultyId === req.session.userId)
      ) {
        return res.status(403).json({ message: "Forbidden" });
      }
      
      // Faculty shouldn't be able to change the faculty assigned to a course
      if (req.session.userRole === "faculty" && req.body.facultyId && req.body.facultyId !== req.session.userId) {
        delete req.body.facultyId;
      }
      
      const updatedCourse = await storage.updateCourse(courseId, req.body);
      
      if (!updatedCourse) {
        return res.status(404).json({ message: "Course not found" });
      }
      
      res.json(updatedCourse);
    } catch (error) {
      res.status(500).json({ message: "Failed to update course" });
    }
  });

  app.delete("/api/courses/:id", isAuthenticated, hasRole(["admin"]), async (req, res) => {
    try {
      const courseId = parseInt(req.params.id);
      const result = await storage.deleteCourse(courseId);
      
      if (!result) {
        return res.status(404).json({ message: "Course not found" });
      }
      
      res.json({ message: "Course deleted successfully" });
    } catch (error) {
      res.status(500).json({ message: "Failed to delete course" });
    }
  });

  // Enrollment routes
  app.get("/api/enrollments", isAuthenticated, async (req, res) => {
    try {
      let enrollments;
      const courseId = req.query.courseId ? parseInt(req.query.courseId as string) : undefined;
      const studentId = req.query.studentId ? parseInt(req.query.studentId as string) : undefined;
      
      if (courseId) {
        enrollments = await storage.getEnrollmentsByCourse(courseId);
      } else if (studentId) {
        enrollments = await storage.getEnrollmentsByStudent(studentId);
      } else {
        // Only admins can view all enrollments
        if (req.session.userRole !== "admin") {
          return res.status(403).json({ message: "Forbidden" });
        }
        
        // This endpoint won't be very useful without filtering, but added for completeness
        const allEnrollments = await Promise.all(
          (await storage.getUsers()).map(async (user) => {
            if (user.role === "student") {
              return await storage.getEnrollmentsByStudent(user.id);
            }
            return [];
          })
        );
        
        enrollments = allEnrollments.flat();
      }
      
      res.json(enrollments);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch enrollments" });
    }
  });

  app.post("/api/enrollments", isAuthenticated, async (req, res) => {
    const { data, error } = validateRequest(insertEnrollmentSchema, req.body);
    
    if (error) {
      return res.status(400).json({ message: "Validation error", errors: error });
    }
    
    try {
      // Check if student exists
      const student = await storage.getUser(data.studentId);
      if (!student || student.role !== "student") {
        return res.status(400).json({ message: "Invalid student ID" });
      }
      
      // Check if course exists
      const course = await storage.getCourse(data.courseId);
      if (!course) {
        return res.status(400).json({ message: "Invalid course ID" });
      }
      
      // Check if already enrolled
      const existingEnrollments = await storage.getEnrollmentsByStudent(data.studentId);
      const alreadyEnrolled = existingEnrollments.some(e => e.courseId === data.courseId);
      
      if (alreadyEnrolled) {
        return res.status(409).json({ message: "Student already enrolled in this course" });
      }
      
      // Create the enrollment
      const newEnrollment = await storage.createEnrollment(data);
      res.status(201).json(newEnrollment);
    } catch (error) {
      res.status(500).json({ message: "Failed to create enrollment" });
    }
  });

  app.put("/api/enrollments/:id", isAuthenticated, hasRole(["admin", "faculty"]), async (req, res) => {
    const enrollmentId = parseInt(req.params.id);
    
    try {
      const enrollment = await storage.getEnrollment(enrollmentId);
      
      if (!enrollment) {
        return res.status(404).json({ message: "Enrollment not found" });
      }
      
      // Check if faculty is authorized to update this enrollment
      if (req.session.userRole === "faculty") {
        const course = await storage.getCourse(enrollment.courseId);
        if (!course || course.facultyId !== req.session.userId) {
          return res.status(403).json({ message: "Forbidden" });
        }
      }
      
      const updatedEnrollment = await storage.updateEnrollment(enrollmentId, req.body);
      
      if (!updatedEnrollment) {
        return res.status(404).json({ message: "Enrollment not found" });
      }
      
      res.json(updatedEnrollment);
    } catch (error) {
      res.status(500).json({ message: "Failed to update enrollment" });
    }
  });

  app.delete("/api/enrollments/:id", isAuthenticated, hasRole(["admin"]), async (req, res) => {
    try {
      const enrollmentId = parseInt(req.params.id);
      const result = await storage.deleteEnrollment(enrollmentId);
      
      if (!result) {
        return res.status(404).json({ message: "Enrollment not found" });
      }
      
      res.json({ message: "Enrollment deleted successfully" });
    } catch (error) {
      res.status(500).json({ message: "Failed to delete enrollment" });
    }
  });

  // Assignment routes
  app.get("/api/assignments", isAuthenticated, async (req, res) => {
    try {
      const courseId = req.query.courseId ? parseInt(req.query.courseId as string) : undefined;
      
      if (!courseId) {
        return res.status(400).json({ message: "Course ID is required" });
      }
      
      const assignments = await storage.getAssignmentsByCourse(courseId);
      res.json(assignments);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch assignments" });
    }
  });

  app.get("/api/assignments/:id", isAuthenticated, async (req, res) => {
    try {
      const assignmentId = parseInt(req.params.id);
      const assignment = await storage.getAssignment(assignmentId);
      
      if (!assignment) {
        return res.status(404).json({ message: "Assignment not found" });
      }
      
      res.json(assignment);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch assignment" });
    }
  });

  app.post("/api/assignments", isAuthenticated, hasRole(["admin", "faculty"]), async (req, res) => {
    const { data, error } = validateRequest(insertAssignmentSchema, req.body);
    
    if (error) {
      return res.status(400).json({ message: "Validation error", errors: error });
    }
    
    try {
      // Check if course exists
      const course = await storage.getCourse(data.courseId);
      
      if (!course) {
        return res.status(400).json({ message: "Invalid course ID" });
      }
      
      // Check if faculty is authorized to create assignment for this course
      if (req.session.userRole === "faculty" && course.facultyId !== req.session.userId) {
        return res.status(403).json({ message: "Forbidden" });
      }
      
      const newAssignment = await storage.createAssignment(data);
      res.status(201).json(newAssignment);
    } catch (error) {
      res.status(500).json({ message: "Failed to create assignment" });
    }
  });

  app.put("/api/assignments/:id", isAuthenticated, hasRole(["admin", "faculty"]), async (req, res) => {
    const assignmentId = parseInt(req.params.id);
    
    try {
      const assignment = await storage.getAssignment(assignmentId);
      
      if (!assignment) {
        return res.status(404).json({ message: "Assignment not found" });
      }
      
      // Check if faculty is authorized to update this assignment
      if (req.session.userRole === "faculty") {
        const course = await storage.getCourse(assignment.courseId);
        if (!course || course.facultyId !== req.session.userId) {
          return res.status(403).json({ message: "Forbidden" });
        }
      }
      
      const updatedAssignment = await storage.updateAssignment(assignmentId, req.body);
      
      if (!updatedAssignment) {
        return res.status(404).json({ message: "Assignment not found" });
      }
      
      res.json(updatedAssignment);
    } catch (error) {
      res.status(500).json({ message: "Failed to update assignment" });
    }
  });

  app.delete("/api/assignments/:id", isAuthenticated, hasRole(["admin", "faculty"]), async (req, res) => {
    try {
      const assignmentId = parseInt(req.params.id);
      const assignment = await storage.getAssignment(assignmentId);
      
      if (!assignment) {
        return res.status(404).json({ message: "Assignment not found" });
      }
      
      // Check if faculty is authorized to delete this assignment
      if (req.session.userRole === "faculty") {
        const course = await storage.getCourse(assignment.courseId);
        if (!course || course.facultyId !== req.session.userId) {
          return res.status(403).json({ message: "Forbidden" });
        }
      }
      
      const result = await storage.deleteAssignment(assignmentId);
      
      if (!result) {
        return res.status(404).json({ message: "Assignment not found" });
      }
      
      res.json({ message: "Assignment deleted successfully" });
    } catch (error) {
      res.status(500).json({ message: "Failed to delete assignment" });
    }
  });

  // Submission routes
  app.get("/api/submissions", isAuthenticated, async (req, res) => {
    try {
      const assignmentId = req.query.assignmentId ? parseInt(req.query.assignmentId as string) : undefined;
      const studentId = req.query.studentId ? parseInt(req.query.studentId as string) : undefined;
      
      if (!assignmentId && !studentId) {
        return res.status(400).json({ message: "Assignment ID or Student ID is required" });
      }
      
      let submissions;
      
      if (assignmentId) {
        submissions = await storage.getSubmissionsByAssignment(assignmentId);
        
        // If not admin or faculty teaching the course, only return the user's own submission
        if (req.session.userRole !== "admin" && req.session.userRole !== "faculty") {
          submissions = submissions.filter(s => s.studentId === req.session.userId);
        } else if (req.session.userRole === "faculty") {
          // Faculty can only see submissions for assignments in their courses
          const assignment = await storage.getAssignment(assignmentId);
          if (assignment) {
            const course = await storage.getCourse(assignment.courseId);
            if (!course || course.facultyId !== req.session.userId) {
              return res.status(403).json({ message: "Forbidden" });
            }
          }
        }
      } else if (studentId) {
        // For student ID queries, users can only see their own submissions unless admin/faculty
        if (req.session.userRole === "student" && studentId !== req.session.userId) {
          return res.status(403).json({ message: "Forbidden" });
        }
        
        submissions = await storage.getSubmissionsByStudent(studentId);
        
        // Faculty can only see submissions for assignments in their courses
        if (req.session.userRole === "faculty") {
          const facultyCoursesIds = (await storage.getCoursesByFaculty(req.session.userId)).map(c => c.id);
          submissions = await Promise.all(
            submissions.map(async (submission) => {
              const assignment = await storage.getAssignment(submission.assignmentId);
              if (assignment && facultyCoursesIds.includes(assignment.courseId)) {
                return submission;
              }
              return null;
            })
          );
          submissions = submissions.filter(s => s !== null) as typeof submissions;
        }
      }
      
      res.json(submissions);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch submissions" });
    }
  });

  app.get("/api/submissions/:id", isAuthenticated, async (req, res) => {
    try {
      const submissionId = parseInt(req.params.id);
      const submission = await storage.getSubmission(submissionId);
      
      if (!submission) {
        return res.status(404).json({ message: "Submission not found" });
      }
      
      // Students can only see their own submissions
      if (req.session.userRole === "student" && submission.studentId !== req.session.userId) {
        return res.status(403).json({ message: "Forbidden" });
      }
      
      // Faculty can only see submissions for assignments in their courses
      if (req.session.userRole === "faculty") {
        const assignment = await storage.getAssignment(submission.assignmentId);
        if (assignment) {
          const course = await storage.getCourse(assignment.courseId);
          if (!course || course.facultyId !== req.session.userId) {
            return res.status(403).json({ message: "Forbidden" });
          }
        }
      }
      
      res.json(submission);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch submission" });
    }
  });

  app.post("/api/submissions", isAuthenticated, async (req, res) => {
    const { data, error } = validateRequest(insertSubmissionSchema, req.body);
    
    if (error) {
      return res.status(400).json({ message: "Validation error", errors: error });
    }
    
    try {
      // Students can only submit for themselves
      if (req.session.userRole === "student" && data.studentId !== req.session.userId) {
        return res.status(403).json({ message: "Forbidden" });
      }
      
      // Check if assignment exists
      const assignment = await storage.getAssignment(data.assignmentId);
      if (!assignment) {
        return res.status(400).json({ message: "Invalid assignment ID" });
      }
      
      // Check if student is enrolled in the course
      const studentEnrollments = await storage.getEnrollmentsByStudent(data.studentId);
      const isEnrolled = studentEnrollments.some(e => e.courseId === assignment.courseId);
      
      if (!isEnrolled && req.session.userRole !== "admin") {
        return res.status(403).json({ message: "Student not enrolled in this course" });
      }
      
      // Check if assignment is open for submission
      if (assignment.status === "closed" && req.session.userRole !== "admin") {
        return res.status(400).json({ message: "Assignment is closed for submission" });
      }
      
      // Check if student already submitted
      const existingSubmission = await storage.getSubmissionByAssignmentAndStudent(
        data.assignmentId,
        data.studentId
      );
      
      if (existingSubmission) {
        // Update existing submission instead of creating a new one
        const updatedSubmission = await storage.updateSubmission(
          existingSubmission.id,
          {
            ...data,
            status: "resubmitted",
            submissionDate: new Date()
          }
        );
        return res.json(updatedSubmission);
      }
      
      const newSubmission = await storage.createSubmission(data);
      res.status(201).json(newSubmission);
    } catch (error) {
      res.status(500).json({ message: "Failed to create submission" });
    }
  });

  app.put("/api/submissions/:id", isAuthenticated, async (req, res) => {
    const submissionId = parseInt(req.params.id);
    
    try {
      const submission = await storage.getSubmission(submissionId);
      
      if (!submission) {
        return res.status(404).json({ message: "Submission not found" });
      }
      
      // Students can only update their own submissions
      if (req.session.userRole === "student") {
        if (submission.studentId !== req.session.userId) {
          return res.status(403).json({ message: "Forbidden" });
        }
        
        // Students can't update grade or feedback
        delete req.body.grade;
        delete req.body.feedback;
        
        // Check if assignment is still open
        const assignment = await storage.getAssignment(submission.assignmentId);
        if (assignment && assignment.status === "closed") {
          return res.status(400).json({ message: "Assignment is closed for submission" });
        }
      }
      
      // Faculty can only grade submissions for assignments in their courses
      if (req.session.userRole === "faculty") {
        const assignment = await storage.getAssignment(submission.assignmentId);
        if (assignment) {
          const course = await storage.getCourse(assignment.courseId);
          if (!course || course.facultyId !== req.session.userId) {
            return res.status(403).json({ message: "Forbidden" });
          }
        }
        
        // Faculty can only update grade and feedback
        const allowedFields = ["grade", "feedback", "status"];
        Object.keys(req.body).forEach(key => {
          if (!allowedFields.includes(key)) {
            delete req.body[key];
          }
        });
      }
      
      const updatedSubmission = await storage.updateSubmission(submissionId, req.body);
      
      if (!updatedSubmission) {
        return res.status(404).json({ message: "Submission not found" });
      }
      
      res.json(updatedSubmission);
    } catch (error) {
      res.status(500).json({ message: "Failed to update submission" });
    }
  });

  // Announcement routes
  app.get("/api/announcements", isAuthenticated, async (req, res) => {
    try {
      const courseId = req.query.courseId ? parseInt(req.query.courseId as string) : undefined;
      
      let announcements;
      
      if (courseId) {
        announcements = await storage.getAnnouncementsByCourse(courseId);
      } else {
        announcements = await storage.getAnnouncements();
      }
      
      res.json(announcements);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch announcements" });
    }
  });

  app.post("/api/announcements", isAuthenticated, hasRole(["admin", "faculty"]), async (req, res) => {
    const { data, error } = validateRequest(insertAnnouncementSchema, req.body);
    
    if (error) {
      return res.status(400).json({ message: "Validation error", errors: error });
    }
    
    try {
      // Set the user who is creating the announcement
      data.userId = req.session.userId;
      
      // Only admins can create global announcements
      if (data.isGlobal && req.session.userRole !== "admin") {
        data.isGlobal = false;
      }
      
      // If course ID is provided, check if faculty is teaching this course
      if (data.courseId && req.session.userRole === "faculty") {
        const course = await storage.getCourse(data.courseId);
        if (!course || course.facultyId !== req.session.userId) {
          return res.status(403).json({ message: "Forbidden" });
        }
      }
      
      const newAnnouncement = await storage.createAnnouncement(data);
      res.status(201).json(newAnnouncement);
    } catch (error) {
      res.status(500).json({ message: "Failed to create announcement" });
    }
  });

  app.put("/api/announcements/:id", isAuthenticated, async (req, res) => {
    const announcementId = parseInt(req.params.id);
    
    try {
      const announcement = await storage.getAnnouncement(announcementId);
      
      if (!announcement) {
        return res.status(404).json({ message: "Announcement not found" });
      }
      
      // Users can only update their own announcements unless they're admin
      if (req.session.userRole !== "admin" && announcement.userId !== req.session.userId) {
        return res.status(403).json({ message: "Forbidden" });
      }
      
      // Only admins can update isGlobal
      if (req.body.isGlobal !== undefined && req.session.userRole !== "admin") {
        delete req.body.isGlobal;
      }
      
      const updatedAnnouncement = await storage.updateAnnouncement(announcementId, req.body);
      
      if (!updatedAnnouncement) {
        return res.status(404).json({ message: "Announcement not found" });
      }
      
      res.json(updatedAnnouncement);
    } catch (error) {
      res.status(500).json({ message: "Failed to update announcement" });
    }
  });

  app.delete("/api/announcements/:id", isAuthenticated, async (req, res) => {
    try {
      const announcementId = parseInt(req.params.id);
      const announcement = await storage.getAnnouncement(announcementId);
      
      if (!announcement) {
        return res.status(404).json({ message: "Announcement not found" });
      }
      
      // Users can only delete their own announcements unless they're admin
      if (req.session.userRole !== "admin" && announcement.userId !== req.session.userId) {
        return res.status(403).json({ message: "Forbidden" });
      }
      
      const result = await storage.deleteAnnouncement(announcementId);
      
      if (!result) {
        return res.status(404).json({ message: "Announcement not found" });
      }
      
      res.json({ message: "Announcement deleted successfully" });
    } catch (error) {
      res.status(500).json({ message: "Failed to delete announcement" });
    }
  });

  // Analytics routes
  app.get("/api/analytics/users", isAuthenticated, hasRole(["admin"]), async (req, res) => {
    try {
      const users = await storage.getUsers();
      const totalUsers = users.length;
      const adminCount = users.filter(u => u.role === "admin").length;
      const facultyCount = users.filter(u => u.role === "faculty").length;
      const studentCount = users.filter(u => u.role === "student").length;
      
      res.json({
        totalUsers,
        adminCount,
        facultyCount,
        studentCount
      });
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch user analytics" });
    }
  });

  app.get("/api/analytics/courses", isAuthenticated, hasRole(["admin"]), async (req, res) => {
    try {
      const courses = await storage.getCourses();
      const totalCourses = courses.length;
      const activeCount = courses.filter(c => c.status === "active").length;
      const inactiveCount = courses.filter(c => c.status === "inactive").length;
      const pendingCount = courses.filter(c => c.status === "pending").length;
      
      res.json({
        totalCourses,
        activeCount,
        inactiveCount,
        pendingCount
      });
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch course analytics" });
    }
  });

  app.get("/api/analytics/assignments", isAuthenticated, hasRole(["admin", "faculty"]), async (req, res) => {
    try {
      let assignments = [];
      
      if (req.session.userRole === "admin") {
        // For admin, get all assignments
        const courses = await storage.getCourses();
        
        for (const course of courses) {
          const courseAssignments = await storage.getAssignmentsByCourse(course.id);
          assignments = [...assignments, ...courseAssignments];
        }
      } else if (req.session.userRole === "faculty") {
        // For faculty, get assignments for their courses
        const facultyCourses = await storage.getCoursesByFaculty(req.session.userId);
        
        for (const course of facultyCourses) {
          const courseAssignments = await storage.getAssignmentsByCourse(course.id);
          assignments = [...assignments, ...courseAssignments];
        }
      }
      
      const totalAssignments = assignments.length;
      const draftCount = assignments.filter(a => a.status === "draft").length;
      const publishedCount = assignments.filter(a => a.status === "published").length;
      const closedCount = assignments.filter(a => a.status === "closed").length;
      
      // Count by type
      const assignmentCount = assignments.filter(a => a.type === "assignment").length;
      const quizCount = assignments.filter(a => a.type === "quiz").length;
      const examCount = assignments.filter(a => a.type === "exam").length;
      const projectCount = assignments.filter(a => a.type === "project").length;
      
      res.json({
        totalAssignments,
        byStatus: {
          draftCount,
          publishedCount,
          closedCount
        },
        byType: {
          assignmentCount,
          quizCount,
          examCount,
          projectCount
        }
      });
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch assignment analytics" });
    }
  });

  app.get("/api/analytics/faculty/:id", isAuthenticated, async (req, res) => {
    try {
      const facultyId = parseInt(req.params.id);
      
      // Check authorization
      if (req.session.userRole !== "admin" && req.session.userId !== facultyId) {
        return res.status(403).json({ message: "Forbidden" });
      }
      
      // Check if user exists and is faculty
      const faculty = await storage.getUser(facultyId);
      if (!faculty || faculty.role !== "faculty") {
        return res.status(404).json({ message: "Faculty not found" });
      }
      
      const facultyCourses = await storage.getCoursesByFaculty(facultyId);
      const totalCourses = facultyCourses.length;
      
      let totalStudents = 0;
      let totalAssignments = 0;
      let pendingSubmissions = 0;
      let gradedSubmissions = 0;
      
      for (const course of facultyCourses) {
        const enrollments = await storage.getEnrollmentsByCourse(course.id);
        totalStudents += enrollments.length;
        
        const assignments = await storage.getAssignmentsByCourse(course.id);
        totalAssignments += assignments.length;
        
        for (const assignment of assignments) {
          const submissions = await storage.getSubmissionsByAssignment(assignment.id);
          pendingSubmissions += submissions.filter(s => s.status === "submitted").length;
          gradedSubmissions += submissions.filter(s => s.status === "graded").length;
        }
      }
      
      res.json({
        totalCourses,
        totalStudents,
        totalAssignments,
        pendingSubmissions,
        gradedSubmissions
      });
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch faculty analytics" });
    }
  });

  app.get("/api/analytics/student/:id", isAuthenticated, async (req, res) => {
    try {
      const studentId = parseInt(req.params.id);
      
      // Check authorization
      if (req.session.userRole === "student" && req.session.userId !== studentId) {
        return res.status(403).json({ message: "Forbidden" });
      }
      
      // Check if user exists and is student
      const student = await storage.getUser(studentId);
      if (!student || student.role !== "student") {
        return res.status(404).json({ message: "Student not found" });
      }
      
      const enrollments = await storage.getEnrollmentsByStudent(studentId);
      const totalCourses = enrollments.length;
      
      let totalAssignments = 0;
      let completedAssignments = 0;
      let pendingAssignments = 0;
      let overallProgress = 0;
      
      for (const enrollment of enrollments) {
        overallProgress += enrollment.progress;
        
        const course = await storage.getCourse(enrollment.courseId);
        if (course) {
          const assignments = await storage.getAssignmentsByCourse(course.id);
          totalAssignments += assignments.length;
          
          for (const assignment of assignments) {
            const submission = await storage.getSubmissionByAssignmentAndStudent(
              assignment.id,
              studentId
            );
            
            if (submission) {
              completedAssignments++;
            } else if (new Date(assignment.dueDate) > new Date()) {
              pendingAssignments++;
            }
          }
        }
      }
      
      // Calculate average progress across all courses
      const averageProgress = enrollments.length > 0 
        ? Math.round(overallProgress / enrollments.length) 
        : 0;
      
      res.json({
        totalCourses,
        totalAssignments,
        completedAssignments,
        pendingAssignments,
        averageProgress
      });
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch student analytics" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
