// assets/js/controls/subjects.js

const SUPABASE_URL = "https://hvqvmxakmursjidtfmdj.supabase.co";
const SUPABASE_ANON_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imh2cXZteGFrbXVyc2ppZHRmbWRqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MTg2MDA4MjQsImV4cCI6MjAzNDE3NjgyNH0.dykJM61G-58LEnAyCUU6-irano2f4vraV8t1l8C5KZ8";

const supabase_connection = supabase.createClient(
  SUPABASE_URL,
  SUPABASE_ANON_KEY
);

let currentChapterId;

async function fetchSubjects(chapterId) {
  const { data, error } = await supabase_connection
    .from("lessons")
    .select("*")
    .eq("chapter_id", chapterId)
    .order("created_at", { ascending: true });

  if (error) {
    console.error("Error fetching subjects:", error);
    return;
  }

  displaySubjects(data);
}

function displaySubjects(subjects) {
  const subjectsTableBody = document.getElementById("subjectsTableBody");
  subjectsTableBody.innerHTML = "";

  subjects.forEach((subject) => {
    const row = document.createElement("tr");
    row.innerHTML = `
            <td class="px-5 py-5 border-b border-gray-200 bg-white text-sm">
                <p class="text-gray-900 whitespace-no-wrap">${subject.title}</p>
            </td>
            <td class="px-5 py-5 border-b border-gray-200 bg-white text-sm">
                <p class="text-gray-900 whitespace-no-wrap">${subject.content.substring(
                  0,
                  50
                )}${subject.content.length > 50 ? "..." : ""}</p>
            </td>
            <td class="px-5 py-5 border-b border-gray-200 bg-white text-sm">
                <button class="edit-subject text-blue-600 hover:text-blue-900 mr-2" data-id="${
                  subject.id
                }">Edit</button>
                <button class="delete-subject text-red-600 hover:text-red-900" data-id="${
                  subject.id
                }">Delete</button>
            </td>
        `;
    subjectsTableBody.appendChild(row);
  });

  addSubjectEventListeners();
}

function addSubjectEventListeners() {
  document.querySelectorAll(".edit-subject").forEach((button) => {
    button.addEventListener("click", (e) => {
      const subjectId = e.target.dataset.id;
      editSubject(subjectId);
    });
  });

  document.querySelectorAll(".delete-subject").forEach((button) => {
    button.addEventListener("click", (e) => {
      const subjectId = e.target.dataset.id;
      deleteSubject(subjectId);
    });
  });
}

function showSubjectModal(subject = null) {
  const modal = document.getElementById("subjectModal");
  const form = document.getElementById("subjectForm");
  const modalTitle = document.getElementById("modalTitle");

  if (subject) {
    modalTitle.textContent = "Edit Subject";
    document.getElementById("subjectId").value = subject.id;
    document.getElementById("subjectTitle").value = subject.title;
    document.getElementById("subjectContent").value = subject.content;
  } else {
    modalTitle.textContent = "Add Subject";
    form.reset();
    document.getElementById("subjectId").value = "";
  }

  modal.classList.remove("hidden");
}

async function saveSubject(event) {
  event.preventDefault();

  const subjectId = document.getElementById("subjectId").value;
  const subjectTitle = document.getElementById("subjectTitle").value;
  const subjectContent = document.getElementById("subjectContent").value;

  const subjectData = {
    title: subjectTitle,
    content: subjectContent,
    chapter_id: currentChapterId,
  };

  let result;
  if (subjectId) {
    result = await supabase_connection
      .from("lessons")
      .update(subjectData)
      .eq("id", subjectId);
  } else {
    result = await supabase_connection.from("lessons").insert([subjectData]);
  }

  if (result.error) {
    console.error("Error saving subject:", result.error);
    alert("Error saving subject. Please try again.");
  } else {
    document.getElementById("subjectModal").classList.add("hidden");
    fetchSubjects(currentChapterId);
  }
}

async function editSubject(subjectId) {
  const { data, error } = await supabase_connection
    .from("lessons")
    .select("*")
    .eq("id", subjectId)
    .single();

  if (error) {
    console.error("Error fetching subject:", error);
    alert("Error fetching subject. Please try again.");
    return;
  }

  showSubjectModal(data);
}

async function deleteSubject(subjectId) {
  if (confirm("Are you sure you want to delete this subject?")) {
    const { data, error } = await supabase_connection
      .from("lessons")
      .delete()
      .eq("id", subjectId);

    if (error) {
      console.error("Error deleting subject:", error);
      alert("Error deleting subject. Please try again.");
    } else {
      fetchSubjects(currentChapterId);
    }
  }
}

document.addEventListener("DOMContentLoaded", () => {
  const urlParams = new URLSearchParams(window.location.search);
  currentChapterId = urlParams.get("chapterId");

  if (currentChapterId) {
    fetchSubjects(currentChapterId);

    document
      .getElementById("addSubjectBtn")
      .addEventListener("click", () => showSubjectModal());
    document
      .getElementById("subjectForm")
      .addEventListener("submit", saveSubject);
    document.getElementById("cancelBtn").addEventListener("click", () => {
      document.getElementById("subjectModal").classList.add("hidden");
    });
  } else {
    console.error("No chapter ID provided");
    alert("No chapter ID provided. Please go back and select a chapter.");
  }
});
