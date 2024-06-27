const SUPABASE_URL = "https://hvqvmxakmursjidtfmdj.supabase.co";
const SUPABASE_ANON_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imh2cXZteGFrbXVyc2ppZHRmbWRqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MTg2MDA4MjQsImV4cCI6MjAzNDE3NjgyNH0.dykJM61G-58LEnAyCUU6-irano2f4vraV8t1l8C5KZ8";

let supabase_connection;
let currentClassId;

document.addEventListener("DOMContentLoaded", async () => {
  initializeSupabase();
  setupEventListeners();

  currentClassId = new URLSearchParams(window.location.search).get("classId");
  if (currentClassId) {
    await Promise.all([
      loadClassData(currentClassId),
      loadStream(currentClassId),
      loadChapters(currentClassId),
      loadStudents(currentClassId),
    ]);
  } else {
    console.error("No class ID provided in URL");
  }
});

function initializeSupabase() {
  supabase_connection = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
}

function setupEventListeners() {
  document.querySelectorAll("nav a").forEach((tab) => {
    tab.addEventListener("click", (e) => {
      e.preventDefault();
      switchTab(tab.id.replace("Tab", ""));
    });
  });

  document.getElementById("postForm").addEventListener("submit", createPost);
}

function switchTab(tabName) {
  ["stream", "classwork", "people"].forEach((tab) => {
    const tabElement = document.getElementById(`${tab}Tab`);
    const sectionElement = document.getElementById(`${tab}Section`);

    if (tab === tabName) {
      tabElement.classList.add("border-blue-500", "text-blue-600");
      tabElement.classList.remove("border-transparent", "text-gray-500");
      sectionElement.classList.remove("hidden");
    } else {
      tabElement.classList.remove("border-blue-500", "text-blue-600");
      tabElement.classList.add("border-transparent", "text-gray-500");
      sectionElement.classList.add("hidden");
    }
  });
}

async function loadClassData(classId) {
  try {
    const { data, error } = await supabase_connection
      .from("classes")
      .select("*, courses(title)")
      .eq("id", classId)
      .single();

    if (error) throw error;

    document.getElementById(
      "className"
    ).textContent = `${data.class_name} - ${data.courses.title}`;
  } catch (error) {
    console.error("Error loading class data:", error);
  }
}

async function loadStream(classId) {
  await Promise.all([loadCurriculumOverview(classId), loadPosts(classId)]);
}

async function loadCurriculumOverview(classId) {
  try {
    const { data: classData, error: classError } = await supabase_connection
      .from("classes")
      .select("course_id")
      .eq("id", classId)
      .single();

    if (classError) throw classError;

    const { data: chapters, error: chaptersError } = await supabase_connection
      .from("chapters")
      .select("*")
      .eq("course_id", classData.course_id)
      .order("order");

    if (chaptersError) throw chaptersError;

    const overviewContainer = document.getElementById("curriculumOverview");
    overviewContainer.innerHTML =
      '<h2 class="text-xl font-bold mb-4">Course Curriculum</h2>';

    if (chapters.length === 0) {
      overviewContainer.innerHTML +=
        "<p>No chapters available for this course.</p>";
      return;
    }

    const chapterList = document.createElement("ul");
    chapterList.className = "list-disc pl-5";

    chapters.forEach((chapter) => {
      const chapterItem = document.createElement("li");
      chapterItem.textContent = chapter.title;
      chapterList.appendChild(chapterItem);
    });

    overviewContainer.appendChild(chapterList);

    // Populate the chapter select for posts
    const postChapterSelect = document.getElementById("postChapter");
    postChapterSelect.innerHTML = "<option value=''>Select a chapter</option>";
    chapters.forEach((chapter) => {
      const option = document.createElement("option");
      option.value = chapter.id;
      option.textContent = chapter.title;
      postChapterSelect.appendChild(option);
    });
  } catch (error) {
    console.error("Error loading curriculum overview:", error);
    document.getElementById("curriculumOverview").innerHTML =
      "<p>Failed to load curriculum overview. Please try again.</p>";
  }
}

async function loadPosts(classId) {
  try {
    const { data: posts, error } = await supabase_connection
      .from("tbl_feeds")
      .select("*")
      .eq("class_id", classId)
      .order("created_at", { ascending: false });

    if (error) throw error;

    displayPosts(posts);
  } catch (error) {
    console.error("Error loading posts:", error);
    document.getElementById("postsList").innerHTML =
      "<p>Failed to load posts. Please try again.</p>";
  }
}

