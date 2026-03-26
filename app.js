// ===== DATA LAYER =====
const ADMIN_CREDENTIALS = { username: 'llmadmin', password: 'llmMK26E0040' };

const RUBRICS = [
  { id: 'problemUnderstanding', name: 'Problem Understanding', max: 15 },
  { id: 'innovation', name: 'Innovation', max: 20 },
  { id: 'implementation', name: 'Implementation', max: 25 },
  { id: 'aiUsage', name: 'AI Usage', max: 15 },
  { id: 'uiux', name: 'UI/UX', max: 10 },
  { id: 'presentation', name: 'Presentation', max: 15 }
];

function getStudents() {
  return JSON.parse(localStorage.getItem('llm_students') || '[]');
}

function saveStudents(students) {
  localStorage.setItem('llm_students', JSON.stringify(students));
}

function getSubmissions() {
  return JSON.parse(localStorage.getItem('llm_submissions') || '[]');
}

function saveSubmissions(submissions) {
  localStorage.setItem('llm_submissions', JSON.stringify(submissions));
}

let currentUser = null;
let currentEvalRegNo = null;

// ===== TOAST NOTIFICATIONS =====
function showToast(message, type = 'info') {
  const container = document.getElementById('toastContainer');
  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  toast.textContent = message;
  container.appendChild(toast);
  setTimeout(() => toast.remove(), 3000);
}

// ===== PAGE NAVIGATION =====
function showPage(pageId) {
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  document.getElementById(pageId).classList.add('active');
}

// ===== TAB SWITCHING =====
function switchTab(card, tabId) {
  const cardEl = card === 'student' ? document.getElementById('studentLoginCard') : null;
  if (!cardEl) return;
  
  cardEl.querySelectorAll('.tab-btn').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.tab === tabId);
  });
  cardEl.querySelectorAll('.tab-content').forEach(tc => {
    tc.classList.toggle('active', tc.id === tabId);
  });
}

// ===== STUDENT REGISTRATION =====
function handleStudentRegister(e) {
  e.preventDefault();
  
  const name = document.getElementById('regName').value.trim();
  const regNo = document.getElementById('regRegNo').value.trim();
  const email = document.getElementById('regEmail').value.trim();
  const phone = document.getElementById('regPhone').value.trim();
  const password = document.getElementById('regPassword').value.trim();

  if (!name || !regNo || !email || !phone || !password) {
    showToast('Please fill all fields', 'error');
    return;
  }

  // Validate phone
  if (!/^\d{10}$/.test(phone)) {
    showToast('Phone number must be 10 digits', 'error');
    return;
  }

  // Validate email
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    showToast('Please enter a valid email', 'error');
    return;
  }

  const students = getStudents();
  
  if (students.find(s => s.regNo === regNo)) {
    showToast('Register number already exists', 'error');
    return;
  }

  if (students.find(s => s.email === email)) {
    showToast('Email already registered', 'error');
    return;
  }

  students.push({ name, regNo, email, phone, password });
  saveStudents(students);
  
  showToast('Registration successful! You can now login.', 'success');
  
  // Clear form & switch to login
  document.getElementById('regName').value = '';
  document.getElementById('regRegNo').value = '';
  document.getElementById('regEmail').value = '';
  document.getElementById('regPhone').value = '';
  document.getElementById('regPassword').value = '';
  switchTab('student', 'studentLogin');
}

// ===== STUDENT LOGIN =====
function handleStudentLogin(e) {
  e.preventDefault();
  
  const regNo = document.getElementById('loginRegNo').value.trim();
  const password = document.getElementById('loginPassword').value.trim();

  if (!regNo || !password) {
    showToast('Please fill all fields', 'error');
    return;
  }

  const students = getStudents();
  const student = students.find(s => s.regNo === regNo && s.password === password);

  if (!student) {
    showToast('Invalid credentials. Check register number and password.', 'error');
    return;
  }

  currentUser = student;
  document.getElementById('studentNameDisplay').textContent = student.name;
  showPage('studentDashboard');
  loadStudentDashboard();
  showToast(`Welcome, ${student.name}!`, 'success');
}

// ===== ADMIN LOGIN =====
function handleAdminLogin(e) {
  e.preventDefault();

  const username = document.getElementById('adminUsername').value.trim();
  const password = document.getElementById('adminPassword').value.trim();

  if (username === ADMIN_CREDENTIALS.username && password === ADMIN_CREDENTIALS.password) {
    currentUser = { role: 'admin' };
    showPage('adminDashboard');
    loadAdminDashboard();
    showToast('Welcome, Administrator!', 'success');
  } else {
    showToast('Invalid admin credentials', 'error');
  }
}

