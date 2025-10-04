// =================================================================
// 🎯 PUSAT KONFIGURASI KUIS (EDIT HANYA BAGIAN INI UNTUK MENGGANTI KUIS)
// =================================================================

const quizConfig = {
    // 1. INFORMASI UMUM KUIS
    quizName: "Kuis Matematika - Penjumlahan", // Judul utama di tampilan & sertifikat
    quizTopic: "Matematika - Penjumlahan", // Nama kuis di hasil penilaian
    quizIcon: "🧮", // Emoji atau ikon di judul utama (misal: "🔬")
    
    // 2. TIMING
    timePerQuestionMinutes: 5, // Waktu pengerjaan per soal (dalam menit)
    
    // 3. BRANDING
    mainSubtitle: "Dibuat oleh Bimbel Brilian - www.bimbelbrilian.com", // Subjudul
    footerText: "Dibuat oleh Bimbel Brilian - www.bimbelbrilian.com", // Teks footer sertifikat
};

// =================================================================
// 📝 DATABASE SOAL (EDIT JUGA BAGIAN INI UNTUK SOAL BARU)
// =================================================================

const questionBank = [
  { question: "Hasil dari 7 + 8 adalah...", options: ["14", "15", "16", "17"], answer: "15" },
  { question: "Hasil dari 14 + 9 adalah...", options: ["22", "23", "24", "25"], answer: "23" },
  { question: "Hasil dari 27 + 15 adalah...", options: ["41", "42", "43", "44"], answer: "42" },
  // Tambahkan soal baru di sini
];

// =================================================================
// ⚙️ LOGIKA KUIS (JANGAN UBAH KECUALI ANDA PAHAM JAVASCRIPT)
// =================================================================

let timerInterval;
let timeLeft = 0;
let currentQuestions = [];
let isSubmitted = false;
let soundEnabled = true;
let voiceEnabled = false;
const audioContext = new (window.AudioContext || window.webkitAudioContext)();

// ... (kode fungsi playSound, playSelectSound, dsb. tetap sama) ...

function playSound(frequency, duration, type = 'sine') { /* ... kode sound ... */ }
function playSelectSound() { playSound(392, 0.1); }
function playCorrectSound() { playSound(523.25, 0.2); setTimeout(() => playSound(659.25, 0.2), 150); }
function playWrongSound() { playSound(220, 0.3, 'square'); }
function playCompleteSound() { playSound(523.25, 0.2); setTimeout(() => playSound(659.25, 0.2), 200); setTimeout(() => playSound(783.99, 0.4), 400); }
function playTimerSound() { playSound(330, 0.1); }
function speakText(text) { /* ... kode speech synth ... */ }
function updateVoiceIndicator() { /* ... kode voice indicator ... */ }
function saveProgress() { /* ... kode save progress ... */ }
function loadProgress() { /* ... kode load progress ... */ }
function updateProgressIndicator(message) { /* ... kode update indicator ... */ }
async function shareResults() { /* ... kode share results ... */ }
function shuffleArray(array) { /* ... kode shuffle array ... */ }
function initializeEventListeners() { /* ... kode event listeners ... */ }
function toggleSound() { /* ... kode toggle sound ... */ }
function toggleVoice() { /* ... kode toggle voice ... */ }
function setupResultButtonListeners() { /* ... kode setup result listeners ... */ }
function generateQuestions(progress = null) { /* ... kode generate questions ... */ }
function updateTimer() { /* ... kode update timer ... */ }
function updateStars(score, containerId) { /* ... kode update stars ... */ }
function updateAchievements(score, correct, total) { /* ... kode update achievements ... */ }
function toggleCertificate() { /* ... kode toggle certificate ... */ }
function retryQuiz() { /* ... kode retry quiz ... */ }
function showWrong() { /* ... kode show wrong ... */ }


// FUNGSI INI AKAN MENGUBAH SEMUA TEKS BERDASARKAN quizConfig
function updateQuizText() {
    // 1. Judul Halaman (Tab Browser)
    document.getElementById('pageTitle').textContent = quizConfig.quizName;

    // 2. Judul Utama di Tampilan (H1)
    document.getElementById('mainTitle').innerHTML = `${quizConfig.quizIcon} ${quizConfig.quizName}`;
    
    // 3. Subjudul
    document.getElementById('mainSubtitle').textContent = quizConfig.mainSubtitle;
    
    // 4. Nama Kuis di Hasil Penilaian
    const resultTopicEl = document.getElementById('resultQuizTopic');
    if (resultTopicEl) resultTopicEl.textContent = quizConfig.quizTopic;
    
    // 5. Nama Kuis di Sertifikat
    const certTopicEl = document.getElementById('certificateQuizTopic');
    if (certTopicEl) certTopicEl.textContent = quizConfig.quizTopic;
    
    // 6. Teks Footer Sertifikat
    const footerEl = document.getElementById('certificateFooterText');
    if (footerEl) footerEl.textContent = quizConfig.footerText;
}


