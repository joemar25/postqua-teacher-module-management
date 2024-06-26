// assets/js/controls/edit-course.js

const SUPABASE_URL = "https://hvqvmxakmursjidtfmdj.supabase.co";
const SUPABASE_ANON_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imh2cXZteGFrbXVyc2ppZHRmbWRqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MTg2MDA4MjQsImV4cCI6MjAzNDE3NjgyNH0.dykJM61G-58LEnAyCUU6-irano2f4vraV8t1l8C5KZ8";

const supabase = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

let currentCourseId;

document.addEventListener("DOMContentLoaded", () => {
  const urlParams = new URLSearchParams(window.location.search);
  currentCourseId = urlParams.get("id");

  if (currentCourseId) {
    fetchCourseDetails(currentCourseId);
  } else {
    console.error("No course ID provided");
  }

  // Add event listener to the form submission
  document.querySelector("form").addEventListener("submit", updateCourse);
});

async function fetchCourseDetails(courseId) {
  const { data, error } = await supabase
    .from("courses")
    .select("*")
    .eq("id", courseId)
    .single();

  if (error) {
    console.error("Error fetching course details:", error);
    return;
  }

  if (data) {
    // Populate the form fields with the course data
    document.getElementById("courseTitle").value = data.title;
    document.getElementById("courseDescription").value = data.description;
    document.getElementById("courseCategory").value = data.category;
    // Add more fields as necessary
  }
}

async function updateCourse(event) {
  event.preventDefault();

  const updatedCourse = {
    title: document.getElementById("courseTitle").value,
    description: document.getElementById("courseDescription").value,
    category: document.getElementById("courseCategory").value,
    // Add more fields as necessary
  };

  const { data, error } = await supabase
    .from("courses")
    .update(updatedCourse)
    .eq("id", currentCourseId);

  if (error) {
    console.error("Error updating course:", error);
    alert("Failed to update the course. Please try again.");
  } else {
    alert("Course updated successfully");
    // Redirect back to the courses page
    window.location.href = "courses.html";
  }
}
