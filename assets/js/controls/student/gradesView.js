const SUPABASE_URL = "https://hvqvmxakmursjidtfmdj.supabase.co";
const SUPABASE_ANON_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imh2cXZteGFrbXVyc2ppZHRmbWRqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MTg2MDA4MjQsImV4cCI6MjAzNDE3NjgyNH0.dykJM61G-58LEnAyCUU6-irano2f4vraV8t1l8C5KZ8";

let supabase_connection;

document.addEventListener("DOMContentLoaded", async () => {
  if (!supabase_connection) {
    initializeSupabase();
  }
  await loadGradesData();
});

function initializeSupabase() {
  supabase_connection = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
}

function showNotification(message, isError = true) {
  const notification = document.getElementById("notification");
  if (notification) {
    notification.textContent = message;
    notification.classList.remove("opacity-0");
    notification.classList.add("opacity-100");

    if (isError) {
      notification.classList.remove("bg-green-500");
      notification.classList.add("bg-red-500");
    } else {
      notification.classList.remove("bg-red-500");
      notification.classList.add("bg-green-500");
    }

    setTimeout(() => {
      notification.classList.remove("opacity-100");
      notification.classList.add("opacity-0");
    }, 3000);
  } else {
    console.error("Notification element not found");
  }
}

async function loadGradesData() {
  const studentId = 3; // Example student ID, replace with dynamic data if needed

  try {
    const { data: grades, error: gradesError } = await supabase_connection
      .from("grades")
      .select("*")
      .eq("student_id", studentId);

    if (gradesError) throw gradesError;

    displayGrades(grades);
  } catch (error) {
    console.error("Error loading grades data:", error);
    showNotification("Failed to load grades data. Please try again.", true);
  }
}

function displayGrades(grades) {
  const gradesContainer = document.getElementById("gradesContainer");
  gradesContainer.innerHTML = "";

  if (!grades || grades.length === 0) {
    gradesContainer.innerHTML = `<p class='text-sm text-gray-600 dark:text-gray-400'>No grades available.</p>`;
    return;
  }

  grades.forEach((grade) => {
    const gradeItem = document.createElement("div");
    gradeItem.className =
      "p-4 bg-white rounded-lg shadow-xs dark:bg-gray-800 mb-4";
    gradeItem.innerHTML = `
      <h4 class="text-sm font-medium text-gray-800 dark:text-gray-300">${
        grade.course_title
      }</h4>
      <p class="text-xs text-gray-600 dark:text-gray-400 mt-1">Grade: ${
        grade.grade
      }</p>
      <p class="text-xs text-gray-600 dark:text-gray-400 mt-1">Date: ${new Date(
        grade.date
      ).toLocaleDateString()}</p>
    `;
    gradesContainer.appendChild(gradeItem);
  });
}
