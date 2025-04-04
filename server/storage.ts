import { 
  users, 
  courses, 
  enrollments, 
  assignments, 
  submissions, 
  activities,
  type User, 
  type InsertUser, 
  type Course, 
  type InsertCourse,
  type Enrollment,
  type InsertEnrollment,
  type Assignment,
  type InsertAssignment,
  type Submission,
  type InsertSubmission,
  type Activity,
  type InsertActivity
} from "@shared/schema";

export interface IStorage {
  // User management
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUsersByRole(role: string): Promise<User[]>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: number, data: Partial<InsertUser>): Promise<User | undefined>;
  deleteUser(id: number): Promise<boolean>;
  getAllUsers(): Promise<User[]>;

  // Course management
  getCourse(id: number): Promise<Course | undefined>;
  getCoursesByFaculty(facultyId: number): Promise<Course[]>;
  getActiveCourses(): Promise<Course[]>;
  createCourse(course: InsertCourse): Promise<Course>;
  updateCourse(id: number, data: Partial<InsertCourse>): Promise<Course | undefined>;
  deleteCourse(id: number): Promise<boolean>;
  getAllCourses(): Promise<Course[]>;

  // Enrollment management
  getEnrollment(id: number): Promise<Enrollment | undefined>;
  getEnrollmentsByStudent(studentId: number): Promise<Enrollment[]>;
  getEnrollmentsByCourse(courseId: number): Promise<Enrollment[]>;
  createEnrollment(enrollment: InsertEnrollment): Promise<Enrollment>;
  updateEnrollment(id: number, data: Partial<InsertEnrollment>): Promise<Enrollment | undefined>;
  deleteEnrollment(id: number): Promise<boolean>;

  // Assignment management
  getAssignment(id: number): Promise<Assignment | undefined>;
  getAssignmentsByCourse(courseId: number): Promise<Assignment[]>;
  createAssignment(assignment: InsertAssignment): Promise<Assignment>;
  updateAssignment(id: number, data: Partial<InsertAssignment>): Promise<Assignment | undefined>;
  deleteAssignment(id: number): Promise<boolean>;

  // Submission management
  getSubmission(id: number): Promise<Submission | undefined>;
  getSubmissionsByAssignment(assignmentId: number): Promise<Submission[]>;
  getSubmissionsByStudent(studentId: number): Promise<Submission[]>;
  createSubmission(submission: InsertSubmission): Promise<Submission>;
  updateSubmission(id: number, data: Partial<InsertSubmission>): Promise<Submission | undefined>;
  deleteSubmission(id: number): Promise<boolean>;

  // Activity tracking
  getActivity(id: number): Promise<Activity | undefined>;
  getActivitiesByUser(userId: number): Promise<Activity[]>;
  getRecentActivities(limit: number): Promise<Activity[]>;
  createActivity(activity: InsertActivity): Promise<Activity>;

  // Analytics
  getEnrollmentStats(): Promise<{ date: string; count: number }[]>;
  getUserDistribution(): Promise<{ role: string; count: number }[]>;
  getCompletionRate(): Promise<number>;
  getPopularCourses(limit: number): Promise<Course[]>;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private courses: Map<number, Course>;
  private enrollments: Map<number, Enrollment>;
  private assignments: Map<number, Assignment>;
  private submissions: Map<number, Submission>;
  private activities: Map<number, Activity>;
  private userIdCounter: number;
  private courseIdCounter: number;
  private enrollmentIdCounter: number;
  private assignmentIdCounter: number;
  private submissionIdCounter: number;
  private activityIdCounter: number;

  constructor() {
    this.users = new Map();
    this.courses = new Map();
    this.enrollments = new Map();
    this.assignments = new Map();
    this.submissions = new Map();
    this.activities = new Map();
    this.userIdCounter = 1;
    this.courseIdCounter = 1;
    this.enrollmentIdCounter = 1;
    this.assignmentIdCounter = 1;
    this.submissionIdCounter = 1;
    this.activityIdCounter = 1;

    // Add some seed data
    this.seedData();
  }

  private seedData() {
    // Sample admin user
    this.createUser({
      username: "admin",
      password: "admin123",
      email: "admin@edulearn.com",
      firstName: "Alex",
      lastName: "Johnson",
      role: "admin",
      profileImage: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?ixlib=rb-1.2.1&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80"
    });

    // Sample faculty
    const faculty1 = this.createUser({
      username: "faculty1",
      password: "faculty123",
      email: "james@edulearn.com",
      firstName: "James",
      lastName: "Smith",
      role: "faculty",
      profileImage: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?ixlib=rb-1.2.1&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80"
    });

    // Sample students
    const student1 = this.createUser({
      username: "student1",
      password: "student123",
      email: "sarah@edulearn.com",
      firstName: "Sarah",
      lastName: "Chen",
      role: "student",
      profileImage: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?ixlib=rb-1.2.1&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80"
    });

    this.createUser({
      username: "student2",
      password: "student123",
      email: "robert@edulearn.com",
      firstName: "Robert",
      lastName: "Johnson",
      role: "student",
      profileImage: "https://images.unsplash.com/photo-1463453091185-61582044d556?ixlib=rb-1.2.1&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80"
    });

    // Sample courses
    const course1 = this.createCourse({
      title: "Introduction to Computer Science",
      description: "A beginner-friendly introduction to computer science principles.",
      facultyId: faculty1.id,
      category: "Computer Science",
      thumbnail: "",
      isActive: true
    });

    const course2 = this.createCourse({
      title: "UI/UX Design Principles",
      description: "Learn the fundamentals of UI/UX design for creating engaging user experiences.",
      facultyId: faculty1.id,
      category: "Design",
      thumbnail: "",
      isActive: true
    });

    const course3 = this.createCourse({
      title: "Data Science Fundamentals",
      description: "An introduction to data science concepts and techniques.",
      facultyId: faculty1.id,
      category: "Data Science",
      thumbnail: "",
      isActive: true
    });

    // Sample enrollments
    this.createEnrollment({
      studentId: student1.id,
      courseId: course1.id,
      completed: false,
      progress: 35
    });

    // Sample assignments
    const assignment1 = this.createAssignment({
      title: "Database Design",
      description: "Create a database schema for an e-commerce platform.",
      courseId: course1.id,
      dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
      maxScore: 100
    });

    // Sample submissions
    this.createSubmission({
      assignmentId: assignment1.id,
      studentId: student1.id,
      content: "Submission content here",
      score: 85,
      feedback: "Good job, but could improve the normalization."
    });

    // Sample activities
    this.createActivity({
      userId: student1.id,
      action: "Course Enrollment",
      detail: "Enrolled in \"Advanced Machine Learning\""
    });

    this.createActivity({
      userId: faculty1.id,
      action: "Content Updated",
      detail: "Updated \"Web Development\" materials"
    });
  }

  // User management
  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(u => u.username === username);
  }

  async getUsersByRole(role: string): Promise<User[]> {
    return Array.from(this.users.values()).filter(u => u.role === role);
  }

  async createUser(user: InsertUser): Promise<User> {
    const id = this.userIdCounter++;
    const newUser: User = { ...user, id };
    this.users.set(id, newUser);
    return newUser;
  }

  async updateUser(id: number, data: Partial<InsertUser>): Promise<User | undefined> {
    const user = this.users.get(id);
    if (!user) return undefined;
    
    const updatedUser = { ...user, ...data };
    this.users.set(id, updatedUser);
    return updatedUser;
  }

  async deleteUser(id: number): Promise<boolean> {
    return this.users.delete(id);
  }

  async getAllUsers(): Promise<User[]> {
    return Array.from(this.users.values());
  }

  // Course management
  async getCourse(id: number): Promise<Course | undefined> {
    return this.courses.get(id);
  }

  async getCoursesByFaculty(facultyId: number): Promise<Course[]> {
    return Array.from(this.courses.values()).filter(c => c.facultyId === facultyId);
  }

  async getActiveCourses(): Promise<Course[]> {
    return Array.from(this.courses.values()).filter(c => c.isActive);
  }

  async createCourse(course: InsertCourse): Promise<Course> {
    const id = this.courseIdCounter++;
    const newCourse: Course = { ...course, id };
    this.courses.set(id, newCourse);
    return newCourse;
  }

  async updateCourse(id: number, data: Partial<InsertCourse>): Promise<Course | undefined> {
    const course = this.courses.get(id);
    if (!course) return undefined;
    
    const updatedCourse = { ...course, ...data };
    this.courses.set(id, updatedCourse);
    return updatedCourse;
  }

  async deleteCourse(id: number): Promise<boolean> {
    return this.courses.delete(id);
  }

  async getAllCourses(): Promise<Course[]> {
    return Array.from(this.courses.values());
  }

  // Enrollment management
  async getEnrollment(id: number): Promise<Enrollment | undefined> {
    return this.enrollments.get(id);
  }

  async getEnrollmentsByStudent(studentId: number): Promise<Enrollment[]> {
    return Array.from(this.enrollments.values()).filter(e => e.studentId === studentId);
  }

  async getEnrollmentsByCourse(courseId: number): Promise<Enrollment[]> {
    return Array.from(this.enrollments.values()).filter(e => e.courseId === courseId);
  }

  async createEnrollment(enrollment: InsertEnrollment): Promise<Enrollment> {
    const id = this.enrollmentIdCounter++;
    const now = new Date();
    const newEnrollment: Enrollment = { 
      ...enrollment, 
      id, 
      enrollmentDate: now 
    };
    this.enrollments.set(id, newEnrollment);
    return newEnrollment;
  }

  async updateEnrollment(id: number, data: Partial<InsertEnrollment>): Promise<Enrollment | undefined> {
    const enrollment = this.enrollments.get(id);
    if (!enrollment) return undefined;
    
    const updatedEnrollment = { ...enrollment, ...data };
    this.enrollments.set(id, updatedEnrollment);
    return updatedEnrollment;
  }

  async deleteEnrollment(id: number): Promise<boolean> {
    return this.enrollments.delete(id);
  }

  // Assignment management
  async getAssignment(id: number): Promise<Assignment | undefined> {
    return this.assignments.get(id);
  }

  async getAssignmentsByCourse(courseId: number): Promise<Assignment[]> {
    return Array.from(this.assignments.values()).filter(a => a.courseId === courseId);
  }

  async createAssignment(assignment: InsertAssignment): Promise<Assignment> {
    const id = this.assignmentIdCounter++;
    const newAssignment: Assignment = { ...assignment, id };
    this.assignments.set(id, newAssignment);
    return newAssignment;
  }

  async updateAssignment(id: number, data: Partial<InsertAssignment>): Promise<Assignment | undefined> {
    const assignment = this.assignments.get(id);
    if (!assignment) return undefined;
    
    const updatedAssignment = { ...assignment, ...data };
    this.assignments.set(id, updatedAssignment);
    return updatedAssignment;
  }

  async deleteAssignment(id: number): Promise<boolean> {
    return this.assignments.delete(id);
  }

  // Submission management
  async getSubmission(id: number): Promise<Submission | undefined> {
    return this.submissions.get(id);
  }

  async getSubmissionsByAssignment(assignmentId: number): Promise<Submission[]> {
    return Array.from(this.submissions.values()).filter(s => s.assignmentId === assignmentId);
  }

  async getSubmissionsByStudent(studentId: number): Promise<Submission[]> {
    return Array.from(this.submissions.values()).filter(s => s.studentId === studentId);
  }

  async createSubmission(submission: InsertSubmission): Promise<Submission> {
    const id = this.submissionIdCounter++;
    const now = new Date();
    const newSubmission: Submission = { 
      ...submission, 
      id, 
      submissionDate: now 
    };
    this.submissions.set(id, newSubmission);
    return newSubmission;
  }

  async updateSubmission(id: number, data: Partial<InsertSubmission>): Promise<Submission | undefined> {
    const submission = this.submissions.get(id);
    if (!submission) return undefined;
    
    const updatedSubmission = { ...submission, ...data };
    this.submissions.set(id, updatedSubmission);
    return updatedSubmission;
  }

  async deleteSubmission(id: number): Promise<boolean> {
    return this.submissions.delete(id);
  }

  // Activity tracking
  async getActivity(id: number): Promise<Activity | undefined> {
    return this.activities.get(id);
  }

  async getActivitiesByUser(userId: number): Promise<Activity[]> {
    return Array.from(this.activities.values())
      .filter(a => a.userId === userId)
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
  }

  async getRecentActivities(limit: number): Promise<Activity[]> {
    return Array.from(this.activities.values())
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
      .slice(0, limit);
  }

  async createActivity(activity: InsertActivity): Promise<Activity> {
    const id = this.activityIdCounter++;
    const now = new Date();
    const newActivity: Activity = { 
      ...activity, 
      id, 
      timestamp: now 
    };
    this.activities.set(id, newActivity);
    return newActivity;
  }

  // Analytics
  async getEnrollmentStats(): Promise<{ date: string; count: number }[]> {
    const last12Months: { date: string; count: number }[] = [];
    const today = new Date();
    
    for (let i = 11; i >= 0; i--) {
      const month = new Date(today.getFullYear(), today.getMonth() - i, 1);
      const monthStr = month.toLocaleString('default', { month: 'short' });
      
      const enrollmentsInMonth = Array.from(this.enrollments.values()).filter(e => {
        const enrollDate = new Date(e.enrollmentDate);
        return enrollDate.getMonth() === month.getMonth() && 
               enrollDate.getFullYear() === month.getFullYear();
      });
      
      last12Months.push({
        date: monthStr,
        count: enrollmentsInMonth.length
      });
    }
    
    return last12Months;
  }

  async getUserDistribution(): Promise<{ role: string; count: number }[]> {
    const students = Array.from(this.users.values()).filter(u => u.role === 'student').length;
    const faculty = Array.from(this.users.values()).filter(u => u.role === 'faculty').length;
    const admins = Array.from(this.users.values()).filter(u => u.role === 'admin').length;
    
    return [
      { role: 'Students', count: students },
      { role: 'Faculty', count: faculty },
      { role: 'Admins', count: admins }
    ];
  }

  async getCompletionRate(): Promise<number> {
    const totalEnrollments = this.enrollments.size;
    if (totalEnrollments === 0) return 0;
    
    const completedEnrollments = Array.from(this.enrollments.values())
      .filter(e => e.completed).length;
    
    return Math.round((completedEnrollments / totalEnrollments) * 100 * 10) / 10;
  }

  async getPopularCourses(limit: number): Promise<Course[]> {
    const courseEnrollmentCount = new Map<number, number>();
    
    // Count enrollments per course
    Array.from(this.enrollments.values()).forEach(enrollment => {
      const count = courseEnrollmentCount.get(enrollment.courseId) || 0;
      courseEnrollmentCount.set(enrollment.courseId, count + 1);
    });
    
    // Sort courses by enrollment count
    const popularCourseIds = Array.from(courseEnrollmentCount.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, limit)
      .map(entry => entry[0]);
    
    // Get course details
    return popularCourseIds
      .map(id => this.courses.get(id))
      .filter((course): course is Course => course !== undefined);
  }
}

export const storage = new MemStorage();
