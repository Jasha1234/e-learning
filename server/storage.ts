import { 
  users, type User, type InsertUser,
  courses, type Course, type InsertCourse,
  enrollments, type Enrollment, type InsertEnrollment,
  assignments, type Assignment, type InsertAssignment,
  submissions, type Submission, type InsertSubmission,
  announcements, type Announcement, type InsertAnnouncement 
} from "@shared/schema";

export interface IStorage {
  // User operations
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUsers(): Promise<User[]>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: number, user: Partial<User>): Promise<User | undefined>;
  deleteUser(id: number): Promise<boolean>;
  
  // Course operations
  getCourse(id: number): Promise<Course | undefined>;
  getCourses(): Promise<Course[]>;
  getCoursesByFaculty(facultyId: number): Promise<Course[]>;
  getCoursesByStudent(studentId: number): Promise<(Course & { progress: number })[]>;
  createCourse(course: InsertCourse): Promise<Course>;
  updateCourse(id: number, course: Partial<Course>): Promise<Course | undefined>;
  deleteCourse(id: number): Promise<boolean>;
  
  // Enrollment operations
  getEnrollment(id: number): Promise<Enrollment | undefined>;
  getEnrollmentsByCourse(courseId: number): Promise<Enrollment[]>;
  getEnrollmentsByStudent(studentId: number): Promise<Enrollment[]>;
  createEnrollment(enrollment: InsertEnrollment): Promise<Enrollment>;
  updateEnrollment(id: number, enrollment: Partial<Enrollment>): Promise<Enrollment | undefined>;
  deleteEnrollment(id: number): Promise<boolean>;
  
  // Assignment operations
  getAssignment(id: number): Promise<Assignment | undefined>;
  getAssignmentsByCourse(courseId: number): Promise<Assignment[]>;
  createAssignment(assignment: InsertAssignment): Promise<Assignment>;
  updateAssignment(id: number, assignment: Partial<Assignment>): Promise<Assignment | undefined>;
  deleteAssignment(id: number): Promise<boolean>;
  
  // Submission operations
  getSubmission(id: number): Promise<Submission | undefined>;
  getSubmissionsByAssignment(assignmentId: number): Promise<Submission[]>;
  getSubmissionsByStudent(studentId: number): Promise<Submission[]>;
  getSubmissionByAssignmentAndStudent(assignmentId: number, studentId: number): Promise<Submission | undefined>;
  createSubmission(submission: InsertSubmission): Promise<Submission>;
  updateSubmission(id: number, submission: Partial<Submission>): Promise<Submission | undefined>;
  deleteSubmission(id: number): Promise<boolean>;
  
  // Announcement operations
  getAnnouncement(id: number): Promise<Announcement | undefined>;
  getAnnouncements(): Promise<Announcement[]>;
  getAnnouncementsByCourse(courseId: number): Promise<Announcement[]>;
  createAnnouncement(announcement: InsertAnnouncement): Promise<Announcement>;
  updateAnnouncement(id: number, announcement: Partial<Announcement>): Promise<Announcement | undefined>;
  deleteAnnouncement(id: number): Promise<boolean>;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private courses: Map<number, Course>;
  private enrollments: Map<number, Enrollment>;
  private assignments: Map<number, Assignment>;
  private submissions: Map<number, Submission>;
  private announcements: Map<number, Announcement>;
  
  private userCurrentId: number;
  private courseCurrentId: number;
  private enrollmentCurrentId: number;
  private assignmentCurrentId: number;
  private submissionCurrentId: number;
  private announcementCurrentId: number;

  constructor() {
    this.users = new Map();
    this.courses = new Map();
    this.enrollments = new Map();
    this.assignments = new Map();
    this.submissions = new Map();
    this.announcements = new Map();
    
    this.userCurrentId = 1;
    this.courseCurrentId = 1;
    this.enrollmentCurrentId = 1;
    this.assignmentCurrentId = 1;
    this.submissionCurrentId = 1;
    this.announcementCurrentId = 1;
    
    // Add some initial data
    this.seedData();
  }

  // User operations
  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async getUsers(): Promise<User[]> {
    return Array.from(this.users.values());
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.userCurrentId++;
    const user: User = { ...insertUser, id };
    this.users.set(id, user);
    return user;
  }

  async updateUser(id: number, userData: Partial<User>): Promise<User | undefined> {
    const user = this.users.get(id);
    if (!user) return undefined;
    
    const updatedUser = { ...user, ...userData };
    this.users.set(id, updatedUser);
    return updatedUser;
  }

  async deleteUser(id: number): Promise<boolean> {
    return this.users.delete(id);
  }

  // Course operations
  async getCourse(id: number): Promise<Course | undefined> {
    return this.courses.get(id);
  }

  async getCourses(): Promise<Course[]> {
    return Array.from(this.courses.values());
  }

  async getCoursesByFaculty(facultyId: number): Promise<Course[]> {
    return Array.from(this.courses.values()).filter(
      (course) => course.facultyId === facultyId,
    );
  }

  async getCoursesByStudent(studentId: number): Promise<(Course & { progress: number })[]> {
    const studentEnrollments = Array.from(this.enrollments.values()).filter(
      (enrollment) => enrollment.studentId === studentId,
    );
    
    return Promise.all(
      studentEnrollments.map(async (enrollment) => {
        const course = await this.getCourse(enrollment.courseId);
        return { ...(course as Course), progress: enrollment.progress };
      })
    );
  }

  async createCourse(insertCourse: InsertCourse): Promise<Course> {
    const id = this.courseCurrentId++;
    const course: Course = { ...insertCourse, id };
    this.courses.set(id, course);
    return course;
  }

  async updateCourse(id: number, courseData: Partial<Course>): Promise<Course | undefined> {
    const course = this.courses.get(id);
    if (!course) return undefined;
    
    const updatedCourse = { ...course, ...courseData };
    this.courses.set(id, updatedCourse);
    return updatedCourse;
  }

  async deleteCourse(id: number): Promise<boolean> {
    return this.courses.delete(id);
  }

  // Enrollment operations
  async getEnrollment(id: number): Promise<Enrollment | undefined> {
    return this.enrollments.get(id);
  }

  async getEnrollmentsByCourse(courseId: number): Promise<Enrollment[]> {
    return Array.from(this.enrollments.values()).filter(
      (enrollment) => enrollment.courseId === courseId,
    );
  }

  async getEnrollmentsByStudent(studentId: number): Promise<Enrollment[]> {
    return Array.from(this.enrollments.values()).filter(
      (enrollment) => enrollment.studentId === studentId,
    );
  }

  async createEnrollment(insertEnrollment: InsertEnrollment): Promise<Enrollment> {
    const id = this.enrollmentCurrentId++;
    const enrollment: Enrollment = { 
      ...insertEnrollment, 
      id, 
      enrollmentDate: new Date() 
    };
    this.enrollments.set(id, enrollment);
    return enrollment;
  }

  async updateEnrollment(id: number, enrollmentData: Partial<Enrollment>): Promise<Enrollment | undefined> {
    const enrollment = this.enrollments.get(id);
    if (!enrollment) return undefined;
    
    const updatedEnrollment = { ...enrollment, ...enrollmentData };
    this.enrollments.set(id, updatedEnrollment);
    return updatedEnrollment;
  }

  async deleteEnrollment(id: number): Promise<boolean> {
    return this.enrollments.delete(id);
  }

  // Assignment operations
  async getAssignment(id: number): Promise<Assignment | undefined> {
    return this.assignments.get(id);
  }

  async getAssignmentsByCourse(courseId: number): Promise<Assignment[]> {
    return Array.from(this.assignments.values()).filter(
      (assignment) => assignment.courseId === courseId,
    );
  }

  async createAssignment(insertAssignment: InsertAssignment): Promise<Assignment> {
    const id = this.assignmentCurrentId++;
    const assignment: Assignment = { ...insertAssignment, id };
    this.assignments.set(id, assignment);
    return assignment;
  }

  async updateAssignment(id: number, assignmentData: Partial<Assignment>): Promise<Assignment | undefined> {
    const assignment = this.assignments.get(id);
    if (!assignment) return undefined;
    
    const updatedAssignment = { ...assignment, ...assignmentData };
    this.assignments.set(id, updatedAssignment);
    return updatedAssignment;
  }

  async deleteAssignment(id: number): Promise<boolean> {
    return this.assignments.delete(id);
  }

  // Submission operations
  async getSubmission(id: number): Promise<Submission | undefined> {
    return this.submissions.get(id);
  }

  async getSubmissionsByAssignment(assignmentId: number): Promise<Submission[]> {
    return Array.from(this.submissions.values()).filter(
      (submission) => submission.assignmentId === assignmentId,
    );
  }

  async getSubmissionsByStudent(studentId: number): Promise<Submission[]> {
    return Array.from(this.submissions.values()).filter(
      (submission) => submission.studentId === studentId,
    );
  }

  async getSubmissionByAssignmentAndStudent(assignmentId: number, studentId: number): Promise<Submission | undefined> {
    return Array.from(this.submissions.values()).find(
      (submission) => submission.assignmentId === assignmentId && submission.studentId === studentId,
    );
  }

  async createSubmission(insertSubmission: InsertSubmission): Promise<Submission> {
    const id = this.submissionCurrentId++;
    const submission: Submission = { 
      ...insertSubmission, 
      id, 
      submissionDate: new Date() 
    };
    this.submissions.set(id, submission);
    return submission;
  }

  async updateSubmission(id: number, submissionData: Partial<Submission>): Promise<Submission | undefined> {
    const submission = this.submissions.get(id);
    if (!submission) return undefined;
    
    const updatedSubmission = { ...submission, ...submissionData };
    this.submissions.set(id, updatedSubmission);
    return updatedSubmission;
  }

  async deleteSubmission(id: number): Promise<boolean> {
    return this.submissions.delete(id);
  }

  // Announcement operations
  async getAnnouncement(id: number): Promise<Announcement | undefined> {
    return this.announcements.get(id);
  }

  async getAnnouncements(): Promise<Announcement[]> {
    return Array.from(this.announcements.values());
  }

  async getAnnouncementsByCourse(courseId: number): Promise<Announcement[]> {
    return Array.from(this.announcements.values()).filter(
      (announcement) => announcement.courseId === courseId || announcement.isGlobal,
    );
  }

  async createAnnouncement(insertAnnouncement: InsertAnnouncement): Promise<Announcement> {
    const id = this.announcementCurrentId++;
    const announcement: Announcement = { 
      ...insertAnnouncement, 
      id, 
      datePosted: new Date() 
    };
    this.announcements.set(id, announcement);
    return announcement;
  }

  async updateAnnouncement(id: number, announcementData: Partial<Announcement>): Promise<Announcement | undefined> {
    const announcement = this.announcements.get(id);
    if (!announcement) return undefined;
    
    const updatedAnnouncement = { ...announcement, ...announcementData };
    this.announcements.set(id, updatedAnnouncement);
    return updatedAnnouncement;
  }

  async deleteAnnouncement(id: number): Promise<boolean> {
    return this.announcements.delete(id);
  }

  // Seed some initial data for development
  private async seedData() {
    // Create sample users
    const adminUser = await this.createUser({
      username: "admin",
      password: "password123",
      email: "admin@edulearn.com",
      firstName: "Admin",
      lastName: "User",
      role: "admin",
      profileImage: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=100&q=80",
      department: "Administration",
      bio: "Platform administrator"
    });

    const faculty1 = await this.createUser({
      username: "faculty1",
      password: "password123",
      email: "faculty1@edulearn.com",
      firstName: "Sarah",
      lastName: "Johnson",
      role: "faculty",
      profileImage: "https://images.unsplash.com/photo-1580489944761-15a19d654956?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=100&q=80",
      department: "Computer Science",
      bio: "Professor of Computer Science with 10 years of experience"
    });

    const faculty2 = await this.createUser({
      username: "faculty2",
      password: "password123",
      email: "faculty2@edulearn.com",
      firstName: "Michael",
      lastName: "Lee",
      role: "faculty",
      profileImage: "https://images.unsplash.com/photo-1560250097-0b93528c311a?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=100&q=80",
      department: "Mathematics",
      bio: "Professor of Mathematics specializing in calculus"
    });

    const student1 = await this.createUser({
      username: "student1",
      password: "password123",
      email: "student1@edulearn.com",
      firstName: "James",
      lastName: "Wilson",
      role: "student",
      profileImage: "https://images.unsplash.com/photo-1599566150163-29194dcaad36?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=100&q=80",
      department: "Computer Science",
      bio: "Computer Science student interested in web development"
    });

    const student2 = await this.createUser({
      username: "student2",
      password: "password123",
      email: "student2@edulearn.com",
      firstName: "Emily",
      lastName: "Chen",
      role: "student",
      profileImage: "https://images.unsplash.com/photo-1607746882042-944635dfe10e?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=100&q=80",
      department: "Biology",
      bio: "Biology student with a minor in Chemistry"
    });

    // Create sample courses
    const course1 = await this.createCourse({
      code: "CS101",
      name: "Introduction to Programming",
      description: "An introductory course to programming concepts and practices using JavaScript",
      facultyId: faculty1.id,
      semester: "Fall",
      year: 2023,
      status: "active",
      startDate: new Date("2023-09-01"),
      endDate: new Date("2023-12-15"),
      thumbnail: ""
    });

    const course2 = await this.createCourse({
      code: "CS332",
      name: "Advanced Web Development",
      description: "Advanced web development techniques including modern frameworks and APIs",
      facultyId: faculty1.id,
      semester: "Fall",
      year: 2023,
      status: "active",
      startDate: new Date("2023-09-01"),
      endDate: new Date("2023-12-15"),
      thumbnail: ""
    });

    const course3 = await this.createCourse({
      code: "MATH202",
      name: "Calculus II",
      description: "Continuation of Calculus I, covering integration techniques and applications",
      facultyId: faculty2.id,
      semester: "Fall",
      year: 2023,
      status: "active",
      startDate: new Date("2023-09-01"),
      endDate: new Date("2023-12-15"),
      thumbnail: ""
    });

    const course4 = await this.createCourse({
      code: "CS310",
      name: "Database Systems",
      description: "Introduction to database design, implementation, and management",
      facultyId: faculty1.id,
      semester: "Fall",
      year: 2023,
      status: "active",
      startDate: new Date("2023-09-01"),
      endDate: new Date("2023-12-15"),
      thumbnail: ""
    });

    // Create enrollments
    await this.createEnrollment({
      studentId: student1.id,
      courseId: course1.id,
      progress: 65,
      grade: "A-",
      status: "active"
    });

    await this.createEnrollment({
      studentId: student1.id,
      courseId: course3.id,
      progress: 78,
      grade: "A",
      status: "active"
    });

    await this.createEnrollment({
      studentId: student1.id,
      courseId: course4.id,
      progress: 42,
      grade: "B+",
      status: "active"
    });

    await this.createEnrollment({
      studentId: student2.id,
      courseId: course1.id,
      progress: 70,
      grade: "B+",
      status: "active"
    });

    await this.createEnrollment({
      studentId: student2.id,
      courseId: course2.id,
      progress: 55,
      grade: "B",
      status: "active"
    });

    // Create assignments
    const assignment1 = await this.createAssignment({
      courseId: course1.id,
      title: "Project 1: Basic HTML/CSS",
      description: "Create a simple webpage using HTML and CSS",
      dueDate: new Date("2023-10-15"),
      totalPoints: 100,
      status: "published",
      type: "project",
      instructions: "Create a personal portfolio webpage with at least 3 sections"
    });

    const assignment2 = await this.createAssignment({
      courseId: course2.id,
      title: "Midterm Project: API Integration",
      description: "Build a web application that integrates with a public API",
      dueDate: new Date("2023-10-22"),
      totalPoints: 100,
      status: "published",
      type: "project",
      instructions: "Choose a public API and create a functional application that displays and manipulates the data"
    });

    const assignment3 = await this.createAssignment({
      courseId: course4.id,
      title: "SQL Design Exercise",
      description: "Design a database schema for an e-commerce platform",
      dueDate: new Date("2023-10-05"),
      totalPoints: 50,
      status: "closed",
      type: "assignment",
      instructions: "Create ER diagram and write SQL queries for common operations"
    });

    const assignment4 = await this.createAssignment({
      courseId: course3.id,
      title: "Homework 5: Integration",
      description: "Complete problems related to integration techniques",
      dueDate: new Date("2023-10-20"),
      totalPoints: 50,
      status: "published",
      type: "assignment",
      instructions: "Solve the odd-numbered problems from chapter 7"
    });

    // Create submissions
    await this.createSubmission({
      assignmentId: assignment1.id,
      studentId: student1.id,
      content: "My submission for HTML/CSS project",
      fileUrl: "https://example.com/submission1.zip",
      grade: 92,
      feedback: "Excellent work on the layout and responsiveness",
      status: "graded"
    });

    await this.createSubmission({
      assignmentId: assignment3.id,
      studentId: student1.id,
      content: "My SQL design submission",
      fileUrl: "https://example.com/submission2.pdf",
      grade: 88,
      feedback: "Good normalization, but could improve indexing strategy",
      status: "graded"
    });

    // Create announcements
    await this.createAnnouncement({
      courseId: course1.id,
      userId: faculty1.id,
      title: "Welcome to Introduction to Programming",
      content: "Welcome to the course! Please review the syllabus and first week's materials.",
      isGlobal: false
    });

    await this.createAnnouncement({
      courseId: null,
      userId: adminUser.id,
      title: "System Maintenance",
      content: "The platform will be down for maintenance on Sunday from 2am to 4am.",
      isGlobal: true
    });
  }
}

export const storage = new MemStorage();
