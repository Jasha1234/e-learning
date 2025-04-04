import { apiRequest } from "./queryClient";
import { 
  User, 
  Course, 
  Enrollment, 
  Assignment, 
  Submission, 
  Announcement
} from "@shared/schema";

// User API functions
export async function getUsers(): Promise<User[]> {
  const response = await apiRequest("GET", "/api/users");
  return response.json();
}

export async function getUser(id: number): Promise<User> {
  const response = await apiRequest("GET", `/api/users/${id}`);
  return response.json();
}

export async function createUser(user: Omit<User, "id">): Promise<User> {
  const response = await apiRequest("POST", "/api/users", user);
  return response.json();
}

export async function updateUser(id: number, user: Partial<User>): Promise<User> {
  const response = await apiRequest("PUT", `/api/users/${id}`, user);
  return response.json();
}

export async function deleteUser(id: number): Promise<void> {
  await apiRequest("DELETE", `/api/users/${id}`);
}

// Course API functions
export async function getCourses(params?: { facultyId?: number, studentId?: number }): Promise<Course[]> {
  let url = "/api/courses";
  if (params) {
    const queryParams = new URLSearchParams();
    if (params.facultyId) queryParams.append("facultyId", params.facultyId.toString());
    if (params.studentId) queryParams.append("studentId", params.studentId.toString());
    if (queryParams.toString()) url += `?${queryParams.toString()}`;
  }
  
  const response = await apiRequest("GET", url);
  return response.json();
}

export async function getCourse(id: number): Promise<Course> {
  const response = await apiRequest("GET", `/api/courses/${id}`);
  return response.json();
}

export async function createCourse(course: Omit<Course, "id">): Promise<Course> {
  const response = await apiRequest("POST", "/api/courses", course);
  return response.json();
}

export async function updateCourse(id: number, course: Partial<Course>): Promise<Course> {
  const response = await apiRequest("PUT", `/api/courses/${id}`, course);
  return response.json();
}

export async function deleteCourse(id: number): Promise<void> {
  await apiRequest("DELETE", `/api/courses/${id}`);
}

// Enrollment API functions
export async function getEnrollments(params?: { courseId?: number, studentId?: number }): Promise<Enrollment[]> {
  let url = "/api/enrollments";
  if (params) {
    const queryParams = new URLSearchParams();
    if (params.courseId) queryParams.append("courseId", params.courseId.toString());
    if (params.studentId) queryParams.append("studentId", params.studentId.toString());
    if (queryParams.toString()) url += `?${queryParams.toString()}`;
  }
  
  const response = await apiRequest("GET", url);
  return response.json();
}

export async function createEnrollment(enrollment: Omit<Enrollment, "id" | "enrollmentDate">): Promise<Enrollment> {
  const response = await apiRequest("POST", "/api/enrollments", enrollment);
  return response.json();
}

export async function updateEnrollment(id: number, enrollment: Partial<Enrollment>): Promise<Enrollment> {
  const response = await apiRequest("PUT", `/api/enrollments/${id}`, enrollment);
  return response.json();
}

export async function deleteEnrollment(id: number): Promise<void> {
  await apiRequest("DELETE", `/api/enrollments/${id}`);
}

// Assignment API functions
export async function getAssignments(courseId: number): Promise<Assignment[]> {
  const response = await apiRequest("GET", `/api/assignments?courseId=${courseId}`);
  return response.json();
}

export async function getAssignment(id: number): Promise<Assignment> {
  const response = await apiRequest("GET", `/api/assignments/${id}`);
  return response.json();
}

export async function createAssignment(assignment: Omit<Assignment, "id">): Promise<Assignment> {
  const response = await apiRequest("POST", "/api/assignments", assignment);
  return response.json();
}

export async function updateAssignment(id: number, assignment: Partial<Assignment>): Promise<Assignment> {
  const response = await apiRequest("PUT", `/api/assignments/${id}`, assignment);
  return response.json();
}

export async function deleteAssignment(id: number): Promise<void> {
  await apiRequest("DELETE", `/api/assignments/${id}`);
}

// Submission API functions
export async function getSubmissions(params: { assignmentId?: number, studentId?: number }): Promise<Submission[]> {
  let url = "/api/submissions";
  const queryParams = new URLSearchParams();
  if (params.assignmentId) queryParams.append("assignmentId", params.assignmentId.toString());
  if (params.studentId) queryParams.append("studentId", params.studentId.toString());
  url += `?${queryParams.toString()}`;
  
  const response = await apiRequest("GET", url);
  return response.json();
}

export async function getSubmission(id: number): Promise<Submission> {
  const response = await apiRequest("GET", `/api/submissions/${id}`);
  return response.json();
}

export async function createSubmission(submission: Omit<Submission, "id" | "submissionDate">): Promise<Submission> {
  const response = await apiRequest("POST", "/api/submissions", submission);
  return response.json();
}

export async function updateSubmission(id: number, submission: Partial<Submission>): Promise<Submission> {
  const response = await apiRequest("PUT", `/api/submissions/${id}`, submission);
  return response.json();
}

// Announcement API functions
export async function getAnnouncements(courseId?: number): Promise<Announcement[]> {
  let url = "/api/announcements";
  if (courseId) url += `?courseId=${courseId}`;
  
  const response = await apiRequest("GET", url);
  return response.json();
}

export async function createAnnouncement(announcement: Omit<Announcement, "id" | "datePosted">): Promise<Announcement> {
  const response = await apiRequest("POST", "/api/announcements", announcement);
  return response.json();
}

export async function updateAnnouncement(id: number, announcement: Partial<Announcement>): Promise<Announcement> {
  const response = await apiRequest("PUT", `/api/announcements/${id}`, announcement);
  return response.json();
}

export async function deleteAnnouncement(id: number): Promise<void> {
  await apiRequest("DELETE", `/api/announcements/${id}`);
}

// Analytics API functions
export async function getUserAnalytics(): Promise<{
  totalUsers: number;
  adminCount: number;
  facultyCount: number;
  studentCount: number;
}> {
  const response = await apiRequest("GET", "/api/analytics/users");
  return response.json();
}

export async function getCourseAnalytics(): Promise<{
  totalCourses: number;
  activeCount: number;
  inactiveCount: number;
  pendingCount: number;
}> {
  const response = await apiRequest("GET", "/api/analytics/courses");
  return response.json();
}

export async function getAssignmentAnalytics(): Promise<{
  totalAssignments: number;
  byStatus: {
    draftCount: number;
    publishedCount: number;
    closedCount: number;
  };
  byType: {
    assignmentCount: number;
    quizCount: number;
    examCount: number;
    projectCount: number;
  };
}> {
  const response = await apiRequest("GET", "/api/analytics/assignments");
  return response.json();
}

export async function getFacultyAnalytics(facultyId: number): Promise<{
  totalCourses: number;
  totalStudents: number;
  totalAssignments: number;
  pendingSubmissions: number;
  gradedSubmissions: number;
}> {
  const response = await apiRequest("GET", `/api/analytics/faculty/${facultyId}`);
  return response.json();
}

export async function getStudentAnalytics(studentId: number): Promise<{
  totalCourses: number;
  totalAssignments: number;
  completedAssignments: number;
  pendingAssignments: number;
  averageProgress: number;
}> {
  const response = await apiRequest("GET", `/api/analytics/student/${studentId}`);
  return response.json();
}