// ===== LOGOUT =====
function handleLogout() {
  currentUser = null;
  currentEvalRegNo = null;
  selectedFile = null;
  
  // Clear all form fields
  document.querySelectorAll('.form-input').forEach(i => i.value = '');
  document.getElementById('fileName').textContent = '';
  document.getElementById('uploadArea').classList.remove('has-file');
  
  showPage('loginPage');
  showToast('Logged out successfully', 'info');
}

// ===== FILE HANDLING =====
let selectedFile = null;

function handleFileSelect(e) {
  const file = e.target.files[0];
  if (!file) return;

  const allowedTypes = [
    'application/vnd.ms-powerpoint',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    'application/pdf'
  ];
  
  const allowedExts = ['.ppt', '.pptx', '.pdf'];
  const ext = '.' + file.name.split('.').pop().toLowerCase();

  if (!allowedExts.includes(ext)) {
    showToast('Only PPT, PPTX, and PDF files are allowed', 'error');
    e.target.value = '';
    return;
  }

  if (file.size > 10 * 1024 * 1024) {
    showToast('File size must be under 10MB', 'error');
    e.target.value = '';
    return;
  }

  selectedFile = file;
  document.getElementById('fileName').textContent = `📄 ${file.name} (${(file.size / 1024 / 1024).toFixed(2)} MB)`;
  document.getElementById('uploadArea').classList.add('has-file');
}

// Drag and drop
document.addEventListener('DOMContentLoaded', () => {
  const uploadArea = document.getElementById('uploadArea');
  if (!uploadArea) return;

  uploadArea.addEventListener('dragover', (e) => {
    e.preventDefault();
    uploadArea.classList.add('dragover');
  });

  uploadArea.addEventListener('dragleave', () => {
    uploadArea.classList.remove('dragover');
  });

  uploadArea.addEventListener('drop', (e) => {
    e.preventDefault();
    uploadArea.classList.remove('dragover');
    const file = e.dataTransfer.files[0];
    if (file) {
      // Trigger through the input for consistency
      const input = document.getElementById('pptFile');
      const dt = new DataTransfer();
      dt.items.add(file);
      input.files = dt.files;
      handleFileSelect({ target: input });
    }
  });
});

// ===== STUDENT SUBMISSION =====
function handleSubmission(e) {
  e.preventDefault();

  if (!selectedFile) {
    showToast('Please upload a PPT file', 'error');
    return;
  }

  if (!currentUser) {
    showToast('Session expired, please login again', 'error');
    return;
  }

  // Check if already submitted
  const submissions = getSubmissions();
  if (submissions.find(s => s.regNo === currentUser.regNo)) {
    showToast('You have already submitted your presentation', 'error');
    return;
  }

  // Read file as base64
  const reader = new FileReader();
  reader.onload = function(ev) {
    const fileData = ev.target.result;
    
    submissions.push({
      name: currentUser.name,
      regNo: currentUser.regNo,
      email: currentUser.email,
      phone: currentUser.phone,
      fileName: selectedFile.name,
      fileData: fileData,
      fileType: selectedFile.type,
      submittedAt: new Date().toISOString(),
      evaluation: null
    });

    saveSubmissions(submissions);
    selectedFile = null;
    showToast('Presentation submitted successfully! 🎉', 'success');
    loadStudentDashboard();
  };

  reader.onerror = function() {
    showToast('Error reading file. Please try again.', 'error');
  };

  reader.readAsDataURL(selectedFile);
}

// ===== STUDENT DASHBOARD LOAD =====
function loadStudentDashboard() {
  if (!currentUser) return;

  const submissions = getSubmissions();
  const sub = submissions.find(s => s.regNo === currentUser.regNo);

  if (sub) {
    document.getElementById('uploadSection').style.display = 'none';
    document.getElementById('submissionStatus').style.display = 'block';

    let statusHTML = `
      <div class="status-item">
        <div class="status-item-label">Name</div>
        <div class="status-item-value">${escapeHtml(sub.name)}</div>
      </div>
      <div class="status-item">
        <div class="status-item-label">Register No</div>
        <div class="status-item-value">${escapeHtml(sub.regNo)}</div>
      </div>
      <div class="status-item">
        <div class="status-item-label">Email</div>
        <div class="status-item-value">${escapeHtml(sub.email)}</div>
      </div>
      <div class="status-item">
        <div class="status-item-label">Phone</div>
        <div class="status-item-value">${escapeHtml(sub.phone)}</div>
      </div>
      <div class="status-item">
        <div class="status-item-label">File</div>
        <div class="status-item-value">${escapeHtml(sub.fileName)}</div>
      </div>
      <div class="status-item">
        <div class="status-item-label">Submitted</div>
        <div class="status-item-value">${new Date(sub.submittedAt).toLocaleString()}</div>
      </div>
    `;

    document.getElementById('statusInfo').innerHTML = statusHTML;

    // Show success message (scores are only visible to admin)
    const scoreArea = document.getElementById('scoreResultArea');
    scoreArea.innerHTML = `
      <div style="margin-top: 20px; padding: 16px; background: rgba(16, 185, 129, 0.1); border: 1px solid rgba(16, 185, 129, 0.2); border-radius: 8px; color: #10b981; font-size: 14px;">
        ✅ Your PPT has been submitted successfully for evaluation. Thank you!
      </div>
    `;
  } else {
    document.getElementById('uploadSection').style.display = 'block';
    document.getElementById('submissionStatus').style.display = 'none';
  }
}

