const SUPABASE_URL = "https://hvqvmxakmursjidtfmdj.supabase.co";
const SUPABASE_ANON_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imh2cXZteGFrbXVyc2ppZHRmbWRqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MTg2MDA4MjQsImV4cCI6MjAzNDE3NjgyNH0.dykJM61G-58LEnAyCUU6-irano2f4vraV8t1l8C5KZ8";

let supabase_connection;

document.addEventListener("DOMContentLoaded", async () => {
  initializeSupabase();
  await fetchClasses();
});

function initializeSupabase() {
  supabase_connection = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
}

async function fetchClasses() {
  const studentId = 3;

  try {
    const { data: classes, error } = await supabase_connection
      .from("class_students")
      .select(
        `
        *,
        classes (
          *,
          courses ( id, title, teacher_id )
        )
      `
      )
      .eq("student_id", studentId);

    if (error) throw error;

    // Fetch teachers' information
    const teacherIds = classes.map((cls) => cls.classes.courses.teacher_id);
    const { data: teachers, error: teacherError } = await supabase_connection
      .from("teachers")
      .select("id, first_name, last_name")
      .in("id", teacherIds);

    if (teacherError) throw teacherError;

    const teachersMap = Object.fromEntries(
      teachers.map((teacher) => [
        teacher.id,
        `${teacher.first_name} ${teacher.last_name}`,
      ])
    );

    displayClasses(classes, teachersMap);
  } catch (error) {
    console.error("Error fetching classes:", error);
    alert("Failed to fetch classes. Please try again.");
  }
}

function displayClasses(classStudents, teachersMap) {
  const classCardsContainer = document.getElementById("classCards");
  classCardsContainer.innerHTML = "";

  classStudents.forEach((classStudent) => {
    const class_ = classStudent.classes;
    const teacherName = teachersMap[class_.courses.teacher_id];

    const card = document.createElement("div");
    card.className =
      "flex items-center p-4 bg-white rounded-lg shadow-xs dark:bg-gray-800 cursor-pointer";
    card.innerHTML = `
      <div class="p-3 mr-4 text-orange-500 bg-orange-100 rounded-full dark:text-orange-100 dark:bg-orange-500">
        <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
          <path
            d="M10 2a6 6 0 00-6 6v3.586l-.707.707A1 1 0 004 14h12a1 1 0 00.707-1.707L16 11.586V8a6 6 0 00-6-6zM10 18a3 3 0 01-3-3h6a3 3 0 01-3 3z">
          </path>
        </svg>
      </div>
      <div>
        <p class="mb-2 text-sm font-medium text-gray-600 dark:text-gray-400">
          ${class_.courses.title}
        </p>
        <p class="text-lg font-semibold text-gray-700 dark:text-gray-200">
          ${class_.class_name}
        </p>
        <p class="text-sm text-gray-500 dark:text-gray-400">
          Teacher: ${teacherName}
        </p>
      </div>
    `;

    card.addEventListener("click", () => {
      window.location.href = `student-class-view.html?classId=${class_.id}`;
    });

    classCardsContainer.appendChild(card);
  });
}
