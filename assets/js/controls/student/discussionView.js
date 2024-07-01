const SUPABASE_URL = "https://hvqvmxakmursjidtfmdj.supabase.co";
const SUPABASE_ANON_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imh2cXZteGFrbXVyc2ppZHRmbWRqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MTg2MDA4MjQsImV4cCI6MjAzNDE3NjgyNH0.dykJM61G-58LEnAyCUU6-irano2f4vraV8t1l8C5KZ8";

let supabase_connection;
let discussionId;
let classId;

document.addEventListener("DOMContentLoaded", async () => {
  if (!supabase_connection) {
    initializeSupabase();
  }

  // Add event listener here
  document.getElementById("commentForm").addEventListener("submit", addComment);

  await loadDiscussionData();
});

function initializeSupabase() {
  supabase_connection = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
}

async function loadDiscussionData() {
  const urlParams = new URLSearchParams(window.location.search);
  discussionId = urlParams.get("discussionId");
  classId = urlParams.get("classId");

  if (!discussionId || !classId) {
    alert("Discussion ID or Class ID not provided");
    return;
  }

  try {
    const { data: discussionData, error: discussionError } =
      await supabase_connection
        .from("discussions")
        .select(
          `
        *,
        discussion_comments(
          *,
          tbl_student(
            student_name
          )
        )
      `
        )
        .eq("id", discussionId)
        .single();

    if (discussionError) throw discussionError;

    document.getElementById("discussionTitle").textContent =
      discussionData.title;
    document.getElementById("discussionContent").textContent =
      discussionData.description;

    displayComments(discussionData.discussion_comments);
  } catch (error) {
    console.error("Error loading discussion data:", error);
    showNotification("Failed to load discussion data. Please try again.", true);
  }
}

function displayComments(comments) {
  const commentsSection = document.getElementById("commentsSection");
  commentsSection.innerHTML = "";

  if (!comments || comments.length === 0) {
    commentsSection.innerHTML =
      '<p class="text-sm text-gray-600 dark:text-gray-400">No comments yet. Be the first to comment!</p>';
    return;
  }

  comments.forEach((comment) => {
    const commentItem = document.createElement("div");
    commentItem.className = "p-4 bg-gray-100 dark:bg-gray-900 rounded-lg mb-4";
    commentItem.innerHTML = `
      <p class="text-sm font-medium text-gray-800 dark:text-gray-300">${
        comment.tbl_student.student_name
      }</p>
      <p class="text-sm text-gray-700 dark:text-gray-400">${comment.comment}</p>
      <p class="text-xs text-gray-500 dark:text-gray-400 mt-2">${new Date(
        comment.created_at
      ).toLocaleString()}</p>
    `;
    commentsSection.appendChild(commentItem);
  });
}

async function addComment(event) {
  event.preventDefault();
  const commentContent = document.getElementById("commentContent").value;

  if (!commentContent.trim()) {
    alert("Comment content cannot be empty");
    return;
  }

  try {
    const { data, error } = await supabase_connection
      .from("discussion_comments")
      .insert([
        {
          discussion_id: discussionId,
          comment: commentContent,
          created_by: 3,
        }, // Assuming student ID 3
      ]).select(`
        *,
        tbl_student(
          student_name
        )
      `);

    if (error) throw error;

    document.getElementById("commentContent").value = "";
    const newCommentHTML = `
      <div class="p-4 bg-gray-100 dark:bg-gray-900 rounded-lg mb-4">
        <p class="text-sm font-medium text-gray-800 dark:text-gray-300">${
          data[0].tbl_student.student_name
        }</p>
        <p class="text-sm text-gray-700 dark:text-gray-400">${
          data[0].comment
        }</p>
        <p class="text-xs text-gray-500 dark:text-gray-400 mt-2">${new Date(
          data[0].created_at
        ).toLocaleString()}</p>
      </div>
    `;

    // Insert the new comment at the end of the comments section
    document
      .getElementById("commentsSection")
      .insertAdjacentHTML("beforeend", newCommentHTML);
  } catch (error) {
    console.error("Error adding comment:", error);
    showNotification("Failed to add comment. Please try again.", true);
  }
}

function showNotification(message, isError = false) {
  console.log(message);
}
