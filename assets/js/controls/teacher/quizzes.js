// assets/js/controls/quizzes.js

const SUPABASE_URL = "https://hvqvmxakmursjidtfmdj.supabase.co";
const SUPABASE_ANON_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imh2cXZteGFrbXVyc2ppZHRmbWRqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MTg2MDA4MjQsImV4cCI6MjAzNDE3NjgyNH0.dykJM61G-58LEnAyCUU6-irano2f4vraV8t1l8C5KZ8";

const supabase_connection = supabase.createClient(
  SUPABASE_URL,
  SUPABASE_ANON_KEY
);

let currentChapterId;

async function fetchQuizzes(chapterId) {
  const { data, error } = await supabase_connection
    .from("quizzes")
    .select("*")
    .eq("chapter_id", chapterId)
    .order("created_at", { ascending: true });

  if (error) {
    console.error("Error fetching quizzes:", error);
    return;
  }

  displayQuizzes(data);
}

function displayQuizzes(quizzes) {
  const quizzesTableBody = document.getElementById("quizzesTableBody");
  quizzesTableBody.innerHTML = "";

  quizzes.forEach((quiz) => {
    let questionsCount = 0;
    try {
      const parsedQuestions =
        typeof quiz.questions === "string"
          ? JSON.parse(quiz.questions)
          : quiz.questions;
      questionsCount = Array.isArray(parsedQuestions)
        ? parsedQuestions.length
        : 0;
    } catch (error) {
      console.error("Error parsing questions:", error);
    }

    const row = document.createElement("tr");
    row.innerHTML = `
            <td class="px-4 py-3 text-sm">
                ${quiz.title}
            </td>
            <td class="px-4 py-3 text-sm">
                ${
                  quiz.description
                    ? quiz.description.substring(0, 50) +
                      (quiz.description.length > 50 ? "..." : "")
                    : "No description"
                }
            </td>
            <td class="px-4 py-3 text-sm">
                ${questionsCount}
            </td>
            <td class="px-4 py-3">
                <div class="flex items-center space-x-4 text-sm">
                    <button onclick="editQuiz(${
                      quiz.id
                    })" class="flex items-center justify-between px-2 py-2 text-sm font-medium leading-5 text-purple-600 rounded-lg dark:text-gray-400 focus:outline-none focus:shadow-outline-gray" aria-label="Edit">
                        <svg class="w-5 h-5" aria-hidden="true" fill="currentColor" viewBox="0 0 20 20">
                            <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z"></path>
                        </svg>
                    </button>
                    <button onclick="deleteQuiz(${
                      quiz.id
                    })" class="flex items-center justify-between px-2 py-2 text-sm font-medium leading-5 text-purple-600 rounded-lg dark:text-gray-400 focus:outline-none focus:shadow-outline-gray" aria-label="Delete">
                        <svg class="w-5 h-5" aria-hidden="true" fill="currentColor" viewBox="0 0 20 20">
                            <path fill-rule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clip-rule="evenodd"></path>
                        </svg>
                    </button>
                </div>
            </td>
        `;
    quizzesTableBody.appendChild(row);
  });
}

async function editQuiz(quizId) {
  const { data: quiz, error } = await supabase
    .from("quizzes")
    .select("*")
    .eq("id", quizId)
    .single();

  if (error) {
    console.error("Error fetching quiz:", error);
    alert("Error fetching quiz. Please try again.");
    return;
  }

  showQuizModal(quiz);
}

function showQuizModal(quiz = null) {
  const modal = document.getElementById("quizModal");
  const form = document.getElementById("quizForm");
  const modalTitle = document.getElementById("modalTitle");
  const questionsContainer = document.getElementById("questionsContainer");

  if (quiz) {
    modalTitle.textContent = "Edit Quiz";
    document.getElementById("quizId").value = quiz.id;
    document.getElementById("quizTitle").value = quiz.title;
    document.getElementById("quizDescription").value = quiz.description || "";

    // Populate questions
    let questions = [];
    try {
      questions =
        typeof quiz.questions === "string"
          ? JSON.parse(quiz.questions)
          : quiz.questions;
    } catch (error) {
      console.error("Error parsing questions:", error);
    }

    questionsContainer.innerHTML = "";
    if (Array.isArray(questions)) {
      questions.forEach((question, index) => {
        addQuestionToForm(question, index);
      });
    }
  } else {
    modalTitle.textContent = "Add Quiz";
    form.reset();
    document.getElementById("quizId").value = "";
    questionsContainer.innerHTML = "";
    addQuestionToForm();
  }

  modal.classList.remove("hidden");
}

