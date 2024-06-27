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

  // Use event delegation for the post form
  document.addEventListener("submit", (event) => {
    if (event.target.id === "postForm") {
      event.preventDefault();
      createPost(event);
    }
  });
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
  const streamSection = document.getElementById("streamSection");
  if (!streamSection) {
    console.error("Stream section not found in the DOM");
    return;
  }

  // Clear the stream section
  streamSection.innerHTML = "";

  // Create post form
  const postForm = createPostForm();
  streamSection.appendChild(postForm);

  // Create curriculum overview
  const curriculumOverview = document.createElement("div");
  curriculumOverview.id = "curriculumOverview";
  streamSection.appendChild(curriculumOverview);

  // Create posts list
  const postsList = document.createElement("div");
  postsList.id = "postsList";
  postsList.className = "space-y-6";
  streamSection.appendChild(postsList);

  await Promise.all([
    loadCurriculumOverview(classId),
    loadPosts(classId),
    loadExistingPosts(),
  ]);
}

async function loadExistingPosts() {
  try {
    const { data: posts, error } = await supabase_connection
      .from("tbl_feeds")
      .select("id, content, class_id, chapter_id, classes(class_name)")
      .neq("class_id", currentClassId) // Exclude posts from the current class
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

function createPostForm() {
  const formContainer = document.createElement("div");
  formContainer.className =
    "bg-white dark:bg-gray-800 shadow sm:rounded-lg mb-6";
  formContainer.innerHTML = `
      <div class="px-4 py-5 sm:p-6">
        <h3 class="text-lg leading-6 font-medium text-gray-900 dark:text-gray-200">
          Create a post
        </h3>
        <form id="postForm" class="mt-5">
          <textarea id="postContent" name="content" rows="3"
            class="shadow-sm focus:ring-blue-500 focus:border-blue-500 mt-1 block w-full sm:text-sm border border-gray-300 rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-gray-300"
            placeholder="Share with your class..."></textarea>
          <select id="postChapter"
            class="mt-3 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md">
            <option value="">Select a chapter (optional)</option>
          </select>
          <select id="existingPosts"
            class="mt-3 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md">
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
      .select("*")
      .eq("course_id", classData.course_id)
      .order("order");

    if (chaptersError) throw chaptersError;

    overviewContainer.innerHTML =
      '<h2 class="text-xl font-bold mb-4">Course Curriculum</h2>';

    if (chapters.length === 0) {
      overviewContainer.innerHTML +=
        "<p>No chapters available for this course.</p>";
      return;
    }

    const chapterList = document.createElement("ul");
    chapterList.className = "space-y-4";

    chapters.forEach((chapter) => {
      const chapterItem = document.createElement("li");
      chapterItem.className = "bg-white p-4 rounded shadow";
      chapterItem.innerHTML = `
          <h3 class="text-lg font-semibold">${chapter.title}</h3>
          <p class="text-sm text-gray-600 mb-2">${
            chapter.description || "No description available."
          }</p>
          <div id="chapter-${chapter.id}-posts" class="mt-2 space-y-2"></div>
        `;
      chapterList.appendChild(chapterItem);
    });

    overviewContainer.appendChild(chapterList);

    // Populate the chapter select for posts
    const postChapterSelect = document.getElementById("postChapter");
    if (postChapterSelect) {
      postChapterSelect.innerHTML =
        "<option value=''>Select a chapter</option>";
      chapters.forEach((chapter) => {
        const option = document.createElement("option");
        option.value = chapter.id;
        option.textContent = chapter.title;
        postChapterSelect.appendChild(option);
      });
    }

    // Load posts for each chapter
    await loadPosts(classId);
  } catch (error) {
    console.error("Error loading curriculum overview:", error);
    overviewContainer.innerHTML =
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
  }
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

function displayPosts(posts) {
  const generalPosts = posts.filter((post) => !post.chapter_id);
  const chapterPosts = posts.filter((post) => post.chapter_id);

  // Display general posts
  const postsList = document.getElementById("postsList");
  if (postsList) {
    postsList.innerHTML =
      "<h3 class='text-lg font-semibold mb-2'>General Posts</h3>";
    if (generalPosts.length === 0) {
      postsList.innerHTML += "<p>No general posts available.</p>";
    } else {
      generalPosts.forEach((post) => {
        const postElement = createPostElement(post);
        postsList.appendChild(postElement);
      });
    }
  }

  // Display chapter-specific posts
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
  postElement.className = "bg-gray-100 p-3 rounded";
  postElement.innerHTML = `
      <div class="flex justify-between items-center mb-2">
        <span class="text-sm text-gray-600">${new Date(
          post.created_at
        ).toLocaleString()}</span>
        <div>
          <button onclick="editPost(${
            post.id
          })" class="text-blue-600 hover:text-blue-800 text-sm mr-2">
            Edit
          </button>
          <button onclick="deletePost(${
            post.id
          })" class="text-red-600 hover:text-red-800 text-sm">
            Delete
          </button>
        </div>
      </div>
      <p class="text-sm" id="post-content-${post.id}">${post.content}</p>
      <div id="edit-form-${post.id}" class="hidden mt-2">
        <textarea id="edit-content-${
          post.id
        }" class="w-full p-2 border rounded">${post.content}</textarea>
        <div class="mt-2">
          <button onclick="updatePost(${
            post.id
          })" class="bg-blue-500 text-white px-2 py-1 rounded mr-2">Save</button>
          <button onclick="cancelEdit(${
            post.id
          })" class="bg-gray-500 text-white px-2 py-1 rounded">Cancel</button>
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
