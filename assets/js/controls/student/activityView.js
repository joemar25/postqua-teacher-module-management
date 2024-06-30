const SUPABASE_URL = "https://hvqvmxakmursjidtfmdj.supabase.co";
const SUPABASE_ANON_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imh2cXZteGFrbXVyc2ppZHRmbWRqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MTg2MDA4MjQsImV4cCI6MjAzNDE3NjgyNH0.dykJM61G-58LEnAyCUU6-irano2f4vraV8t1l8C5KZ8";

let supabase_connection;

document.addEventListener("DOMContentLoaded", async () => {
  if (!supabase_connection) {
    initializeSupabase();
  }
  await loadActivityData();
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

async function loadActivityData() {
  const urlParams = new URLSearchParams(window.location.search);
  const activityId = urlParams.get("activityId");

  if (!activityId) {
    alert("Activity ID not provided");
    return;
  }

  try {
    const { data: activityData, error: activityError } =
      await supabase_connection
        .from("activities")
        .select("*")
        .eq("id", activityId)
        .single();

    if (activityError) throw activityError;

    document.getElementById("activityTitle").textContent = activityData.title;
    document.getElementById("activityDescription").textContent =
      activityData.description;
    document.getElementById(
      "activityType"
    ).textContent = `Type: ${activityData.type}`;
    document.getElementById(
      "activityDueDate"
    ).textContent = `Due Date: ${new Date(
      activityData.due_date
    ).toLocaleString()}`;
  } catch (error) {
    console.error("Error loading activity data:", error);
    showNotification("Failed to load activity data. Please try again.", true);
  }
}
