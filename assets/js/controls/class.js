const SUPABASE_URL = "https://hvqvmxakmursjidtfmdj.supabase.co";
const SUPABASE_ANON_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imh2cXZteGFrbXVyc2ppZHRmbWRqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MTg2MDA4MjQsImV4cCI6MjAzNDE3NjgyNH0.dykJM61G-58LEnAyCUU6-irano2f4vraV8t1l8C5KZ8";

let supabase_connection;

document.addEventListener("DOMContentLoaded", async () => {
  initializeSupabase();
  await fetchClasses();
  await fetchCourses();
  setupEventListeners();
});

function setupEventListeners() {
  const addClassBtn = document.getElementById("addClassBtn");
  if (addClassBtn) {
    addClassBtn.addEventListener("click", () => showClassModal());
  } else {
    console.error("Add Class button not found");
  }

  const classForm = document.getElementById("classForm");
  if (classForm) {
    classForm.addEventListener("submit", saveClass);
  } else {
    console.error("Class form not found");
  }

  const cancelBtn = document.getElementById("cancelBtn");
  if (cancelBtn) {
    cancelBtn.addEventListener("click", () => {
      document.getElementById("classModal").classList.add("hidden");
    });
  } else {
    console.error("Cancel button not found");
  }

  const closeStudentListBtn = document.getElementById("closeStudentListBtn");
  if (closeStudentListBtn) {
    closeStudentListBtn.addEventListener("click", () => {
      document.getElementById("studentListModal").classList.add("hidden");
    });
  } else {
    console.error("Close Student List button not found");
  }

  const enrollSelectedStudentsBtn = document.getElementById(
    "enrollSelectedStudentsBtn"
  );
  if (enrollSelectedStudentsBtn) {
    enrollSelectedStudentsBtn.addEventListener("click", enrollSelectedStudents);
  } else {
    console.error("Enroll Selected Students button not found");
  }
}

function initializeSupabase() {
  supabase_connection = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
}

const teacherId = 1;

async function fetchClasses() {
  try {
    const { data: classes, error } = await supabase_connection
      .from("classes")
      .select(
        `
                *,
                courses (
                    id,
                    title
                )
            `
      )
      .eq("courses.teacher_id", teacherId);

    if (error) throw error;

    displayClasses(classes);
  } catch (error) {
    console.error("Error fetching classes:", error);
    alert("Failed to fetch classes. Please try again.");
  }
}

function displayClasses(classes) {
  const classesTableBody = document.getElementById("classesTableBody");
  classesTableBody.innerHTML = "";

  classes.forEach((class_) => {
    const row = document.createElement("tr");
    row.innerHTML = `
            <td class="px-4 py-3 text-sm">
                ${class_.class_name}
            </td>
            <td class="px-4 py-3 text-sm">
                ${class_.courses.title}
            </td>
            <td class="px-4 py-3 text-sm">
                ${new Date(class_.start_date).toLocaleDateString()}
            </td>
            <td class="px-4 py-3 text-sm">
                ${new Date(class_.end_date).toLocaleDateString()}
            </td>
            <td class="px-4 py-3">
                <div class="flex items-center space-x-4 text-sm">
                    <button onclick="editClass(${
                      class_.id
                    })" class="flex items-center justify-between px-2 py-2 text-sm font-medium leading-5 text-purple-600 rounded-lg dark:text-gray-400 focus:outline-none focus:shadow-outline-gray" aria-label="Edit">
                        <svg class="w-5 h-5" aria-hidden="true" fill="currentColor" viewBox="0 0 20 20">
                            <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z"></path>
                        </svg>
                    </button>
                    <button onclick="deleteClass(${
                      class_.id
                    })" class="flex items-center justify-between px-2 py-2 text-sm font-medium leading-5 text-purple-600 rounded-lg dark:text-gray-400 focus:outline-none focus:shadow-outline-gray" aria-label="Delete">
                        <svg class="w-5 h-5" aria-hidden="true" fill="currentColor" viewBox="0 0 20 20">
                            <path fill-rule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clip-rule="evenodd"></path>
                        </svg>
                    </button>
                    <button onclick="showStudentList(${
                      class_.id
                    })" class="flex items-center justify-between px-2 py-2 text-sm font-medium leading-5 text-purple-600 rounded-lg dark:text-gray-400 focus:outline-none focus:shadow-outline-gray" aria-label="View Students">
                        <svg class="w-5 h-5" aria-hidden="true" fill="currentColor" viewBox="0 0 20 20">
                            <path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3zM6 8a2 2 0 11-4 0 2 2 0 014 0zM16 18v-3a5.972 5.972 0 00-.75-2.906A3.005 3.005 0 0119 15v3h-3zM4.75 12.094A5.973 5.973 0 004 15v3H1v-3a3 3 0 013.75-2.906z"></path>
                        </svg>
                    </button>
                </div>
            </td>
        `;
    classesTableBody.appendChild(row);
  });
}

