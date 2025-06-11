import { initializeApp } from "https://www.gstatic.com/firebasejs/11.9.0/firebase-app.js";
import {
  getAuth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  onAuthStateChanged,
  signOut
} from "https://www.gstatic.com/firebasejs/11.9.0/firebase-auth.js";
import {
  getDatabase,
  ref,
  push,
  onValue,
  remove,
  update
} from "https://www.gstatic.com/firebasejs/11.9.0/firebase-database.js";

const firebaseConfig = {
  apiKey: "AIzaSyCqeGYlQTO0Q55Ndy9EYp7q0AulIYhDLpA",
  authDomain: "femhack-9fae5.firebaseapp.com",
  databaseURL: "https://femhack-9fae5-default-rtdb.firebaseio.com",
  projectId: "femhack-9fae5",
  storageBucket: "femhack-9fae5.appspot.com",
  messagingSenderId: "1008278968390",
  appId: "1:1008278968390:web:aaf0bb78cda3efe9979247",
};
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getDatabase(app);
const provider = new GoogleAuthProvider();

const authSection = document.getElementById("auth-section");
const boardSection = document.getElementById("board-section");
const actionBtn = document.getElementById("actionBtn");
const toggleLink = document.getElementById("toggle-link");
const googleBtn = document.getElementById("googleBtn");
const logoutBtn = document.getElementById("logoutBtn");
const emailInput = document.getElementById("email");
const passwordInput = document.getElementById("password");
const createTaskBtn = document.getElementById("createTaskBtn");
const taskModal = document.getElementById("taskModal");
const taskTitle = document.getElementById("taskTitle");
const taskDesc = document.getElementById("taskDesc");
const taskAssigned = document.getElementById("taskAssigned");
const taskPriority = document.getElementById("taskPriority");
const saveTaskBtn = document.getElementById("saveTaskBtn");
const cancelBtn = document.getElementById("cancelBtn");
const todoTasks = document.getElementById("todoTasks");
const inProgressTasks = document.getElementById("inProgressTasks");
const doneTasks = document.getElementById("doneTasks");
const searchInput = document.getElementById("searchInput");

let authMode = "signup";
let currentUser = null;
let editMode = false;
let editKey = null;

toggleLink.onclick = () => {
  authMode = authMode === "signup" ? "login" : "signup";
  document.getElementById("auth-title").textContent =
    authMode === "signup" ? "SignUp Page" : "Login Page";
  actionBtn.textContent = authMode === "signup" ? "Sign Up" : "Login";
  toggleLink.textContent = authMode === "signup"
    ? "Already have an account? Login here"
    : "Don't have an account? Sign up here";
};

actionBtn.onclick = async () => {
  const email = emailInput.value.trim();
  const pass = passwordInput.value.trim();
  if (!email || !pass) return alert("Enter email and password");
  try {
    if (authMode === "signup") {
      await createUserWithEmailAndPassword(auth, email, pass);
    } else {
      await signInWithEmailAndPassword(auth, email, pass);
    }
  } catch (err) {
    return alert(err.message);
  }
  emailInput.value = "";
  passwordInput.value = "";
};

googleBtn.onclick = async () => {
  try {
    await signInWithPopup(auth, provider);
  } catch (err) {
    alert(err.message);
  }
};


logoutBtn.onclick = () => signOut(auth);

onAuthStateChanged(auth, (user) => {
  if (user) {
    currentUser = user;
    authSection.style.display = "none";
    boardSection.style.display = "block";
    loadTasks();
  } else {
    currentUser = null;
    authSection.style.display = "flex";
    boardSection.style.display = "none";
  }
});

createTaskBtn.onclick = () => openModal();
cancelBtn.onclick = () => closeModal();

function openModal(task = null, key = null) {
  taskModal.style.display = "flex";
  if (task) {
    taskTitle.value = task.title;
    taskDesc.value = task.desc;
    taskAssigned.value = task.assigned;
    taskPriority.value = task.priority;
    editMode = true;
    editKey = key;
  } else {
    taskTitle.value = "";
    taskDesc.value = "";
    taskAssigned.value = "";
    taskPriority.value = "Low";
    editMode = false;
    editKey = null;
  }
}

function closeModal() {
  taskModal.style.display = "none";
}

saveTaskBtn.onclick = () => {
  if (!currentUser) return alert("Please log in first");
  const title = taskTitle.value.trim();
  if (!title) return alert("Title is required");

  const task = {
    title,
    desc: taskDesc.value.trim(),
    assigned: taskAssigned.value.trim(),
    priority: taskPriority.value,
    status: "todo",
  };

  const tasksRef = ref(db, `tasks/${currentUser.uid}`);
  const operation = editMode && editKey
    ? update(ref(db, `tasks/${currentUser.uid}/${editKey}`), task)
    : push(tasksRef, task);

  operation
    .then(() => {
      alert(editMode ? "Task updated!" : "Task created!");
      closeModal();
      loadTasks();
    })
    .catch(err => alert(err.message));
};

searchInput.oninput = loadTasks;

function loadTasks() {
  if (!currentUser) return;
  const q = searchInput.value.trim().toLowerCase();
  const tasksRef = ref(db, `tasks/${currentUser.uid}`);

  onValue(tasksRef, (snapshot) => {
    todoTasks.innerHTML = "";
    inProgressTasks.innerHTML = "";
    doneTasks.innerHTML = "";

    snapshot.forEach(child => {
      const key = child.key;
      const t = child.val();

      if (q && ![t.title, t.desc, t.assigned].some(str => str.toLowerCase().includes(q))) {
        return;
      }
      renderTask(key, t);
    });
  });
}

function renderTask(key, t) {
  const el = document.createElement("div");
  el.className = `task-card ${t.priority.toLowerCase()}`;
  el.innerHTML = `
    <h4>${t.title}</h4>
    <p>${t.desc}</p>
    <small>Assigned: ${t.assigned}</small>
    <div class="actions">
      <select class="move-select">
        <option value="todo" ${t.status === 'todo'? 'selected': ''}>To Do</option>
        <option value="inprogress" ${t.status === 'inprogress'? 'selected': ''}>In Progress</option>
        <option value="done" ${t.status === 'done'? 'selected': ''}>Done</option>
      </select>
      <button class="edit-btn">Edit</button>
      <button class="delete-btn">Delete</button>
    </div>`;

  el.querySelector(".move-select").onchange = e => {
    update(ref(db, `tasks/${currentUser.uid}/${key}`), { status: e.target.value });
  };
  el.querySelector(".edit-btn").onclick = () => openModal(t, key);
  el.querySelector(".delete-btn").onclick = () => {
    if (confirm("Delete this task?")) {
      remove(ref(db, `tasks/${currentUser.uid}/${key}`));
    }
  };

  const target =
    t.status === "todo" ? todoTasks :
    t.status === "inprogress" ? inProgressTasks :
    doneTasks;
  target.appendChild(el);
}