function addQuestionToForm(question = null, index = 0) {
  const questionsContainer = document.getElementById("questionsContainer");
  const questionDiv = document.createElement("div");
  questionDiv.classList.add("mb-4", "p-4", "border", "rounded");
  questionDiv.innerHTML = `
        <label class="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-400">
            Question ${index + 1}
        </label>
        <input type="text" name="questions[${index}][text]" class="w-full px-3 py-2 text-sm leading-tight text-gray-700 border rounded shadow appearance-none focus:outline-none focus:shadow-outline" value="${
    question ? question.text : ""
  }" required>
        <div class="mt-2">
            <label class="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-400">
                Options (comma-separated)
            </label>
            <input type="text" name="questions[${index}][options]" class="w-full px-3 py-2 text-sm leading-tight text-gray-700 border rounded shadow appearance-none focus:outline-none focus:shadow-outline" value="${
    question ? question.options.join(",") : ""
  }" required>
        </div>
        <div class="mt-2">
            <label class="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-400">
                Correct Answer
            </label>
            <input type="text" name="questions[${index}][correctAnswer]" class="w-full px-3 py-2 text-sm leading-tight text-gray-700 border rounded shadow appearance-none focus:outline-none focus:shadow-outline" value="${
    question ? question.correctAnswer : ""
  }" required>
        </div>
    `;
  questionsContainer.appendChild(questionDiv);
}

async function saveQuiz(event) {
  event.preventDefault();

  const quizId = document.getElementById("quizId").value;
  const quizTitle = document.getElementById("quizTitle").value;
  const quizDescription = document.getElementById("quizDescription").value;

  // Gather questions data
  const questions = [];
  const questionInputs = document.querySelectorAll("#questionsContainer > div");
  questionInputs.forEach((questionDiv, index) => {
    const text = questionDiv.querySelector(
      `input[name="questions[${index}][text]"]`
    ).value;
    const options = questionDiv
      .querySelector(`input[name="questions[${index}][options]"]`)
      .value.split(",")
      .map((option) => option.trim());
    const correctAnswer = questionDiv.querySelector(
      `input[name="questions[${index}][correctAnswer]"]`
    ).value;
    questions.push({ text, options, correctAnswer });
  });

  const quizData = {
    title: quizTitle,
    description: quizDescription,
    questions: JSON.stringify(questions),
    chapter_id: currentChapterId,
  };

  let result;
  if (quizId) {
    result = await supabase_connection
      .from("quizzes")
      .update(quizData)
      .eq("id", quizId);
  } else {
    result = await supabase_connection.from("quizzes").insert([quizData]);
  }

  if (result.error) {
    console.error("Error saving quiz:", result.error);
    alert("Failed to save quiz. Please try again.");
  } else {
    alert("Quiz saved successfully");
    document.getElementById("quizModal").classList.add("hidden");
    fetchQuizzes(currentChapterId);
  }
}

async function deleteQuiz(quizId) {
  if (confirm("Are you sure you want to delete this quiz?")) {
    const { data, error } = await supabase_connection
      .from("quizzes")
      .delete()
      .eq("id", quizId);

    if (error) {
      console.error("Error deleting quiz:", error);
      alert("Failed to delete quiz. Please try again.");
    } else {
      alert("Quiz deleted successfully");
      fetchQuizzes(currentChapterId);
    }
  }
}

document.addEventListener("DOMContentLoaded", () => {
  const urlParams = new URLSearchParams(window.location.search);
  currentChapterId = urlParams.get("chapterId");

  if (currentChapterId) {
    fetchQuizzes(currentChapterId);

    document
      .getElementById("addQuizBtn")
      .addEventListener("click", () => showQuizModal());
    document.getElementById("quizForm").addEventListener("submit", saveQuiz);
    document.getElementById("cancelBtn").addEventListener("click", () => {
      document.getElementById("quizModal").classList.add("hidden");
    });
    document.getElementById("addQuestionBtn").addEventListener("click", () => {
      const questionCount = document.querySelectorAll(
        "#questionsContainer > div"
      ).length;
      addQuestionToForm(null, questionCount);
    });
  } else {
    console.error("No chapter ID provided");
    alert("No chapter ID provided. Please go back and select a chapter.");
  }
});
