const SUPABASE_URL = "https://hvqvmxakmursjidtfmdj.supabase.co";
const SUPABASE_ANON_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imh2cXZteGFrbXVyc2ppZHRmbWRqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MTg2MDA4MjQsImV4cCI6MjAzNDE3NjgyNH0.dykJM61G-58LEnAyCUU6-irano2f4vraV8t1l8C5KZ8";

let supabase_connection;

document.addEventListener("DOMContentLoaded", async () => {
  if (!supabase_connection) {
    initializeSupabase();
  }
  await loadAssignmentsData();
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

async function loadAssignmentsData() {
  const studentId = 3; // Example student ID, replace with dynamic data if needed

  try {
    const { data: classes, error: classesError } = await supabase_connection
      .from("class_students")
      .select(
        `
        *,
        classes (
          *,
          courses ( id, title )
        )
      `
      )
      .eq("student_id", studentId);

    if (classesError) throw classesError;

    const courseIds = classes.map(
      (classStudent) => classStudent.classes.course_id
    );

    const { data: assignments, error: assignmentsError } =
      await supabase_connection
        .from("activities")
        .select("*")
        .in("course_id", courseIds)
        .eq("type", "assignment")
        .order("due_date", { ascending: true });

    if (assignmentsError) throw assignmentsError;

    displayAssignments(assignments);
  } catch (error) {
    console.error("Error loading assignments data:", error);
    showNotification(
      "Failed to load assignments data. Please try again.",
      true
    );
  }
}

function displayAssignments(assignments) {
  const assignmentsContainer = document.getElementById("assignmentsContainer");
  assignmentsContainer.innerHTML = "";

  if (!assignments || assignments.length === 0) {
    assignmentsContainer.innerHTML = `<p class='text-sm text-gray-600 dark:text-gray-400'>No assignments available.</p>`;
    return;
  }

  assignments.forEach((assignment) => {
    const assignmentItem = document.createElement("div");
    assignmentItem.className =
      "p-4 bg-white rounded-lg shadow-xs dark:bg-gray-800 mb-4";
    assignmentItem.innerHTML = `
      <h4 class="text-sm font-medium text-gray-800 dark:text-gray-300">${
        assignment.title
      }</h4>
      <p class="text-xs text-gray-600 dark:text-gray-400 mt-1">${
        assignment.description
      }</p>
      <p class="text-xs text-red-500 dark:text-red-400 mt-1">Due: ${new Date(
        assignment.due_date
      ).toLocaleString()}</p>
    `;
    assignmentsContainer.appendChild(assignmentItem);
  });
}
