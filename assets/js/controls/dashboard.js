// assets/js/controls/dashboard.js

const SUPABASE_URL = "https://hvqvmxakmursjidtfmdj.supabase.co";
const SUPABASE_ANON_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imh2cXZteGFrbXVyc2ppZHRmbWRqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MTg2MDA4MjQsImV4cCI6MjAzNDE3NjgyNH0.dykJM61G-58LEnAyCUU6-irano2f4vraV8t1l8C5KZ8";

const supabase_connection = supabase.createClient(
  SUPABASE_URL,
  SUPABASE_ANON_KEY
);

// Fetch all students data
async function fetchAllStudentsData() {
  const { data, error } = await supabase_connection
    .from("tbl_student")
    .select("*");

  if (error) {
    console.error("Error fetching student data:", error);
    return null;
  }
  return data;
}

// Fetch courses for a specific teacher
async function fetchTeacherCourses(teacherId) {
  const { data, error } = await supabase_connection
    .from("courses")
    .select("*")
    .eq("teacher_id", teacherId);

  if (error) {
    console.error("Error fetching teacher courses:", error);
    return null;
  }
  return data;
}

// Fetch classes for a specific teacher
async function fetchTeacherClasses(teacherId) {
  const { data, error } = await supabase_connection
    .from("classes")
    .select("*")
    .eq("course_id", teacherId);

  if (error) {
    console.error("Error fetching teacher classes:", error);
    return null;
  }
  return data;
}

// Update dashboard counters
function updateDashboardCounters(students, courses, classes) {
  const totalStudents = students ? students.length : 0;
  const activeCourses = courses ? courses.length : 0;
  const activeClasses = classes ? classes.length : 0;

  document.getElementById("activeCoursesCount").textContent = activeCourses;
  document.getElementById("activeClassesCount").textContent = activeClasses;
  document.getElementById("totalStudentCount").textContent = totalStudents;
}

// Main function to fetch all data and update dashboard
async function updateDashboard() {
  const teacherId = 1;

  const studentsData = await fetchAllStudentsData();
  const coursesData = await fetchTeacherCourses(teacherId);
  const classesData = await fetchTeacherClasses(teacherId);

  console.log("Students:", studentsData);
  console.log("Courses:", coursesData);
  console.log("Classes:", classesData);

  updateDashboardCounters(studentsData, coursesData, classesData);
}

document.addEventListener("DOMContentLoaded", updateDashboard);