function displayPosts(posts) {
  const postsList = document.getElementById("postsList");
  postsList.innerHTML = "";

  posts.forEach((post) => {
    const postElement = document.createElement("div");
    postElement.className =
      "bg-white dark:bg-gray-800 shadow sm:rounded-lg mb-4";
    postElement.innerHTML = `
      <div class="px-4 py-5 sm:p-6">
        <div class="flex justify-between items-center mb-4">
          <h3 class="text-lg leading-6 font-medium text-gray-900 dark:text-gray-200">
            ${new Date(post.created_at).toLocaleString()}
          </h3>
          <button onclick="deletePost(${
            post.id
          })" class="text-red-600 hover:text-red-800">
            Delete
          </button>
        </div>
        <p class="mt-2 text-sm text-gray-500 dark:text-gray-400">${
          post.content
        }</p>
        ${
          post.chapter_id
            ? `<p class="mt-2 text-xs text-gray-400">Chapter ID: ${post.chapter_id}</p>`
            : ""
        }
      </div>
    `;
    postsList.appendChild(postElement);
  });
}

async function createPost(event) {
  event.preventDefault();
  const content = document.getElementById("postContent").value;
  const chapterId = document.getElementById("postChapter").value;

  if (!content.trim()) return;

  try {
    const { error } = await supabase_connection
      .from("tbl_feeds")
      .insert([
        { class_id: currentClassId, content, chapter_id: chapterId || null },
      ]);

    if (error) throw error;

    document.getElementById("postContent").value = "";
    document.getElementById("postChapter").value = "";
    await loadPosts(currentClassId);
  } catch (error) {
    console.error("Error creating post:", error);
  }
}

async function deletePost(postId) {
  if (!confirm("Are you sure you want to delete this post?")) return;

  try {
    const { error } = await supabase_connection
      .from("tbl_feeds")
      .delete()
      .eq("id", postId);

    if (error) throw error;

    await loadPosts(currentClassId);
  } catch (error) {
    console.error("Error deleting post:", error);
  }
}

async function loadChapters(classId) {
  const chaptersSection = document.getElementById("classworkSection");
  chaptersSection.innerHTML =
    "<h3 class='text-lg font-medium text-gray-900 dark:text-gray-200 mb-4'>Classwork</h3>";

  try {
    const { data: classData, error: classError } = await supabase_connection
      .from("classes")
      .select("course_id")
      .eq("id", classId)
      .single();

    if (classError) throw classError;

    const { data: chapters, error: chaptersError } = await supabase_connection
      .from("chapters")
      .select("*")
      .eq("course_id", classData.course_id)
      .order("order");

    if (chaptersError) throw chaptersError;

    if (chapters.length === 0) {
      chaptersSection.innerHTML +=
        "<p>No chapters available for this course.</p>";
      return;
    }

    const chaptersList = document.createElement("ul");
    chaptersList.className = "space-y-4";

    chapters.forEach((chapter) => {
      const chapterItem = document.createElement("li");
      chapterItem.className = "bg-white p-4 rounded shadow";
      chapterItem.innerHTML = `
        <h3 class="text-lg font-semibold">${chapter.title}</h3>
        <p class="text-sm text-gray-600">${
          chapter.description || "No description available."
        }</p>
      `;
      chaptersList.appendChild(chapterItem);
    });

    chaptersSection.appendChild(chaptersList);
  } catch (error) {
    console.error("Error loading chapters:", error);
    chaptersSection.innerHTML +=
      "<p>Failed to load chapters. Please try again.</p>";
  }
}

async function loadStudents(classId) {
  const studentsSection = document.getElementById("peopleSection");
  studentsSection.innerHTML =
    "<h3 class='text-lg font-medium text-gray-900 dark:text-gray-200 mb-4'>People</h3>";

  try {
    const { data: students, error } = await supabase_connection
      .from("class_students")
      .select("*, tbl_student(*)")
      .eq("class_id", classId);

    if (error) throw error;

    if (students.length === 0) {
      studentsSection.innerHTML += "<p>No students enrolled in this class.</p>";
      return;
    }

    const studentList = document.createElement("ul");
    studentList.className = "bg-white rounded shadow divide-y";

    students.forEach((enrollment) => {
      const student = enrollment.tbl_student;
      const listItem = document.createElement("li");
      listItem.className = "p-4";
      listItem.textContent = `${student.student_name} (${student.course} - ${student.Year})`;
      studentList.appendChild(listItem);
    });

    studentsSection.appendChild(studentList);
  } catch (error) {
    console.error("Error loading students:", error);
    studentsSection.innerHTML +=
      "<p>Failed to load students. Please try again.</p>";
  }
}