function startQuiz() {
  const name = document.getElementById("name").value.trim();
  const school = document.getElementById("school").value.trim();

  if (!name || !school) {
    alert("Silakan isi nama dan asal sekolah terlebih dahulu!");
    return;
  }

  document.getElementById("startBtn").style.display = "none";
  document.getElementById("quizContent").classList.remove("hidden");
  document.getElementById("quizControls").classList.remove("hidden");
  document.getElementById("timer").classList.remove("hidden");
  document.getElementById("result").style.display = "none";

  isSubmitted = false;

  const savedProgress = loadProgress();

  if (savedProgress && savedProgress.currentQuestion.length > 0) {
    currentQuestions = savedProgress.currentQuestion.map(q => ({
      question: q.question,
      options: questionBank.find(qb => qb.question === q.question).options,
      answer: questionBank.find(qb => qb.question === q.question).answer,
      selectedAnswer: q.selectedAnswer,
      isCorrect: q.isCorrect
    }));
    timeLeft = savedProgress.timeLeft;
    generateQuestions(savedProgress);
  } else {
    generateQuestions();
    // Gunakan konfigurasi waktu dari quizConfig
    timeLeft = currentQuestions.length * quizConfig.timePerQuestionMinutes * 60; 
  }

  const progressInterval = setInterval(() => {
    if (!isSubmitted) {
      saveProgress();
    } else {
      clearInterval(progressInterval);
    }
  }, 30000);

  updateTimer();
  timerInterval = setInterval(() => {
    timeLeft--;
    updateTimer();

    if ((timeLeft <= 60 && timeLeft > 0 && timeLeft % 10 === 0) || (timeLeft <= 10 && timeLeft > 0)) {
      playTimerSound();
    }

    if (timeLeft <= 0) {
      clearInterval(timerInterval);
      submitQuiz();
    }
  }, 1000);

  playSound(523.25, 0.3);
}

function submitQuiz() {
  if (isSubmitted) return;

  isSubmitted = true;
  const submitBtn = document.getElementById("submitBtn");
  if (submitBtn) {
    submitBtn.disabled = true;
    submitBtn.style.display = 'none';
  }

  clearInterval(timerInterval);
  window.speechSynthesis.cancel();

  let correct = 0;
  let wrong = 0;
  let wrongList = [];

  document.querySelectorAll(".question").forEach((q, index) => {
    const answer = q.dataset.answer;
    const selected = q.querySelector("input[type='radio']:checked");
    const feedback = q.querySelector(".feedback");
    const options = q.querySelectorAll("input[type='radio']");

    options.forEach(opt => {
      opt.disabled = true;
      if (opt.value === answer) opt.parentElement.style.background = "#d1fae5";
      if (selected && opt === selected && opt.value !== answer) {
        opt.parentElement.style.background = "#fee2e2";
      }
    });

    if (selected && selected.value === answer) {
      correct++;
      feedback.textContent = "✅ Jawaban Benar!";
      feedback.className = "feedback benar";
      playCorrectSound();
    } else {
      wrong++;
      wrongList.push(index + 1);
      const answerText = selected ? 'Jawaban Salah.' : 'Belum dijawab.';
      feedback.textContent = `❌ ${answerText} Jawaban yang benar adalah: ${answer}`;
      feedback.className = "feedback salah";
      playWrongSound();
    }
  });

  const total = questionBank.length;
  const nilai = Math.round((correct / total) * 100);

  // Update elemen hasil
  document.getElementById("studentName").textContent = document.getElementById("name").value;
  document.getElementById("studentSchool").textContent = document.getElementById("school").value;
  document.getElementById("score").textContent = nilai;
  document.getElementById("summary").textContent =
    `Jawaban Benar: ${correct} | Jawaban Salah/Kosong: ${wrong}`;
  document.getElementById("wrongNumbers").textContent =
    wrongList.length > 0 ? `Soal yang salah/kosong: ${wrongList.join(", ")}` : "🎊 Semua soal benar!";

  const today = new Date();
  const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
  const tanggal = today.toLocaleDateString('id-ID', options);
  document.getElementById("tanggal").textContent = `Dikerjakan pada ${tanggal}`;

  updateStars(nilai, "starContainer");
  updateAchievements(nilai, correct, total);

  // Update elemen sertifikat
  document.getElementById("certificateName").textContent = document.getElementById("name").value;
  document.getElementById("certificateSchool").textContent = document.getElementById("school").value;
  document.getElementById("certificateScore").textContent = nilai;
  document.getElementById("certificateDate").textContent = `Tanggal: ${tanggal}`;
  updateStars(nilai, "certificateStars");

  setupResultButtonListeners();

  document.getElementById("retryBtn").classList.remove("hidden");
  document.getElementById("wrongBtn").classList.remove("hidden");

  document.getElementById("result").style.display = "block";
  document.getElementById("retryResultBtn").classList.remove("hidden");
  document.getElementById("wrongResultBtn").classList.remove("hidden");

  playCompleteSound();

  localStorage.removeItem('quizProgress');
}

