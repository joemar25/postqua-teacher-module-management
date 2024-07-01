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
          "order"
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

    const { data: discussions, error: discussionsError } =
      await supabase_connection
        .from("discussions")
        .select(
          `
        *,
        discussion_comments(
          id
        )
      `
        )
        .eq("class_id", classId);

    if (discussionsError) throw discussionsError;

    const transformedDiscussions = discussions.map((discussion) => ({
      ...discussion,
      comment_count: discussion.discussion_comments.length,
    }));

    displayCurriculum(chapters, feeds, transformedDiscussions);
  } catch (error) {
    console.error("Error fetching curriculum:", error);
    showNotification("Failed to fetch curriculum. Please try again.", true);
  }
}

function displayCurriculum(chapters, feeds, discussions) {
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
      const chapterDiscussions = discussions.filter(
        (discussion) => discussion.chapter_id === chapter.id
      );

      const chapterItem = document.createElement("div");
      chapterItem.className =
        "p-6 bg-white rounded-lg shadow-md dark:bg-gray-800 mb-6";
      chapterItem.innerHTML = `
        <h3 class="text-2xl font-semibold text-gray-700 dark:text-gray-200">${
          chapter.title
        }</h3>
        <div class="ml-4 mt-4 space-y-4">
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
          ${generateDiscussions(chapterDiscussions)}
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
    return `<p class='text-sm font-medium text-gray-800 dark:text-gray-300 p-4 mt-4 ${lightBgColor} ${darkBgColor} rounded-lg'>No ${sectionTitle.toLowerCase()} available.</p>`;
  }

  return `
    <h4 class="text-xl font-semibold text-gray-700 dark:text-gray-200 mt-4">${sectionTitle}</h4>
    ${items
      .map(
        (item) => `
      <div class="p-4 mt-2 ${lightBgColor} ${darkBgColor} rounded-lg">
        <h5 class="text-lg font-medium text-gray-800 dark:text-gray-300">
          <a href="${itemType}.html?${itemType}Id=${item.id}&classId=${
          item.chapter_id
        }" class="hover:underline">${item.title}</a>
        </h5>
        <p class="text-sm text-gray-600 dark:text-gray-400 mt-2">${
          item.description || item.content
        }</p>
        ${
          item.due_date
            ? `<p class="text-sm text-red-500 dark:text-red-400 mt-2">Due: ${new Date(
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
    <h4 class="text-xl font-semibold text-gray-700 dark:text-gray-200 mt-4">Announcements</h4>
    ${feeds
      .map(
        (feed) => `
      <div class="p-4 mt-2 bg-yellow-100 dark:bg-yellow-900 rounded-lg">
        <h5 class="text-lg font-medium text-gray-800 dark:text-gray-300">Announcement</h5>
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

function generateDiscussions(discussions) {
  if (discussions.length === 0) {
    return "";
  }

  return `
    <h4 class="text-xl font-semibold text-gray-700 dark:text-gray-200 mt-4">Discussions</h4>
    ${discussions
      .map(
        (discussion) => `
      <div class="p-4 mt-2 bg-purple-100 dark:bg-purple-900 rounded-lg">
        <h5 class="text-lg font-medium text-gray-800 dark:text-gray-300">
          <a href="discussion.html?discussionId=${discussion.id}&classId=${discussion.class_id}" class="hover:underline">${discussion.title}</a>
        </h5>
        <p class="text-sm text-gray-600 dark:text-gray-400 mt-2">${discussion.description}</p>
        <p class="text-sm text-gray-600 dark:text-gray-400 mt-2">${discussion.comment_count} comments</p>
        <form id="commentForm-${discussion.id}" class="mt-4 space-y-2" onsubmit="addComment(event, ${discussion.id})">
          <textarea id="commentContent-${discussion.id}" name="content" rows="2"
            class="w-full px-3 py-2 text-gray-700 border rounded-lg focus:outline-none focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-300"
            placeholder="Add a comment..."></textarea>
          <div class="flex justify-end">
            <button type="submit"
              class="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
              Comment
            </button>
          </div>
        </form>
      </div>
    `
      )
      .join("")}
  `;
}

async function addComment(event, discussionId) {
  event.preventDefault();
  const commentContent = document.getElementById(
    `commentContent-${discussionId}`
  ).value;

  if (!commentContent.trim()) {
    alert("Comment content cannot be empty");
    return;
  }

  try {
    const { data, error } = await supabase_connection
      .from("discussion_comments")
      .insert([
        { discussion_id: discussionId, comment: commentContent, created_by: 3 }, // Using student ID 3
      ]).select(`
        *,
        tbl_student(
          tbl_student_id,
          student_name
        )
      `);

    if (error) throw error;

    document.getElementById(`commentContent-${discussionId}`).value = "";
    const commentsContainer = document.getElementById(
      `comments-${discussionId}`
    );

    const newCommentHTML = generateComments([
      {
        ...data[0],
        created_by: data[0].tbl_student.student_name,
      },
    ]);

    commentsContainer.insertAdjacentHTML("afterbegin", newCommentHTML);
  } catch (error) {
    console.error("Error adding comment:", error);
    alert("Failed to add comment. Please try again.");
  }
}

function showNotification(message, isError = false) {
  console.log(message);
}
