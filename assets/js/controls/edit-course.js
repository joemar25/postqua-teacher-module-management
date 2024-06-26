const SUPABASE_URL = "https://hvqvmxakmursjidtfmdj.supabase.co";
const SUPABASE_ANON_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imh2cXZteGFrbXVyc2ppZHRmbWRqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MTg2MDA4MjQsImV4cCI6MjAzNDE3NjgyNH0.dykJM61G-58LEnAyCUU6-irano2f4vraV8t1l8C5KZ8";

const supabase_connection = supabase.createClient(
  SUPABASE_URL,
  SUPABASE_ANON_KEY
);

let currentCourseId;

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

async function fetchCourseDetails(courseId) {
  const { data, error } = await supabase_connection
    .from("courses")
    .select("*")
    .eq("id", courseId)
    .single();

  if (error) {
    console.error("Error fetching course details:", error);
    showNotification("Error fetching course details", true);
    return;
  }

  if (data) {
    document.getElementById("courseTitle").value = data.title;
    document.getElementById("courseDescription").value = data.description;
    document.getElementById("courseCategory").value = data.category || "";
  }
}

async function fetchChaptersLessonsAndQuizzes(courseId) {
  const { data: chapters, error: chaptersError } = await supabase_connection
    .from("chapters")
    .select("*")
    .eq("course_id", courseId)
    .order("order", { ascending: true });

  if (chaptersError) {
    console.error("Error fetching chapters:", chaptersError);
    showNotification("Error fetching chapters", true);
    return;
  }

  displayCurriculum(chapters);
}

function displayCurriculum(chapters) {
  const curriculumList = document.getElementById("curriculumList");
  if (!curriculumList) {
    console.error("Curriculum list element not found");
    return;
  }

  curriculumList.innerHTML = "";

  chapters.forEach((chapter) => {
    const chapterElement = document.createElement("div");
    chapterElement.className = "mt-4 p-4 bg-white rounded shadow";
    chapterElement.innerHTML = `
      <div class="flex items-center justify-between">
        <h3 class="font-semibold">${chapter.title}</h3>
        <div>
          <button class="expand-chapter px-2 py-1 text-sm text-blue-600" data-chapter-id="${chapter.id}">+</button>
          <button class="delete-chapter px-2 py-1 text-sm text-red-600" data-chapter-id="${chapter.id}">Delete</button>
        </div>
      </div>
      <div class="chapter-content hidden mt-2" id="chapter-content-${chapter.id}">
        <h4 class="font-medium mt-2">Lessons</h4>
        <ul class="lessons-list ml-4"></ul>
        <button class="create-subject mt-2 px-2 py-1 text-sm text-green-600" data-chapter-id="${chapter.id}">Create Subject</button>
        
        <h4 class="font-medium mt-4">Quizzes</h4>
        <ul class="quizzes-list ml-4"></ul>
        <button class="create-quiz mt-2 px-2 py-1 text-sm text-green-600" data-chapter-id="${chapter.id}">Create Quiz</button>
      </div>
    `;
    curriculumList.appendChild(chapterElement);
  });

  addEventListeners();
}

function addEventListeners() {
  document.querySelectorAll(".expand-chapter").forEach((button) => {
    button.addEventListener("click", (e) => {
      const chapterId = e.target.dataset.chapterId;
      const content = document.getElementById(`chapter-content-${chapterId}`);
      content.classList.toggle("hidden");
      e.target.textContent = content.classList.contains("hidden") ? "+" : "-";
    });
  });

  document.querySelectorAll(".delete-chapter").forEach((button) => {
    button.addEventListener("click", (e) => {
      const chapterId = e.target.dataset.chapterId;
      deleteChapter(chapterId);
    });
  });

  document.querySelectorAll(".create-subject").forEach((button) => {
    button.addEventListener("click", (e) => {
      const chapterId = e.target.dataset.chapterId;
      window.location.href = `create-subject.html?chapterId=${chapterId}`;
    });
  });

  document.querySelectorAll(".create-quiz").forEach((button) => {
    button.addEventListener("click", (e) => {
      const chapterId = e.target.dataset.chapterId;
      window.location.href = `create-quiz.html?chapterId=${chapterId}`;
    });
  });
}