function downloadCertificate() {
  const canvas = document.getElementById('downloadCanvas');
  const ctx = canvas.getContext('2d');
  
  const score = document.getElementById("score").textContent;
  const name = document.getElementById("name").value;
  const school = document.getElementById("school").value;
  const date = document.getElementById("certificateDate").textContent;
  const quizName = quizConfig.quizName; // Mengambil dari config
  const footerText = quizConfig.footerText; // Mengambil dari config

  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // Background gradient
  const gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
  gradient.addColorStop(0, '#fffbeb');
  gradient.addColorStop(1, '#fef3c7');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Border
  ctx.strokeStyle = 'gold';
  ctx.lineWidth = 10;
  ctx.strokeRect(20, 20, canvas.width - 40, canvas.height - 40);

  // Judul
  ctx.fillStyle = '#4f46e5';
  ctx.font = 'bold 60px Arial';
  ctx.textAlign = 'center';
  ctx.fillText('🏆 Sertifikat Prestasi', canvas.width / 2, 120);

  // Konten
  ctx.fillStyle = '#1e293b';
  ctx.font = '30px Arial';
  ctx.fillText('Diberikan kepada:', canvas.width / 2, 200);

  ctx.fillStyle = '#4f46e5';
  ctx.font = 'bold 40px Arial';
  ctx.fillText(name, canvas.width / 2, 260);

  ctx.fillStyle = '#1e293b';
  ctx.font = '25px Arial';
  ctx.fillText(`Asal Sekolah: ${school}`, canvas.width / 2, 310);
  ctx.fillText('Atas antusias dan prestasi luar biasanya dalam mengerjakan', canvas.width / 2, 360);

  ctx.font = 'bold 30px Arial';
  ctx.fillText(quizName, canvas.width / 2, 410);

  // Nilai
  ctx.fillStyle = '#10b981';
  ctx.font = 'bold 80px Arial';
  ctx.fillText(score, canvas.width / 2, 500);

  // Tanggal
  ctx.fillStyle = '#64748b';
  ctx.font = '20px Arial';
  ctx.fillText(date, canvas.width / 2, 560);

  // Bintang
  const starCount = Math.round((parseInt(score) / 100) * 5);
  const starSize = 40;
  const starSpacing = 60;
  const totalWidth = 5 * starSpacing;
  const startX = (canvas.width - totalWidth) / 2 + starSpacing / 2;

  for (let i = 0; i < 5; i++) {
    ctx.fillStyle = i < starCount ? 'gold' : '#e2e8f0';
    ctx.font = `${starSize}px Arial`;
    ctx.fillText('★', startX + i * starSpacing, 620);
  }

  // Footer
  ctx.fillStyle = '#64748b';
  ctx.font = '18px Arial';
  ctx.fillText(footerText, canvas.width / 2, 700);

  // Download image
  const link = document.createElement('a');
  const fileName = `sertifikat-${name}-${score}.jpg`;
  link.download = fileName;
  link.href = canvas.toDataURL('image/jpeg', 0.9);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}


// Initialize aplikasi saat DOM siap
document.addEventListener('DOMContentLoaded', function() {
  // Panggil fungsi untuk mengisi teks dari konfigurasi (Ini yang memastikan perubahan)
  updateQuizText();

  initializeEventListeners();

  const savedProgress = loadProgress();
  if (savedProgress) {
    document.getElementById('startBtn').textContent = '🚀 LANJUTKAN KUIS';
  }
});