// ===== ADMIN DASHBOARD LOAD =====
function loadAdminDashboard() {
  const submissions = getSubmissions();
  
  const total = submissions.length;
  const evaluated = submissions.filter(s => s.evaluation).length;
  const pending = total - evaluated;
  
  let avgScoreVal = '—';
  if (evaluated > 0) {
    const totalScore = submissions
      .filter(s => s.evaluation)
      .reduce((sum, s) => {
        return sum + RUBRICS.reduce((rs, r) => rs + (s.evaluation[r.id] || 0), 0);
      }, 0);
    avgScoreVal = (totalScore / evaluated).toFixed(1);
  }

  document.getElementById('totalSubmissions').textContent = total;
  document.getElementById('evaluatedCount').textContent = evaluated;
  document.getElementById('pendingCount').textContent = pending;
  document.getElementById('avgScore').textContent = avgScoreVal;

  renderSubmissionsTable();
}

// ===== RENDER TABLE =====
function renderSubmissionsTable() {
  const submissions = getSubmissions();
  const searchQuery = (document.getElementById('searchInput')?.value || '').toLowerCase();
  
  const filtered = submissions.filter(s => {
    if (!searchQuery) return true;
    return s.name.toLowerCase().includes(searchQuery) ||
           s.regNo.toLowerCase().includes(searchQuery) ||
           s.email.toLowerCase().includes(searchQuery);
  });

  const tbody = document.getElementById('submissionsTableBody');
  const emptyState = document.getElementById('emptyState');
  const table = document.getElementById('submissionsTable');

  if (filtered.length === 0) {
    tbody.innerHTML = '';
    table.style.display = 'none';
    emptyState.style.display = 'block';
    return;
  }

  table.style.display = 'table';
  emptyState.style.display = 'none';

  tbody.innerHTML = filtered.map((sub, i) => {
    const isEvaluated = !!sub.evaluation;
    const totalScore = isEvaluated 
      ? RUBRICS.reduce((sum, r) => sum + (sub.evaluation[r.id] || 0), 0)
      : 0;

    return `
      <tr>
        <td>${i + 1}</td>
        <td style="font-weight: 600; color: var(--text-primary);">${escapeHtml(sub.name)}</td>
        <td>${escapeHtml(sub.regNo)}</td>
        <td>${escapeHtml(sub.email)}</td>
        <td>${escapeHtml(sub.phone)}</td>
        <td>
          <a class="ppt-link" onclick="downloadPPT('${sub.regNo}')" title="Download ${escapeHtml(sub.fileName)}">
            📄 ${escapeHtml(sub.fileName)}
          </a>
        </td>
        <td>
          ${isEvaluated
            ? '<span class="badge badge-evaluated">✓ Evaluated</span>'
            : '<span class="badge badge-pending">⏳ Pending</span>'}
        </td>
        <td>
          ${isEvaluated
            ? `<span class="badge badge-score">${totalScore}/100</span>`
            : '—'}
        </td>
        <td>
          <div class="table-actions">
            <button class="btn btn-primary btn-sm" onclick="openEvaluation('${sub.regNo}')">
              ${isEvaluated ? '✏️ Edit' : '📝 Evaluate'}
            </button>
            <button class="btn btn-danger btn-sm" onclick="deleteSubmission('${sub.regNo}')">
              🗑️ Delete
            </button>
          </div>
        </td>
      </tr>
    `;
  }).join('');
}

