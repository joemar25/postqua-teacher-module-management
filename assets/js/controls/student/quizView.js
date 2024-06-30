const SUPABASE_URL = "https://hvqvmxakmursjidtfmdj.supabase.co";
const SUPABASE_ANON_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imh2cXZteGFrbXVyc2ppZHRmbWRqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MTg2MDA4MjQsImV4cCI6MjAzNDE3NjgyNH0.dykJM61G-58LEnAyCUU6-irano2f4vraV8t1l8C5KZ8";

let supabase_connection;

document.addEventListener("DOMContentLoaded", async () => {
  if (!supabase_connection) {
    initializeSupabase();
  }
  await loadQuizData();
});

function initializeSupabase() {
  supabase_connection = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
}

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

async function loadQuizData() {
  const urlParams = new URLSearchParams(window.location.search);
  const quizId = urlParams.get("quizId");

  if (!quizId) {
    alert("Quiz ID not provided");
    return;
  }

  try {
    const { data: quizData, error: quizError } = await supabase_connection
      .from("quizzes")
      .select("*")
      .eq("id", quizId)
      .single();

    if (quizError) throw quizError;

    document.getElementById("quizTitle").textContent = quizData.title;
    document.getElementById("quizDescription").textContent =
      quizData.description;

    displayQuestions(quizData.questions);
  } catch (error) {
    console.error("Error loading quiz data:", error);
    showNotification("Failed to load quiz data. Please try again.", true);
  }
}

function displayQuestions(questions) {
  const questionsContainer = document.getElementById("quizQuestions");
  questionsContainer.innerHTML = "";

  if (!questions || questions.length === 0) {
    questionsContainer.innerHTML = `<p class='text-sm text-gray-600 dark:text-gray-400'>No questions available.</p>`;
    return;
  }

  questions.forEach((questionObj, index) => {
    const questionItem = document.createElement("div");
    questionItem.className =
      "p-4 bg-white rounded-lg shadow-xs dark:bg-gray-800 mb-4";
    questionItem.innerHTML = `
      <h4 class="text-sm font-medium text-gray-800 dark:text-gray-300">Question ${
        index + 1
      }: ${questionObj.question}</h4>
      <ul class="list-disc ml-6 mt-2">
        ${questionObj.options
          .map(
            (option, i) =>
              `<li class="text-xs text-gray-600 dark:text-gray-400">${option}</li>`
          )
          .join("")}
      </ul>
    `;
    questionsContainer.appendChild(questionItem);
  });
}
