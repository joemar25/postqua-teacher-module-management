const SUPABASE_URL = "https://hvqvmxakmursjidtfmdj.supabase.co";
const SUPABASE_ANON_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imh2cXZteGFrbXVyc2ppZHRmbWRqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MTg2MDA4MjQsImV4cCI6MjAzNDE3NjgyNH0.dykJM61G-58LEnAyCUU6-irano2f4vraV8t1l8C5KZ8";

let supabase_connection;

document.addEventListener("DOMContentLoaded", async () => {
  if (!supabase_connection) {
    initializeSupabase();
  }
  await loadLessonData();
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

async function loadLessonData() {
  const urlParams = new URLSearchParams(window.location.search);
  const lessonId = urlParams.get("lessonId");

  if (!lessonId) {
    alert("Lesson ID not provided");
    return;
  }

  try {
    const { data: lessonData, error: lessonError } = await supabase_connection
      .from("lessons")
      .select("*")
      .eq("id", lessonId)
      .single();

    if (lessonError) throw lessonError;

    document.getElementById("lessonTitle").textContent = lessonData.title;
    document.getElementById("lessonContent").textContent = lessonData.content;
  } catch (error) {
    console.error("Error loading lesson data:", error);
    showNotification("Failed to load lesson data. Please try again.", true);
  }
}