async function fetchCourses() {
  try {
    const { data: courses, error } = await supabase_connection
      .from("courses")
      .select("id, title")
      .eq("teacher_id", teacherId);

    if (error) throw error;

    const courseSelect = document.getElementById("courseName");
    courseSelect.innerHTML = "";
    courses.forEach((course) => {
      const option = document.createElement("option");
      option.value = course.id;
      option.textContent = course.title;
      courseSelect.appendChild(option);
    });
  } catch (error) {
    console.error("Error fetching courses:", error);
    alert("Failed to fetch courses. Please try again.");
  }
}

function showClassModal(class_ = null) {
  const modal = document.getElementById("classModal");
  const form = document.getElementById("classForm");
  const modalTitle = document.getElementById("modalTitle");

  if (class_) {
    modalTitle.textContent = "Edit Class";
    document.getElementById("classId").value = class_.id;
    document.getElementById("className").value = class_.class_name;
    document.getElementById("courseName").value = class_.course_id;
    document.getElementById("startDate").value = class_.start_date;
    document.getElementById("endDate").value = class_.end_date;
  } else {
    modalTitle.textContent = "Add Class";
    form.reset();
    document.getElementById("classId").value = "";
  }

  modal.classList.remove("hidden");
}

async function saveClass(event) {
  event.preventDefault();

  const classId = document.getElementById("classId").value;
  const className = document.getElementById("className").value;
  const courseId = document.getElementById("courseName").value;
  const startDate = document.getElementById("startDate").value;
  const endDate = document.getElementById("endDate").value;

  const classData = {
    class_name: className,
    course_id: courseId,
    start_date: startDate,
    end_date: endDate,
  };

  try {
    let result;
    if (classId) {
      result = await supabase_connection
        .from("classes")
        .update(classData)
        .eq("id", classId);
    } else {
      result = await supabase_connection.from("classes").insert([classData]);
    }

    if (result.error) throw result.error;

    alert("Class saved successfully");
    document.getElementById("classModal").classList.add("hidden");
    fetchClasses();
  } catch (error) {
    console.error("Error saving class:", error);
    alert("Failed to save class. Please try again.");
  }
}

async function deleteClass(classId) {
  if (confirm("Are you sure you want to delete this class?")) {
    try {
      const { error } = await supabase_connection
        .from("classes")
        .delete()
        .eq("id", classId);

      if (error) throw error;

      alert("Class deleted successfully");
      fetchClasses();
    } catch (error) {
      console.error("Error deleting class:", error);
      alert("Failed to delete class. Please try again.");
    }
  }
}

async function editClass(classId) {
  try {
    const { data: class_, error } = await supabase_connection
      .from("classes")
      .select("*")
      .eq("id", classId)
      .single();

    if (error) throw error;

    showClassModal(class_);
  } catch (error) {
    console.error("Error fetching class:", error);
    alert("Error fetching class details. Please try again.");
  }
}

