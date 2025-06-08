import { initializeApp } from "https://www.gstatic.com/firebasejs/11.9.0/firebase-app.js";
import {
  getAuth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  onAuthStateChanged,
  signOut,
} from "https://www.gstatic.com/firebasejs/11.9.0/firebase-auth.js";
import {
  getFirestore,
  collection,
  addDoc,
  getDocs,
  doc,
  updateDoc,
  deleteDoc,
} from "https://www.gstatic.com/firebasejs/11.9.0/firebase-firestore.js";

// Your Firebase config
const firebaseConfig = {
  apiKey: "AIzaSyCqeGYlQTO0Q55Ndy9EYp7q0AulIYhDLpA",
  authDomain: "femhack-9fae5.firebaseapp.com",
  databaseURL: "https://femhack-9fae5-default-rtdb.firebaseio.com",
  projectId: "femhack-9fae5",
  storageBucket: "femhack-9fae5.firebasestorage.app",
  messagingSenderId: "1008278968390",
  appId: "1:1008278968390:web:aaf0bb78cda3efe9979247",
  measurementId: "G-NPMYDDBLRJ",
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const provider = new GoogleAuthProvider();

// Mode: signup or login
let authMode = "signup";

// DOM Elements
const authSection = document.getElementById("auth-section");
const boardSection = document.getElementById("board-section");
const actionBtn = document.getElementById("actionBtn");
const toggleLink = document.getElementById("toggle-link");
const googleBtn = document.getElementById("googleBtn");
const logoutBtn = document.getElementById("logoutBtn");
const authTitle = document.getElementById("auth-title");

const emailInput = document.getElementById("email");
const passwordInput = document.getElementById("password");

const todoCol = document.getElementById("todo");
const inprogressCol = document.getElementById("inprogress");
const doneCol = document.getElementById("done");

// Task form elements
const taskFormContainer = document.getElementById("task-form-container");
const taskTitleInput = document.getElementById("taskTitle");
const taskDescriptionInput = document.getElementById("taskDescription");
const taskAssignedToInput = document.getElementById("taskAssignedTo");
const taskPrioritySelect = document.getElementById("taskPriority");
const saveTaskBtn = document.getElementById("saveTaskBtn");
const cancelTaskBtn = document.getElementById("cancelTaskBtn");

const createTaskBtn = document.getElementById("createTaskBtn");

let editingTaskId = null; // null when creating new, or id when editing

// Toggle between signup and login mode
toggleLink.addEventListener("click", () => {
  if (authMode === "signup") {
    authMode = "login";
    authTitle.textContent = "Login Page";
    actionBtn.textContent = "Login";
    toggleLink.textContent = "Sign up here";
  } else {
    authMode = "signup";
    authTitle.textContent = "SignUp Page";
    actionBtn.textContent = "Sign Up";
    toggleLink.textContent = "Login here";
  }
});

// Signup or Login function
actionBtn.addEventListener("click", async () => {
  const email = emailInput.value.trim();
  const password = passwordInput.value.trim();

  if (!email || !password) {
    alert("Please enter email and password.");
    return;
  }

  try {
    if (authMode === "signup") {
      await createUserWithEmailAndPassword(auth, email, password);
      alert("Signup successful!");
    } else {
      await signInWithEmailAndPassword(auth, email, password);
      alert("Login successful!");
    }
    emailInput.value = "";
    passwordInput.value = "";
  } catch (error) {
    alert(error.message);
  }
});

// Google Sign-In
googleBtn.addEventListener("click", async () => {
  try {
    await signInWithPopup(auth, provider);
    alert("Google login successful!");
  } catch (error) {
    alert(error.message);
  }
});

// Logout
logoutBtn.addEventListener("click", async () => {
  await signOut(auth);
});

// Render tasks in columns
function renderTasks(tasks) {
  // Clear columns
  todoCol.innerHTML = "<h2>To Do</h2>";
  inprogressCol.innerHTML = "<h2>In Progress</h2>";
  doneCol.innerHTML = "<h2>Done</h2>";

  tasks.forEach(({ id, data }) => {
    const card = document.createElement("div");
    card.className = "card";
    card.innerHTML = `
      <h4>${data.title}</h4>
      <p>${data.description}</p>
      <p><strong>Assigned to:</strong> ${data.assignedTo}</p>
      <p><strong>Priority:</strong> ${data.priority}</p>
      <div class="card-buttons" style="display:flex; gap:8px; flex-wrap:wrap;">
        <button class="move-btn">${getMoveButtonText(data.status)}</button>
        <button class="edit-btn">Edit</button>
        <button class="delete-btn">Delete</button>
      </div>
    `;

    card.querySelector(".move-btn").addEventListener("click", () => moveTask(id, data.status));
    card.querySelector(".edit-btn").addEventListener("click", () => openEditForm(id, data));
    card.querySelector(".delete-btn").addEventListener("click", () => deleteTask(id));

    if (data.status === "todo") todoCol.appendChild(card);
    else if (data.status === "inprogress") inprogressCol.appendChild(card);
    else if (data.status === "done") doneCol.appendChild(card);
  });
}

function getMoveButtonText(status) {
  switch (status) {
    case "todo":
      return "Move to In Progress";
    case "inprogress":
      return "Move to Done";
    case "done":
      return "Move to To Do";
    default:
      return "Move";
  }
}

// Load tasks from Firestore
async function loadTasks() {
  const snapshot = await getDocs(collection(db, "tasks"));
  const tasks = snapshot.docs.map(docSnap => ({ id: docSnap.id, data: docSnap.data() }));
  renderTasks(tasks);
}

// Move task to next status
async function moveTask(id, currentStatus) {
  let newStatus = "todo";
  if (currentStatus === "todo") newStatus = "inprogress";
  else if (currentStatus === "inprogress") newStatus = "done";
  else if (currentStatus === "done") newStatus = "todo";

  await updateDoc(doc(db, "tasks", id), { status: newStatus });
  loadTasks();
}

// Delete task
async function deleteTask(id) {
  if (!confirm("Are you sure you want to delete this task?")) return;
  await deleteDoc(doc(db, "tasks", id));
  loadTasks();
}

// Open edit form with task data
function openEditForm(id, data) {
  editingTaskId = id;
  taskTitleInput.value = data.title;
  taskDescriptionInput.value = data.description;
  taskAssignedToInput.value = data.assignedTo;
  taskPrioritySelect.value = data.priority;
  taskFormContainer.style.display = "block";
  createTaskBtn.style.display = "none";
  window.scrollTo({ top: 0, behavior: "smooth" });
}

// Clear and hide the task form
function closeTaskForm() {
  editingTaskId = null;
  taskTitleInput.value = "";
  taskDescriptionInput.value = "";
  taskAssignedToInput.value = "";
  taskPrioritySelect.value = "Least Important";
  taskFormContainer.style.display = "none";
  createTaskBtn.style.display = "inline-block";
}

// Save task (create or update)
saveTaskBtn.addEventListener("click", async () => {
  const title = taskTitleInput.value.trim();
  if (!title) {
    alert("Task title is required.");
    return;
  }
  const description = taskDescriptionInput.value.trim();
  const assignedTo = taskAssignedToInput.value.trim();
  const priority = taskPrioritySelect.value;

  try {
    if (editingTaskId) {
      // update existing
      await updateDoc(doc(db, "tasks", editingTaskId), {
        title,
        description,
        assignedTo,
        priority,
      });
      alert("Task updated!");
    } else {
      // create new
      await addDoc(collection(db, "tasks"), {
        title,
        description,
        assignedTo,
        priority,
        status: "todo",
      });
      alert("Task created!");
    }
    closeTaskForm();
    loadTasks();
  } catch (e) {
    alert("Error saving task: " + e.message);
  }
});

// Cancel task creation/editing
cancelTaskBtn.addEventListener("click", () => {
  closeTaskForm();
});

// Show the task form when Create Task button clicked
createTaskBtn.addEventListener("click", () => {
  closeTaskForm(); // reset form
  taskFormContainer.style.display = "block";
  createTaskBtn.style.display = "none";
  window.scrollTo({ top: 0, behavior: "smooth" });
});

// React to Auth State changes
onAuthStateChanged(auth, (user) => {
  if (user) {
    // User logged in
    authSection.style.display = "none";
    boardSection.style.display = "block";
    logoutBtn.style.display = "inline-block";
    loadTasks();
  } else {
    // No user logged in
    authSection.style.display = "block";
    boardSection.style.display = "none";
    logoutBtn.style.display = "none";
    closeTaskForm(); // hide form if user logs out while editing
  }
});

