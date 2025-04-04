// Function to generate random data for activity charts
export function getActivityData(timeframe: "daily" | "weekly" | "monthly") {
  const data = [];
  
  if (timeframe === "daily") {
    // Generate 24 hours of data
    for (let i = 0; i < 24; i++) {
      data.push({
        name: `${i}:00`,
        activeUsers: Math.floor(Math.random() * 80) + 20,
        pageViews: Math.floor(Math.random() * 200) + 50,
      });
    }
  } else if (timeframe === "weekly") {
    // Generate 7 days of data
    const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
    for (let i = 0; i < 7; i++) {
      data.push({
        name: days[i],
        activeUsers: Math.floor(Math.random() * 500) + 200,
        pageViews: Math.floor(Math.random() * 1200) + 300,
      });
    }
  } else if (timeframe === "monthly") {
    // Generate 30 days of data
    for (let i = 1; i <= 30; i++) {
      data.push({
        name: `${i}`,
        activeUsers: Math.floor(Math.random() * 800) + 300,
        pageViews: Math.floor(Math.random() * 2000) + 500,
      });
    }
  }
  
  return data;
}

// Function to generate assignment distribution data
export function getAssignmentDistributionData() {
  return [
    { name: "Assignments", value: 35 },
    { name: "Quizzes", value: 20 },
    { name: "Projects", value: 15 },
    { name: "Exams", value: 10 }
  ];
}

// Function to generate grade distribution data
export function getGradeDistributionData() {
  return [
    { name: "A", value: 25 },
    { name: "B", value: 35 },
    { name: "C", value: 20 },
    { name: "D", value: 15 },
    { name: "F", value: 5 }
  ];
}

// Function to generate course progress data for student
export function getCourseProgressData() {
  return [
    { name: "Week 1", progress: 100 },
    { name: "Week 2", progress: 100 },
    { name: "Week 3", progress: 90 },
    { name: "Week 4", progress: 80 },
    { name: "Week 5", progress: 70 },
    { name: "Week 6", progress: 60 },
    { name: "Week 7", progress: 40 },
    { name: "Week 8", progress: 20 },
    { name: "Week 9", progress: 0 },
    { name: "Week 10", progress: 0 }
  ];
}

// Function to generate student performance data
export function getStudentPerformanceData(courseId?: number) {
  // In a real application, this would filter based on courseId
  return [
    { name: "Assignment 1", score: 85 },
    { name: "Quiz 1", score: 90 },
    { name: "Assignment 2", score: 78 },
    { name: "Project 1", score: 92 },
    { name: "Quiz 2", score: 88 },
    { name: "Assignment 3", score: 95 }
  ];
}
