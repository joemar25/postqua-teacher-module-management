// assets/js/controls/courses.js

const SUPABASE_URL = "https://hvqvmxakmursjidtfmdj.supabase.co";
const SUPABASE_ANON_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imh2cXZteGFrbXVyc2ppZHRmbWRqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MTg2MDA4MjQsImV4cCI6MjAzNDE3NjgyNH0.dykJM61G-58LEnAyCUU6-irano2f4vraV8t1l8C5KZ8";

const supabase_connection = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function fetchCourseData(teacherId) {
  const { data, error } = await supabase_connection
    .from("courses")
    .select(
      `
      id,
      title,
      description,
      category,
      chapters (
        id,
        lessons (id),
        quizzes (id)
      ),
      classes (
        class_students (id)
      )
    `
    )
    .eq("teacher_id", teacherId);

  if (error) {
    console.error("Error fetching course data:", error);
    return null;
  }
  return data;
}

function countCoursesItems(courses) {
  return courses.map((course) => ({
    id: course.id,
    title: course.title,
    category: course.category,
    quizCount: course.chapters.reduce(
      (sum, chapter) => sum + chapter.quizzes.length,
      0
    ),
    lessonCount: course.chapters.reduce(
      (sum, chapter) => sum + chapter.lessons.length,
      0
    ),
    studentCount: course.classes.reduce(
      (sum, class_) => sum + class_.class_students.length,
      0
    ),
  }));
}

function updateCoursesTable(coursesData) {
  const tableBody = document.querySelector("table tbody");
  tableBody.innerHTML = ""; // Clear existing rows

  coursesData.forEach((course) => {
    const row = document.createElement("tr");
    row.className = "text-gray-700 dark:text-gray-400";
    row.innerHTML = `
      <td class="px-4 py-3">
        <div class="flex items-center text-sm">
          <div>
            <p class="text-xs text-gray-600 dark:text-gray-400">
              ${course.title}
            </p>
          </div>
        </div>
      </td>
      <td class="px-4 py-3">
        <div class="flex items-center text-sm">
          <div>
            <p class="text-xs text-gray-600 dark:text-gray-400">
              ${course.category}
            </p>
          </div>
        </div>
      </td>
      <td class="px-4 py-3 text-sm">
        <div class="flex items-center text-sm">
          <div>
            <p class="text-xs text-gray-600 dark:text-gray-400">
              ${course.quizCount}
            </p>
          </div>
        </div>
      </td>
      <td class="px-4 py-3 text-xs">
        <div class="flex items-center text-sm">
          <div>
            <p class="text-xs text-gray-600 dark:text-gray-400">
              ${course.lessonCount}
            </p>
          </div>
        </div>
      </td>
      <td class="px-4 py-3 text-sm">
        <div class="flex items-center text-sm">
          <div>
            <p class="text-xs text-gray-600 dark:text-gray-400">
              ${course.studentCount}
            </p>
          </div>
        </div>
      </td>
      <td class="px-4 py-3">
        <div class="flex items-center space-x-4 text-sm">
          <button
            class="flex items-center justify-between px-2 py-2 text-sm font-medium leading-5 text-purple-600 rounded-lg dark:text-gray-400 focus:outline-none focus:shadow-outline-gray"
            aria-label="Edit"
            onclick="editCourse(${course.id})">
            <svg class="w-5 h-5" aria-hidden="true" fill="currentColor" viewBox="0 0 20 20">
              <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z"></path>
            </svg>
          </button>
          <button
            class="flex items-center justify-between px-2 py-2 text-sm font-medium leading-5 text-purple-600 rounded-lg dark:text-gray-400 focus:outline-none focus:shadow-outline-gray"
            aria-label="Delete"
            onclick="deleteCourse(${course.id})">
            <svg class="w-5 h-5" aria-hidden="true" fill="currentColor" viewBox="0 0 20 20">
              <path fill-rule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clip-rule="evenodd"></path>
            </svg>
          </button>
        </div>
      </td>
    `;
    tableBody.appendChild(row);
  });
}

function editCourse(courseId) {
  // Redirect to the edit page with the course ID
  window.location.href = `edit-course.html?id=${courseId}`;
}

async function deleteCourse(courseId) {
  if (confirm("Are you sure you want to delete this course?")) {
    const { data, error } = await supabase
      .from("courses")
      .delete()
      .eq("id", courseId);

    if (error) {
      console.error("Error deleting course:", error);
      alert("Failed to delete the course. Please try again.");
    } else {
      alert("Course deleted successfully");
      // Refresh the course list
      updateCoursesPage();
    }
  }
}

async function updateCoursesPage() {
  const teacherId = 1; // Replace with actual teacher ID when authentication is implemented
  const coursesData = await fetchCourseData(teacherId);

  if (coursesData) {
    const processedData = countCoursesItems(coursesData);
    updateCoursesTable(processedData);
  }
}

document.addEventListener("DOMContentLoaded", updateCoursesPage);