// ===== DOWNLOAD PPT =====
function downloadPPT(regNo) {
  const submissions = getSubmissions();
  const sub = submissions.find(s => s.regNo === regNo);
  if (!sub || !sub.fileData) {
    showToast('File not found', 'error');
    return;
  }

  const link = document.createElement('a');
  link.href = sub.fileData;
  link.download = sub.fileName;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

// ===== DELETE SUBMISSION =====
function deleteSubmission(regNo) {
  if (!confirm('Are you sure you want to delete this submission? This action cannot be undone.')) return;

  let submissions = getSubmissions();
  submissions = submissions.filter(s => s.regNo !== regNo);
  saveSubmissions(submissions);

  loadAdminDashboard();
  showToast('Submission deleted successfully', 'success');
}

function deleteAllSubmissions() {
  if (!confirm('Are you sure you want to delete ALL submissions? This action cannot be undone.')) return;

  saveSubmissions([]);
  loadAdminDashboard();
  showToast('All submissions deleted', 'success');
}

// ===== EVALUATION MODAL =====
function openEvaluation(regNo) {
  currentEvalRegNo = regNo;
  const submissions = getSubmissions();
  const sub = submissions.find(s => s.regNo === regNo);
  if (!sub) return;

  // Fill student info
  document.getElementById('modalStudentInfo').innerHTML = `
    <div class="student-info-item">
      <label>Name</label>
      <span>${escapeHtml(sub.name)}</span>
    </div>
    <div class="student-info-item">
      <label>Register No</label>
      <span>${escapeHtml(sub.regNo)}</span>
    </div>
    <div class="student-info-item">
      <label>Email</label>
      <span>${escapeHtml(sub.email)}</span>
    </div>
    <div class="student-info-item">
      <label>Phone</label>
      <span>${escapeHtml(sub.phone)}</span>
    </div>
  `;

  // Build rubric sliders
  const rubricList = document.getElementById('rubricList');
  rubricList.innerHTML = RUBRICS.map(r => {
    const currentValue = sub.evaluation ? (sub.evaluation[r.id] || 0) : 0;
    return `
      <div class="rubric-item">
        <div class="rubric-header">
          <span class="rubric-name">${r.name}</span>
          <span class="rubric-score-display" id="display_${r.id}">${currentValue} / ${r.max}</span>
        </div>
        <input type="range" class="rubric-slider" id="slider_${r.id}" 
               min="0" max="${r.max}" value="${currentValue}" step="1"
               oninput="updateRubricDisplay('${r.id}', this.value, ${r.max})">
      </div>
    `;
  }).join('');

  updateTotalScore();
  document.getElementById('evalModal').classList.add('active');
}

function updateRubricDisplay(id, value, max) {
  document.getElementById(`display_${id}`).textContent = `${value} / ${max}`;
  updateTotalScore();
}

function updateTotalScore() {
  let total = 0;
  RUBRICS.forEach(r => {
    const slider = document.getElementById(`slider_${r.id}`);
    if (slider) total += parseInt(slider.value) || 0;
  });
  document.getElementById('modalTotalScore').textContent = `${total} / 100`;
}

function closeModal() {
  document.getElementById('evalModal').classList.remove('active');
  currentEvalRegNo = null;
}

function saveEvaluation() {
  if (!currentEvalRegNo) return;

  const submissions = getSubmissions();
  const subIndex = submissions.findIndex(s => s.regNo === currentEvalRegNo);
  if (subIndex === -1) return;

  const evaluation = {};
  RUBRICS.forEach(r => {
    const slider = document.getElementById(`slider_${r.id}`);
    evaluation[r.id] = parseInt(slider.value) || 0;
  });

  submissions[subIndex].evaluation = evaluation;
  saveSubmissions(submissions);

  closeModal();
  loadAdminDashboard();
  showToast('Evaluation saved successfully! ✅', 'success');
}

// ===== EXPORT CSV =====
function exportCSV() {
  const submissions = getSubmissions();
  if (submissions.length === 0) {
    showToast('No submissions to export', 'error');
    return;
  }

  const headers = ['Name', 'Register No', 'Email', 'Phone', 'File Name', 'Submitted At'];
  RUBRICS.forEach(r => headers.push(r.name + ` (${r.max})`));
  headers.push('Total Score');

  const rows = submissions.map(sub => {
    const row = [
      sub.name, sub.regNo, sub.email, sub.phone, sub.fileName,
      new Date(sub.submittedAt).toLocaleString()
    ];
    
    let total = 0;
    RUBRICS.forEach(r => {
      const score = sub.evaluation ? (sub.evaluation[r.id] || 0) : 0;
      total += score;
      row.push(score);
    });
    row.push(total);
    return row;
  });

  let csv = headers.join(',') + '\n';
  rows.forEach(row => {
    csv += row.map(v => `"${v}"`).join(',') + '\n';
  });

  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = `LLM_Prompt_to_Product_Evaluations_${new Date().toISOString().split('T')[0]}.csv`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  
  showToast('CSV exported successfully!', 'success');
}

// ===== UTILITY =====
function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

// Close modal on overlay click
document.addEventListener('click', (e) => {
  if (e.target.id === 'evalModal') {
    closeModal();
  }
});

// Close modal on Escape
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') closeModal();
});