function displayEnrolledStudents(classStudents, classId) {
  const enrolledStudentsList = document.getElementById("enrolledStudentsList");
  enrolledStudentsList.innerHTML = "";

  if (!classStudents || classStudents.length === 0) {
    enrolledStudentsList.innerHTML =
      "<p>No students enrolled in this class.</p>";
    return;
  }

  classStudents.forEach((enrollment) => {
    const student = enrollment.tbl_student;

    if (!student) {
      console.error("Student data is missing for enrollment:", enrollment);
      return;
    }

    const listItem = document.createElement("div");
    listItem.className = "flex justify-between items-center mb-2";
    listItem.innerHTML = `
        <span>${student.student_name || "N/A"} (${student.course || "N/A"} - ${
      student.Year || "N/A"
    })</span>
        <button onclick="removeStudent(${
          enrollment.id
        }, ${classId})" class="px-2 py-1 text-sm text-red-600 rounded-lg focus:outline-none focus:shadow-outline-red">
          Remove
        </button>
      `;
    enrolledStudentsList.appendChild(listItem);
  });
}
function populateStudentDropdown(availableStudents) {
  const studentList = document.getElementById("studentList");
  if (!studentList) {
    console.error("Student list element not found");
    return;
  }

  studentList.innerHTML = "";

  if (availableStudents.length === 0) {
    studentList.innerHTML = "<p>No available students to enroll.</p>";
    const enrollBtn = document.getElementById("enrollSelectedStudentsBtn");
    if (enrollBtn) {
      enrollBtn.style.display = "none";
    }
    return;
  }

  const enrollBtn = document.getElementById("enrollSelectedStudentsBtn");
  if (enrollBtn) {
    enrollBtn.style.display = "block";
  }

  availableStudents.forEach((student) => {
    const listItem = document.createElement("div");
    listItem.className = "flex items-center mb-2";
    listItem.innerHTML = `
        <input type="checkbox" id="student-${student.tbl_student_id}" value="${student.tbl_student_id}" class="mr-2">
        <label for="student-${student.tbl_student_id}">${student.student_name} (${student.course} - ${student.Year})</label>
      `;
    studentList.appendChild(listItem);
  });
}

async function enrollSelectedStudents() {
  const classId = document.querySelector("#studentListModal").dataset.classId;
  const selectedStudents = Array.from(
    document.querySelectorAll('#studentList input[type="checkbox"]:checked')
  ).map((checkbox) => checkbox.value);

  if (selectedStudents.length === 0) {
    alert("Please select at least one student to enroll.");
    return;
  }

  try {
    const { error } = await supabase_connection.from("class_students").insert(
      selectedStudents.map((studentId) => ({
        class_id: classId,
        student_id: studentId,
      }))
    );

    if (error) throw error;

    alert("Selected students enrolled successfully");
    showStudentList(classId);
  } catch (error) {
    console.error("Error enrolling students:", error);
    alert("Failed to enroll students. Please try again.");
  }
}

// Update showStudentList function
async function showStudentList(classId) {
  try {
    const { data: classStudents, error: classStudentsError } =
      await supabase_connection
        .from("class_students")
        .select("*, tbl_student(*)")
        .eq("class_id", classId);

    if (classStudentsError) throw classStudentsError;

    displayEnrolledStudents(classStudents, classId);

    const { data: allStudents, error: allStudentsError } =
      await supabase_connection.from("tbl_student").select("*");

    if (allStudentsError) throw allStudentsError;

    const enrolledIds = classStudents.map((cs) => cs.student_id);
    const availableStudents = allStudents.filter(
      (student) => !enrolledIds.includes(student.tbl_student_id)
    );

    populateStudentDropdown(availableStudents);

    document.querySelector("#studentListModal").dataset.classId = classId;
    document.getElementById("studentListModal").classList.remove("hidden");
  } catch (error) {
    console.error("Error fetching student data:", error);
    alert("Failed to fetch student data. Please try again.");
  }
}

async function removeStudent(enrollmentId, classId) {
  if (confirm("Are you sure you want to remove this student from the class?")) {
    try {
      const { error } = await supabase_connection
        .from("class_students")
        .delete()
        .eq("id", enrollmentId);

      if (error) throw error;

      alert("Student removed successfully");
      showStudentList(classId);
    } catch (error) {
      console.error("Error removing student:", error);
      alert("Failed to remove student. Please try again.");
    }
  }
}

async function enrollStudent() {
  const classId = document.querySelector("#studentListModal").dataset.classId;
  const studentId = document.getElementById("studentToEnroll").value;
  if (!studentId) {
    alert("Please select a student to enroll.");
    return;
  }
  try {
    const { error } = await supabase_connection
      .from("class_students")
      .insert([{ class_id: classId, student_id: studentId }]);

    if (error) throw error;

    alert("Student enrolled successfully");
    showStudentList(classId);
  } catch (error) {
    console.error("Error enrolling student:", error);
    alert("Failed to enroll student. Please try again.");
  }
}
