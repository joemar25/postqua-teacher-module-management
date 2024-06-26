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
      loadDiscussions(currentClassId),
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

  document.addEventListener("submit", (event) => {
    if (event.target.id === "postForm") {
      event.preventDefault();
      createPost(event);
    } else if (event.target.id === "discussionForm") {
      event.preventDefault();
      createDiscussion(event);
    }
  });
}

function switchTab(tabName) {
  ["stream", "classwork", "people", "discussions"].forEach((tab) => {
    const tabElement = document.getElementById(`${tab}Tab`);
    const sectionElement = document.getElementById(`${tab}Section`);

    if (tab === tabName) {
      tabElement.classList.add("border-blue-500", "text-blue-600");
      tabElement.classList.remove("border-transparent", "text-gray-500");
      sectionElement.classList.remove("hidden");
      if (tab === "classwork") {
        loadChapters(currentClassId);
      }
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
  const streamSection = document.getElementById("streamSection");
  if (!streamSection) {
    console.error("Stream section not found in the DOM");
    return;
  }

  streamSection.innerHTML = "";
  streamSection.appendChild(createPostForm());
  streamSection.appendChild(createCurriculumOverview());
  streamSection.appendChild(createPostsList());

  await Promise.all([
    loadCurriculumOverview(classId),
    loadPosts(classId),
    loadExistingPosts(),
  ]);
}

function createPostForm() {
  const formContainer = document.createElement("div");
  formContainer.className =
    "bg-white dark:bg-gray-800 shadow sm:rounded-lg mb-6 p-4 border border-gray-300 dark:border-gray-700";
  formContainer.innerHTML = `
    <div class="px-4 py-5 sm:p-6">
      <h3 class="text-lg py-4 leading-6 font-medium text-gray-900 dark:text-gray-200">
        Create a post
      </h3>
      <form id="postForm" class="mt-5 space-y-4">
        <textarea id="postContent" name="content" rows="3"
          class="shadow-sm focus:ring-blue-500 focus:border-blue-500 mt-1 block w-full sm:text-sm border border-gray-300 rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-gray-300"
          placeholder="Share with your class..."></textarea>
        <select id="postChapter"
          class="mt-3 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-gray-300">
          <option value="">Select a chapter (optional)</option>
        </select>
        <select id="existingPosts"
          class="mt-3 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-gray-300">
          <option value="">Reuse an existing post</option>
        </select>
        <div class="mt-3 flex justify-end">
          <button type="submit"
            class="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
            Post
          </button>
        </div>
      </form>
    </div>
  `;
  return formContainer;
}

function createCurriculumOverview() {
  const curriculumOverview = document.createElement("div");
  curriculumOverview.id = "curriculumOverview";
  curriculumOverview.className =
    "bg-white dark:bg-gray-800 p-4 shadow sm:rounded-lg mb-6 border border-gray-300 dark:border-gray-700";
  return curriculumOverview;
}

function createPostsList() {
  const postsList = document.createElement("div");
  postsList.id = "postsList";
  postsList.className = "space-y-6";
  return postsList;
}

async function loadCurriculumOverview(classId) {
  const overviewContainer = document.getElementById("curriculumOverview");
  if (!overviewContainer) {
    console.error("Curriculum overview container not found");
    return;
  }

  try {
    const { data: classData, error: classError } = await supabase_connection
      .from("classes")
      .select("course_id")
      .eq("id", classId)
      .single();

    if (classError) throw classError;

    const { data: chapters, error: chaptersError } = await supabase_connection
      .from("chapters")
      .select(
        `
        id,
        title,
        order,
        lessons (
          id,
          title,
          order
        ),
        discussions (
          id,
          title
        )
      `
      )
      .eq("course_id", classData.course_id)
      .order("order");

    if (chaptersError) throw chaptersError;

    overviewContainer.innerHTML = `
      <h2 class="text-2xl font-bold mb-6 text-gray-800 dark:text-gray-200">Course Curriculum</h2>
      <div id="editCurriculumBtn" class="mb-4">
        <button onclick="toggleEditMode()" class="bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded">
          Edit Curriculum
        </button>
      </div>
    `;

    const chapterList = document.createElement("div");
    chapterList.className = "space-y-6";

    chapters.forEach((chapter) => {
      const chapterItem = document.createElement("div");
      chapterItem.className =
        "bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6";
      chapterItem.innerHTML = `
        <div class="flex justify-between items-center mb-4">
          <h3 class="text-xl font-semibold text-gray-800 dark:text-gray-200" id="chapter-title-${
            chapter.id
          }">${chapter.title}</h3>
          <div class="edit-buttons hidden">
            <button onclick="editChapter(${
              chapter.id
            })" class="text-blue-500 hover:text-blue-600 mr-2">Edit</button>
            <button onclick="deleteChapter(${
              chapter.id
            })" class="text-red-500 hover:text-red-600">Delete</button>
          </div>
        </div>
        <ul class="space-y-2 mb-4" id="lesson-list-${chapter.id}">
          ${chapter.lessons
            .map(
              (lesson) => `
            <li class="flex justify-between items-center">
              <span class="text-gray-700 dark:text-gray-300">${lesson.title}</span>
              <div class="edit-buttons hidden">
                <button onclick="editLesson(${lesson.id})" class="text-blue-500 hover:text-blue-600 mr-2">Edit</button>
                <button onclick="deleteLesson(${lesson.id})" class="text-red-500 hover:text-red-600">Delete</button>
              </div>
            </li>
          `
            )
            .join("")}
        </ul>
        <div class="edit-buttons hidden">
          <button onclick="addLesson(${
            chapter.id
          })" class="bg-green-500 hover:bg-green-600 text-white font-bold py-1 px-3 rounded text-sm">Add Lesson</button>
        </div>
        <div class="mt-4">
          <h4 class="text-lg font-medium text-gray-700 dark:text-gray-300 mb-2">Discussions</h4>
          <ul class="space-y-2" id="discussion-list-${chapter.id}">
            ${chapter.discussions
              .map(
                (discussion) => `
              <li class="text-gray-600 dark:text-gray-400">${discussion.title}</li>
            `
              )
              .join("")}
          </ul>
        </div>
      `;
      chapterList.appendChild(chapterItem);
    });

    overviewContainer.appendChild(chapterList);

    const addChapterButton = document.createElement("button");
    addChapterButton.className =
      "bg-green-500 hover:bg-green-600 text-white font-bold py-2 px-4 rounded mt-6 hidden edit-buttons";
    addChapterButton.textContent = "Add Chapter";
    addChapterButton.onclick = () => addChapter(classData.course_id);
    overviewContainer.appendChild(addChapterButton);
  } catch (error) {
    console.error("Error loading curriculum overview:", error);
    overviewContainer.innerHTML =
      "<p class='text-red-500'>Failed to load curriculum overview. Please try again.</p>";
  }
}

function toggleEditMode() {
  const editButtons = document.querySelectorAll(".edit-buttons");
  const editCurriculumBtn =
    document.getElementById("editCurriculumBtn").firstElementChild;

  editButtons.forEach((button) => button.classList.toggle("hidden"));

  if (editCurriculumBtn.textContent.includes("Edit")) {
    editCurriculumBtn.textContent = "Save Changes";
    editCurriculumBtn.classList.remove("bg-blue-500", "hover:bg-blue-600");
    editCurriculumBtn.classList.add("bg-green-500", "hover:bg-green-600");
  } else {
    editCurriculumBtn.textContent = "Edit Curriculum";
    editCurriculumBtn.classList.remove("bg-green-500", "hover:bg-green-600");
    editCurriculumBtn.classList.add("bg-blue-500", "hover:bg-blue-600");
    saveCurriculumChanges();
  }
}

async function saveCurriculumChanges() {
  console.log("Saving curriculum changes...");
  await loadChapters(currentClassId);
}

async function editChapter(chapterId) {
  const chapterTitle = document.getElementById(`chapter-title-${chapterId}`);
  const newTitle = prompt("Enter new chapter title:", chapterTitle.textContent);
  if (newTitle) {
    try {
      const { error } = await supabase_connection
        .from("chapters")
        .update({ title: newTitle, updated_at: new Date() })
        .eq("id", chapterId);

      if (error) throw error;

      chapterTitle.textContent = newTitle;
    } catch (error) {
      console.error("Error updating chapter:", error);
      alert("Failed to update chapter. Please try again.");
    }
  }
}

async function deleteChapter(chapterId) {
  if (
    confirm(
      "Are you sure you want to delete this chapter? This will also delete all associated lessons and discussions."
    )
  ) {
    try {
      const { error } = await supabase_connection
        .from("chapters")
        .delete()
        .eq("id", chapterId);

      if (error) throw error;

      document
        .getElementById(`chapter-title-${chapterId}`)
        .closest(".bg-white")
        .remove();
    } catch (error) {
      console.error("Error deleting chapter:", error);
      alert("Failed to delete chapter. Please try again.");
    }
  }
}

async function addChapter(courseId) {
  const newChapterTitle = prompt("Enter new chapter title:");
  if (newChapterTitle) {
    try {
      const { data, error } = await supabase_connection
        .from("chapters")
        .insert({
          title: newChapterTitle,
          course_id: courseId,
          order: 9999,
        })
        .select();

      if (error) throw error;

      await loadCurriculumOverview(currentClassId);
    } catch (error) {
      console.error("Error adding new chapter:", error);
      alert("Failed to add new chapter. Please try again.");
    }
  }
}

async function editLesson(lessonId) {
  const lessonTitleElement = document.getElementById(
    `lesson-title-${lessonId}`
  );
  const newTitle = prompt(
    "Enter new lesson title:",
    lessonTitleElement.textContent
  );
  if (newTitle) {
    try {
      const { error } = await supabase_connection
        .from("lessons")
        .update({ title: newTitle, updated_at: new Date() })
        .eq("id", lessonId);

      if (error) throw error;

      lessonTitleElement.textContent = newTitle;
    } catch (error) {
      console.error("Error updating lesson:", error);
      alert("Failed to update lesson. Please try again.");
    }
  }
}

async function deleteLesson(lessonId) {
  if (confirm("Are you sure you want to delete this lesson?")) {
    try {
      const { error } = await supabase_connection
        .from("lessons")
        .delete()
        .eq("id", lessonId);

      if (error) throw error;

      document
        .querySelector(`[data-lesson-id="${lessonId}"]`)
        .closest("li")
        .remove();
    } catch (error) {
      console.error("Error deleting lesson:", error);
      alert("Failed to delete lesson. Please try again.");
    }
  }
}

async function addLesson(chapterId) {
  const newLessonTitle = prompt("Enter new lesson title:");
  if (newLessonTitle) {
    try {
      const { data, error } = await supabase_connection
        .from("lessons")
        .insert({
          title: newLessonTitle,
          chapter_id: chapterId,
          order: 9999,
        })
        .select();

      if (error) throw error;

      const lessonList = document.getElementById(`lesson-list-${chapterId}`);
      const newLessonElement = document.createElement("li");
      newLessonElement.className = "flex justify-between items-center";
      newLessonElement.innerHTML = `
        <span class="text-gray-700 dark:text-gray-300" data-lesson-id="${data[0].id}">${newLessonTitle}</span>
        <div class="edit-buttons">
          <button onclick="editLesson(${data[0].id})" class="text-blue-500 hover:text-blue-600 mr-2">Edit</button>
          <button onclick="deleteLesson(${data[0].id})" class="text-red-500 hover:text-red-600">Delete</button>
        </div>
      `;
      lessonList.appendChild(newLessonElement);
    } catch (error) {
      console.error("Error adding new lesson:", error);
      alert("Failed to add new lesson. Please try again.");
    }
  }
}

async function loadExistingPosts() {
  try {
    const { data: posts, error } = await supabase_connection
      .from("tbl_feeds")
      .select("id, content, class_id, chapter_id, classes(class_name)")
      .neq("class_id", currentClassId)
      .order("created_at", { ascending: false });

    if (error) throw error;

    const existingPostsSelect = document.getElementById("existingPosts");
    existingPostsSelect.innerHTML =
      '<option value="">Reuse a post from another class</option>';

    posts.forEach((post) => {
      const option = document.createElement("option");
      option.value = post.id;
      const postPreview =
        post.content.length > 50
          ? `${post.content.substring(0, 50)}...`
          : post.content;
      option.textContent = `${post.classes.class_name}${
        post.chapter_id ? ` (Chapter ${post.chapter_id})` : ""
      }: ${postPreview}`;
      existingPostsSelect.appendChild(option);
    });
  } catch (error) {
    console.error("Error loading existing posts:", error);
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
  }
}

function displayPosts(posts) {
  const generalPosts = posts.filter((post) => !post.chapter_id);
  const chapterPosts = posts.filter((post) => post.chapter_id);

  const postsList = document.getElementById("postsList");
  if (postsList) {
    postsList.innerHTML =
      "<h3 class='text-lg font-semibold mb-2 mt-8 text-gray-900 dark:text-gray-200'>General Posts</h3>";
    if (generalPosts.length === 0) {
      postsList.innerHTML +=
        "<p class='text-gray-600 dark:text-gray-400'>No general posts available.</p>";
    } else {
      generalPosts.forEach((post) => {
        const postElement = createPostElement(post);
        postsList.appendChild(postElement);
      });
    }
  }

  chapterPosts.forEach((post) => {
    const chapterPostsContainer = document.getElementById(
      `chapter-${post.chapter_id}-posts`
    );
    if (chapterPostsContainer) {
      const postElement = createPostElement(post);
      chapterPostsContainer.appendChild(postElement);
    }
  });
}

function createPostElement(post) {
  const postElement = document.createElement("div");
  postElement.className =
    "bg-white dark:bg-gray-800 rounded-lg shadow p-6 border border-gray-300 dark:border-gray-700 mb-4";
  postElement.innerHTML = `
    <div class="flex justify-between items-center mb-4">
      <span class="text-sm text-gray-500 dark:text-gray-400">${new Date(
        post.created_at
      ).toLocaleString()}</span>
      <div>
        <button onclick="editPost(${
          post.id
        })" class="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 text-sm mr-2">
          Edit
        </button>
        <button onclick="deletePost(${
          post.id
        })" class="text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300 text-sm">
          Delete
        </button>
      </div>
    </div>
    <p class="text-gray-800 dark:text-gray-200" id="post-content-${post.id}">${
    post.content
  }</p>
    <div id="edit-form-${post.id}" class="hidden mt-4">
      <textarea id="edit-content-${
        post.id
      }" class="w-full px-3 py-2 text-gray-700 border rounded-lg focus:outline-none focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-300">${
    post.content
  }</textarea>
      <div class="mt-2 flex justify-end">
        <button onclick="updatePost(${
          post.id
        })" class="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 mr-2">Save</button>
        <button onclick="cancelEdit(${
          post.id
        })" class="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500">Cancel</button>
      </div>
    </div>
  `;
  return postElement;
}

function editPost(postId) {
  const contentElement = document.getElementById(`post-content-${postId}`);
  const editFormElement = document.getElementById(`edit-form-${postId}`);

  contentElement.classList.add("hidden");
  editFormElement.classList.remove("hidden");
}

function cancelEdit(postId) {
  const contentElement = document.getElementById(`post-content-${postId}`);
  const editFormElement = document.getElementById(`edit-form-${postId}`);

  contentElement.classList.remove("hidden");
  editFormElement.classList.add("hidden");
}

async function updatePost(postId) {
  const newContent = document.getElementById(`edit-content-${postId}`).value;

  if (!newContent.trim()) return;

  try {
    const { error } = await supabase_connection
      .from("tbl_feeds")
      .update({ content: newContent })
      .eq("id", postId);

    if (error) throw error;

    await loadCurriculumOverview(currentClassId);
  } catch (error) {
    console.error("Error updating post:", error);
  }
}

async function createPost(event) {
  event.preventDefault();
  const content = document.getElementById("postContent").value;
  const chapterId = document.getElementById("postChapter").value;
  const existingPostId = document.getElementById("existingPosts").value;

  if (!content.trim() && !existingPostId) return;

  try {
    let postData;

    if (existingPostId) {
      const { data: existingPost, error: fetchError } =
        await supabase_connection
          .from("tbl_feeds")
          .select("content, chapter_id")
          .eq("id", existingPostId)
          .single();

      if (fetchError) throw fetchError;

      postData = {
        class_id: currentClassId,
        content: existingPost.content,
        chapter_id: chapterId || existingPost.chapter_id,
      };
    } else {
      postData = {
        class_id: currentClassId,
        content: content,
        chapter_id: chapterId || null,
      };
    }

    const { error } = await supabase_connection
      .from("tbl_feeds")
      .insert([postData]);

    if (error) throw error;

    document.getElementById("postContent").value = "";
    document.getElementById("postChapter").value = "";
    document.getElementById("existingPosts").value = "";
    await loadCurriculumOverview(currentClassId);
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

    await loadCurriculumOverview(currentClassId);
  } catch (error) {
    console.error("Error deleting post:", error);
  }
}

async function loadChapters(classId) {
  const chaptersSection = document.getElementById("classworkSection");
  chaptersSection.innerHTML = `
    <h3 class='text-xl font-semibold text-gray-800 dark:text-gray-200 mb-4'>Classwork</h3>
    <div id="editCurriculumBtn" class="mb-4">
      <button onclick="toggleEditMode()" class="bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded">
        Edit Curriculum
      </button>
    </div>
  `;

  try {
    const { data: classData, error: classError } = await supabase_connection
      .from("classes")
      .select("course_id")
      .eq("id", classId)
      .single();

    if (classError) throw classError;

    const { data: chaptersData, error: chaptersError } =
      await supabase_connection
        .from("chapters")
        .select(
          `
        id,
        title,
        order,
        lessons (
          id,
          title,
          order
        ),
        quizzes (
          id,
          title,
          quiz_results (
            id,
            student_id,
            score,
            tbl_student (
              student_name
            )
          )
        )
      `
        )
        .eq("course_id", classData.course_id)
        .order("order");

    if (chaptersError) throw chaptersError;

    if (chaptersData.length === 0) {
      chaptersSection.innerHTML +=
        "<p>No chapters available for this course.</p>";
      return;
    }

    const { count: totalStudents, error: studentsError } =
      await supabase_connection
        .from("class_students")
        .select("id", { count: "exact" })
        .eq("class_id", classId);

    if (studentsError) throw studentsError;

    const chaptersList = document.createElement("ul");
    chaptersList.className = "space-y-6";

    chaptersData.forEach((chapter) => {
      const chapterItem = document.createElement("div");
      chapterItem.className =
        "bg-white dark:bg-gray-800 rounded-lg shadow p-6 mb-6";
      chapterItem.id = `chapter-${chapter.id}`;

      let lessonsHTML = "";
      if (chapter.lessons.length === 0) {
        lessonsHTML =
          '<p class="text-gray-600 dark:text-gray-400 mt-2">No lessons available for this chapter.</p>';
      } else {
        lessonsHTML = '<ul class="mt-2 space-y-1">';
        chapter.lessons.forEach((lesson) => {
          lessonsHTML += `
            <li class="flex justify-between items-center" data-lesson-id="${lesson.id}">
              <span id="lesson-title-${lesson.id}" class="text-gray-700 dark:text-gray-300">${lesson.title}</span>
              <div class="edit-buttons hidden">
                <button onclick="editLesson(${lesson.id})" class="text-blue-500 hover:text-blue-600 mr-2">Edit</button>
                <button onclick="deleteLesson(${lesson.id})" class="text-red-500 hover:text-red-600">Delete</button>
              </div>
            </li>
          `;
        });
        lessonsHTML += "</ul>";
      }

      let quizzesHTML = "";
      if (chapter.quizzes.length === 0) {
        quizzesHTML =
          '<p class="text-gray-600 dark:text-gray-400 mt-2">No quizzes available for this chapter.</p>';
      } else {
        quizzesHTML = '<ul class="mt-4 space-y-4">';
        chapter.quizzes.forEach((quiz) => {
          const studentsWithScores = quiz.quiz_results.length;
          quizzesHTML += `
            <li class="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
              <div class="font-medium text-gray-800 dark:text-gray-200">${
                quiz.title
              }</div>
              <div class="text-sm text-gray-600 dark:text-gray-400 mt-1">${studentsWithScores}/${totalStudents} students completed</div>
              <ul class="mt-2 space-y-1">
                ${quiz.quiz_results
                  .map(
                    (result) => `
                  <li class="text-sm text-gray-700 dark:text-gray-300">
                    ${result.tbl_student.student_name}: ${result.score}
                  </li>
                `
                  )
                  .join("")}
              </ul>
            </li>
          `;
        });
        quizzesHTML += "</ul>";
      }

      chapterItem.innerHTML = `
        <div class="flex justify-between items-center mb-4">
          <h3 class="text-xl font-semibold text-gray-800 dark:text-gray-200" id="chapter-title-${chapter.id}">${chapter.title}</h3>
          <div class="edit-buttons hidden">
            <button onclick="editChapter(${chapter.id})" class="text-blue-500 hover:text-blue-600 mr-2">Edit</button>
            <button onclick="deleteChapter(${chapter.id})" class="text-red-500 hover:text-red-600">Delete</button>
          </div>
        </div>
        <h4 class="text-md font-medium text-gray-700 dark:text-gray-300 mt-4">Lessons</h4>
        ${lessonsHTML}
        <div class="edit-buttons hidden">
          <button onclick="addLesson(${chapter.id})" class="bg-green-500 hover:bg-green-600 text-white font-bold py-1 px-3 rounded text-sm">Add Lesson</button>
        </div>
        <h4 class="text-md font-medium text-gray-700 dark:text-gray-300 mt-4">Quizzes</h4>
        ${quizzesHTML}
      `;
      chaptersList.appendChild(chapterItem);
    });

    chaptersSection.appendChild(chaptersList);

    const addChapterButton = document.createElement("button");
    addChapterButton.className =
      "bg-green-500 hover:bg-green-600 text-white font-bold py-2 px-4 rounded mt-6 hidden edit-buttons";
    addChapterButton.textContent = "Add Chapter";
    addChapterButton.onclick = () => addChapter(classData.course_id);
    chaptersSection.appendChild(addChapterButton);

    // Populate course curriculum dropdown in the post and discussion forms
    populateChapterSelects(chaptersData);
  } catch (error) {
    console.error("Error loading chapters and quizzes:", error);
    chaptersSection.innerHTML +=
      "<p>Failed to load chapters and quizzes. Please try again.</p>";
  }
}

async function loadStudents(classId) {
  const studentsSection = document.getElementById("peopleSection");
  studentsSection.innerHTML =
    "<h3 class='text-xl font-semibold text-gray-800 dark:text-gray-200 mb-4'>People</h3>";

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

    const studentList = document.createElement("div");
    studentList.className =
      "bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden";

    students.forEach((enrollment) => {
      const student = enrollment.tbl_student;
      const listItem = document.createElement("div");
      listItem.className =
        "p-4 border-b border-gray-200 dark:border-gray-700 last:border-b-0";
      listItem.innerHTML = `
      <p class="text-gray-800 dark:text-gray-200">${student.student_name}</p>
      <p class="text-sm text-gray-600 dark:text-gray-400">${student.course} - ${student.Year}</p>
    `;
      studentList.appendChild(listItem);
    });

    studentsSection.appendChild(studentList);
  } catch (error) {
    console.error("Error loading students:", error);
    studentsSection.innerHTML +=
      "<p>Failed to load students. Please try again.</p>";
  }
}

async function loadDiscussions(classId) {
  const discussionsSection = document.getElementById("discussionsSection");
  if (!discussionsSection) {
    console.error("Discussions section not found in the DOM");
    return;
  }

  discussionsSection.innerHTML = "";
  discussionsSection.appendChild(createDiscussionForm());
  discussionsSection.appendChild(createDiscussionsList());

  await loadDiscussionPosts(classId);
}

function createDiscussionForm() {
  const formContainer = document.createElement("div");
  formContainer.className =
    "bg-white dark:bg-gray-800 shadow sm:rounded-lg mb-6";
  formContainer.innerHTML = `
    <div class="px-4 py-5 sm:p-6">
      <h3 class="text-lg py-4 leading-6 font-medium text-gray-900 dark:text-gray-200">
        Create a Discussion
      </h3>
      <form id="discussionForm" class="mt-5">
        <textarea id="discussionContent" name="content" rows="3"
          class="shadow-sm focus:ring-blue-500 focus:border-blue-500 mt-1 block w-full sm:text-sm border border-gray-300 rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-gray-300"
          placeholder="Start a discussion..."></textarea>
        <select id="discussionChapter"
          class="mt-3 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md">
          <option value="">Select a chapter (optional)</option>
        </select>
        <div class="mt-3 flex justify-end">
          <button type="submit"
            class="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
            Post
          </button>
        </div>
      </form>
    </div>
  `;
  return formContainer;
}

function createDiscussionsList() {
  const discussionsList = document.createElement("div");
  discussionsList.id = "discussionsList";
  discussionsList.className = "space-y-6";
  return discussionsList;
}

async function createDiscussion(event) {
  event.preventDefault();
  const content = document.getElementById("discussionContent").value;
  const chapterId = document.getElementById("discussionChapter").value;

  if (!content.trim()) return;

  try {
    const postData = {
      class_id: currentClassId,
      chapter_id: chapterId || null,
      title: content.substring(0, 255),
      description: content,
      created_by: getCurrentTeacherId(),
    };

    const { error } = await supabase_connection
      .from("discussions")
      .insert([postData]);

    if (error) throw error;

    document.getElementById("discussionContent").value = "";
    document.getElementById("discussionChapter").value = "";
    await loadDiscussionPosts(currentClassId);
  } catch (error) {
    console.error("Error creating discussion:", error);
  }
}

async function loadDiscussionPosts(classId) {
  try {
    const { data: discussions, error } = await supabase_connection
      .from("discussions")
      .select("*, chapters(title)")
      .eq("class_id", classId)
      .order("created_at", { ascending: false });

    if (error) throw error;

    displayDiscussions(discussions);
  } catch (error) {
    console.error("Error loading discussions:", error);
  }
}

function displayDiscussions(discussions) {
  const discussionsList = document.getElementById("discussionsList");
  if (!discussionsList) return;

  discussionsList.innerHTML =
    "<h3 class='text-lg font-semibold mb-2 mt-8 text-gray-900 dark:text-gray-200'>Discussions</h3>";

  if (discussions.length === 0) {
    discussionsList.innerHTML +=
      "<p class='text-gray-600 dark:text-gray-400'>No discussions available.</p>";
    return;
  }

  const groupedDiscussions = discussions.reduce((acc, discussion) => {
    const key = discussion.chapter_id
      ? `chapter-${discussion.chapter_id}`
      : "general";
    if (!acc[key]) acc[key] = [];
    acc[key].push(discussion);
    return acc;
  }, {});

  if (groupedDiscussions.general) {
    discussionsList.innerHTML +=
      "<h4 class='text-md font-semibold mb-2 text-gray-900 dark:text-gray-200'>General Discussions</h4>";
    groupedDiscussions.general.forEach((discussion) => {
      discussionsList.appendChild(createDiscussionElement(discussion));
    });
  }

  Object.keys(groupedDiscussions).forEach((key) => {
    if (key !== "general") {
      const chapterId = key.split("-")[1];
      const chapterTitle = groupedDiscussions[key][0].chapters.title;
      discussionsList.innerHTML += `<h4 class='text-md font-semibold mb-2 mt-4 text-gray-900 dark:text-gray-200'>Chapter: ${chapterTitle}</h4>`;
      groupedDiscussions[key].forEach((discussion) => {
        discussionsList.appendChild(createDiscussionElement(discussion));
      });
    }
  });
}

function createDiscussionElement(discussion) {
  const discussionElement = document.createElement("div");
  discussionElement.className =
    "bg-white dark:bg-gray-800 rounded-lg shadow p-6 border border-gray-300 dark:border-gray-700 mb-4";
  discussionElement.innerHTML = `
    <div class="flex justify-between items-center mb-4">
      <span class="text-sm text-gray-500 dark:text-gray-400">${new Date(
        discussion.created_at
      ).toLocaleString()}</span>
      <div>
        <button onclick="editDiscussionTitle(${
          discussion.id
        })" class="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 text-sm mr-2">
          Edit Title
        </button>
        <button onclick="editDiscussion(${
          discussion.id
        })" class="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 text-sm mr-2">
          Edit Content
        </button>
        <button onclick="deleteDiscussion(${
          discussion.id
        })" class="text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300 text-sm">
          Delete
        </button>
      </div>
    </div>
    <h4 class="text-lg font-semibold mb-2 text-gray-900 dark:text-gray-200" id="discussion-title-${
      discussion.id
    }">${discussion.title}</h4>
    <p class="text-gray-800 dark:text-gray-200" id="discussion-content-${
      discussion.id
    }">${discussion.description}</p>
    <div id="discussion-comments-${discussion.id}" class="mt-4 space-y-4"></div>
    <form id="commentForm-${discussion.id}" onsubmit="createComment(event, ${
    discussion.id
  })" class="mt-4">
      <textarea id="commentContent-${discussion.id}" name="content" rows="2"
        class="shadow-sm focus:ring-blue-500 focus:border-blue-500 mt-1 block w-full sm:text-sm border border-gray-300 rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-gray-300"
        placeholder="Write a comment..."></textarea>
      <div class="mt-3 flex justify-end">
        <button type="submit"
          class="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
          Comment
        </button>
      </div>
    </form>
  `;
  return discussionElement;
}

async function editDiscussionTitle(discussionId) {
  const discussionTitleElement = document.getElementById(
    `discussion-title-${discussionId}`
  );
  const newTitle = prompt(
    "Enter new discussion title:",
    discussionTitleElement.textContent
  );
  if (newTitle && newTitle.trim()) {
    try {
      const { error } = await supabase_connection
        .from("discussions")
        .update({ title: newTitle.trim(), updated_at: new Date() })
        .eq("id", discussionId);

      if (error) throw error;

      discussionTitleElement.textContent = newTitle.trim();
    } catch (error) {
      console.error("Error updating discussion title:", error);
      alert("Failed to update discussion title. Please try again.");
    }
  }
}

async function editDiscussion(discussionId) {
  const discussionContentElement = document.getElementById(
    `discussion-content-${discussionId}`
  );
  const newContent = prompt(
    "Enter new discussion content:",
    discussionContentElement.textContent
  );
  if (newContent && newContent.trim()) {
    try {
      const { error } = await supabase_connection
        .from("discussions")
        .update({ description: newContent.trim(), updated_at: new Date() })
        .eq("id", discussionId);

      if (error) throw error;

      discussionContentElement.textContent = newContent.trim();
    } catch (error) {
      console.error("Error updating discussion content:", error);
      alert("Failed to update discussion content. Please try again.");
    }
  }
}

async function createComment(event, discussionId) {
  event.preventDefault();
  const content = document.getElementById(
    `commentContent-${discussionId}`
  ).value;

  if (!content.trim()) return;

  try {
    const commentData = {
      discussion_id: discussionId,
      content: content,
    };

    const { error } = await supabase_connection
      .from("tbl_discussion_comments")
      .insert([commentData]);

    if (error) throw error;

    document.getElementById(`commentContent-${discussionId}`).value = "";
    await loadDiscussionComments(discussionId);
  } catch (error) {
    console.error("Error creating comment:", error);
  }
}

async function loadDiscussionComments(discussionId) {
  try {
    const { data: comments, error } = await supabase_connection
      .from("tbl_discussion_comments")
      .select("*")
      .eq("discussion_id", discussionId)
      .order("created_at", { ascending: true });

    if (error) throw error;

    displayComments(discussionId, comments);
  } catch (error) {
    console.error("Error loading comments:", error);
  }
}

function displayComments(discussionId, comments) {
  const commentsContainer = document.getElementById(
    `discussion-comments-${discussionId}`
  );
  if (commentsContainer) {
    commentsContainer.innerHTML = "";
    if (comments.length === 0) {
      commentsContainer.innerHTML = "<p>No comments available.</p>";
    } else {
      comments.forEach((comment) => {
        const commentElement = document.createElement("div");
        commentElement.className =
          "bg-gray-100 dark:bg-gray-900 rounded-lg p-4";
        commentElement.innerHTML = `
          <div class="flex justify-between items-center mb-2">
            <span class="text-sm text-gray-600 dark:text-gray-400">${new Date(
              comment.created_at
            ).toLocaleString()}</span>
            <button onclick="deleteComment(${
              comment.id
            })" class="text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300 text-sm">
              Delete
            </button>
          </div>
          <p class="text-gray-800 dark:text-gray-200">${comment.content}</p>
        `;
        commentsContainer.appendChild(commentElement);
      });
    }
  }
}

async function deleteDiscussion(discussionId) {
  if (!confirm("Are you sure you want to delete this discussion?")) return;

  try {
    const { error } = await supabase_connection
      .from("discussions")
      .delete()
      .eq("id", discussionId);

    if (error) throw error;

    await loadDiscussionPosts(currentClassId);
  } catch (error) {
    console.error("Error deleting discussion:", error);
  }
}

async function deleteComment(commentId) {
  if (!confirm("Are you sure you want to delete this comment?")) return;

  try {
    const { error } = await supabase_connection
      .from("tbl_discussion_comments")
      .delete()
      .eq("id", commentId);

    if (error) throw error;

    const discussionId = document.getElementById(`commentForm-${commentId}`)
      .dataset.discussionId;
    await loadDiscussionComments(discussionId);
  } catch (error) {
    console.error("Error deleting comment:", error);
  }
}

function populateChapterSelects(chapters) {
  const selectElements = ["postChapter", "discussionChapter"];
  selectElements.forEach((selectId) => {
    const select = document.getElementById(selectId);
    if (select) {
      select.innerHTML =
        "<option value=''>Select a chapter (optional)</option>";
      chapters.forEach((chapter) => {
        const option = document.createElement("option");
        option.value = chapter.id;
        option.textContent = chapter.title;
        select.appendChild(option);
      });
    }
  });
}
