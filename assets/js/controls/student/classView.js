const SUPABASE_URL = "https://hvqvmxakmursjidtfmdj.supabase.co";
const SUPABASE_ANON_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imh2cXZteGFrbXVyc2ppZHRmbWRqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MTg2MDA4MjQsImV4cCI6MjAzNDE3NjgyNH0.dykJM61G-58LEnAyCUU6-irano2f4vraV8t1l8C5KZ8";

let supabase_connection;

document.addEventListener("DOMContentLoaded", async () => {
  if (!supabase_connection) {
    initializeSupabase();
  }
  await loadClassData();
});

function initializeSupabase() {
  supabase_connection = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
}

async function loadClassData() {
  const urlParams = new URLSearchParams(window.location.search);
  const classId = urlParams.get("classId");

  if (!classId) {
    alert("Class ID not provided");
    return;
  }

  try {
    const { data: classData, error: classError } = await supabase_connection
      .from("classes")
      .select(
        `
        *,
        courses (
          id,
          title,
          description,
          teacher_id,
          teachers (
            first_name,
            last_name
          )
        )
      `
      )
      .eq("id", classId)
      .single();

    if (classError) throw classError;

    document.getElementById(
      "classTitle"
    ).textContent = `${classData.class_name} - ${classData.courses.title}`;
    document.getElementById(
      "teacherName"
    ).textContent = `Teacher: ${classData.courses.teachers.first_name} ${classData.courses.teachers.last_name}`;

    await fetchCurriculum(classData.courses.id, classId);
  } catch (error) {
    console.error("Error loading class data:", error);
    showNotification("Failed to load class data. Please try again.", true);
  }
}

async function fetchCurriculum(courseId, classId) {
  try {
    const { data: chapters, error: chaptersError } = await supabase_connection
      .from("chapters")
      .select(
        `
        *,
        lessons (
          id,
          title,
          content,
          order
        ),
        activities (
          id,
          title,
          description,
          type,
          due_date
        ),
        quizzes (
          id,
          title,
          description
        )
      `
      )
      .eq("course_id", courseId)
      .order("order", { ascending: true });

    if (chaptersError) throw chaptersError;

    const { data: feeds, error: feedsError } = await supabase_connection
      .from("tbl_feeds")
      .select("*")
      .eq("class_id", classId);

    if (feedsError) throw feedsError;

    displayCurriculum(chapters, feeds);
  } catch (error) {
    console.error("Error fetching curriculum:", error);
    showNotification("Failed to fetch curriculum. Please try again.", true);
  }
}

function displayCurriculum(chapters, feeds) {
  const curriculumContainer = document.getElementById("curriculumContainer");
  const noCurriculumMessage = document.getElementById("noCurriculumMessage");
  curriculumContainer.innerHTML = "";

  if (chapters.length === 0) {
    noCurriculumMessage.classList.remove("hidden");
  } else {
    noCurriculumMessage.classList.add("hidden");

    chapters.forEach((chapter) => {
      const chapterFeeds = feeds.filter(
        (feed) => feed.chapter_id === chapter.id
      );
      const chapterItem = document.createElement("div");
      chapterItem.className =
        "p-4 bg-white rounded-lg shadow-xs dark:bg-gray-800 mb-4";
      chapterItem.innerHTML = `
        <h3 class="text-lg font-semibold text-gray-700 dark:text-gray-200">${
          chapter.title
        }</h3>
        <div class="ml-4 mt-2 space-y-2">
          ${generateFeeds(chapterFeeds)}
          ${generateSectionContent(
            "Lessons",
            chapter.lessons,
            "lesson",
            "bg-gray-100",
            "dark:bg-gray-900"
          )}
          ${generateSectionContent(
            "Activities",
            chapter.activities,
            "activity",
            "bg-blue-100",
            "dark:bg-blue-900"
          )}
          ${generateSectionContent(
            "Quizzes",
            chapter.quizzes,
            "quiz",
            "bg-green-100",
            "dark:bg-green-900"
          )}
        </div>
      `;
      curriculumContainer.appendChild(chapterItem);
    });
  }
}

function generateSectionContent(
  sectionTitle,
  items,
  itemType,
  lightBgColor,
  darkBgColor
) {
  if (!items || items.length === 0) {
    return `<p class='text-sm font-medium text-gray-800 dark:text-gray-300 p-2 mt-2 ${lightBgColor} ${darkBgColor} rounded-lg'>No ${sectionTitle.toLowerCase()} available.</p>`;
  }

  return `
    <h4 class="text-md font-semibold text-gray-700 dark:text-gray-200 mt-4">${sectionTitle}</h4>
    ${items
      .map(
        (item) => `
      <div class="p-2 mt-2 ${lightBgColor} ${darkBgColor} rounded-lg">
        <h5 class="text-sm font-medium text-gray-800 dark:text-gray-300">
          <a href="${itemType}.html?${itemType}Id=${item.id}&classId=${
          item.chapter_id
        }" class="hover:underline">${item.title}</a>
        </h5>
        <p class="text-xs text-gray-600 dark:text-gray-400 mt-1">${
          item.description || item.content
        }</p>
        ${
          item.due_date
            ? `<p class="text-xs text-red-500 dark:text-red-400 mt-1">Due: ${new Date(
                item.due_date
              ).toLocaleString()}</p>`
            : ""
        }
      </div>
    `
      )
      .join("")}
  `;
}

function generateFeeds(feeds) {
  if (feeds.length === 0) {
    return "";
  }

  return `
    <h4 class="text-md font-semibold text-gray-700 dark:text-gray-200 mt-4">Announcements</h4>
    ${feeds
      .map(
        (feed) => `
      <div class="p-2 mt-2 bg-yellow-100 dark:bg-yellow-900 rounded-lg">
        <h5 class="text-sm font-medium text-gray-800 dark:text-gray-300">Announcement</h5>
        <p class="text-sm text-gray-700 dark:text-gray-400">${feed.content}</p>
        <p class="text-xs text-gray-500 dark:text-gray-400 mt-1">${new Date(
          feed.created_at
        ).toLocaleString()}</p>
      </div>
    `
      )
      .join("")}
  `;
}