async function updateCourse(event) {
  event.preventDefault();

  const updatedCourse = {
    title: document.getElementById("courseTitle").value,
    description: document.getElementById("courseDescription").value,
    category: document.getElementById("courseCategory").value,
  };

  const { data, error } = await supabase_connection
    .from("courses")
    .update(updatedCourse)
    .eq("id", currentCourseId);

  if (error) {
    console.error("Error updating course:", error);
    showNotification("Failed to update the course. Please try again.", true);
  } else {
    showNotification("Course updated successfully", false);
  }
}

function showAddChapterForm() {
  const form = document.getElementById("addChapterForm");
  if (!form) {
    console.error("Add chapter form not found");
    return;
  }

  form.innerHTML = `
    <input type="hidden" id="chapterCourseId" value="${currentCourseId}">
    <label class="block mt-4 text-sm">
      <span class="text-gray-700 dark:text-gray-400">Chapter Title</span>
      <input id="chapterTitle" class="form-input mt-1 block w-full" placeholder="Enter Chapter Title">
    </label>
    <label class="block mt-4 text-sm">
      <span class="text-gray-700 dark:text-gray-400">Chapter Order</span>
      <input id="chapterOrder" type="number" class="form-input mt-1 block w-full" placeholder="Enter Chapter Order">
    </label>
    <button type="button" id="submitChapter" class="mt-4 px-4 py-2 text-sm font-medium leading-5 text-white transition-colors duration-150 bg-purple-600 border border-transparent rounded-lg active:bg-purple-600 hover:bg-purple-700 focus:outline-none focus:shadow-outline-purple">
      Add Chapter
    </button>
  `;
  document
    .getElementById("submitChapter")
    .addEventListener("click", addChapter);
}

async function addChapter() {
  const chapterTitle = document.getElementById("chapterTitle").value.trim();
  const chapterOrder = document.getElementById("chapterOrder").value.trim();

  if (!chapterTitle || !chapterOrder) {
    showNotification("Please enter both chapter title and order.", true);
    return;
  }

  const { data, error } = await supabase_connection.from("chapters").insert([
    {
      course_id: currentCourseId,
      title: chapterTitle,
      order: parseInt(chapterOrder),
    },
  ]);

  if (error) {
    console.error("Error adding chapter:", error);
    showNotification("Failed to add chapter. Please try again.", true);
  } else {
    showNotification("Chapter added successfully", false);
    fetchChaptersLessonsAndQuizzes(currentCourseId);
    document.getElementById("addChapterForm").innerHTML = "";
  }
}

async function deleteChapter(chapterId) {
  if (confirm("Are you sure you want to delete this chapter?")) {
    const { data, error } = await supabase_connection
      .from("chapters")
      .delete()
      .eq("id", chapterId);

    if (error) {
      console.error("Error deleting chapter:", error);
      showNotification("Failed to delete chapter. Please try again.", true);
    } else {
      showNotification("Chapter deleted successfully", false);
      fetchChaptersLessonsAndQuizzes(currentCourseId);
    }
  }
}

document.addEventListener("DOMContentLoaded", () => {
  const urlParams = new URLSearchParams(window.location.search);
  currentCourseId = urlParams.get("id");

  if (currentCourseId) {
    fetchCourseDetails(currentCourseId);
    fetchChaptersLessonsAndQuizzes(currentCourseId);

    const courseDetailsForm = document.getElementById("courseDetailsForm");
    if (courseDetailsForm) {
      courseDetailsForm.addEventListener("submit", updateCourse);
    }

    const addChapterButton = document.getElementById("addChapterButton");
    if (addChapterButton) {
      addChapterButton.addEventListener("click", showAddChapterForm);
    }
  } else {
    console.error("No course ID provided");
    showNotification("No course ID provided", true);
  }
});
