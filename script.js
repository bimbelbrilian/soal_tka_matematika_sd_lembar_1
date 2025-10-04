// ================================
// KONFIGURASI KUIS - EDIT BAGIAN INI SAJA
// ================================
const quizConfig = {
  title: "Soal TKA Matematika SD",
  subject: "Lembar 1",
  description: "Dibuat oleh Bimbel Brilian - www.bimbelbrilian.com"
};

const questionBank = [
  { question: "Hasil dari 7 + 8 adalah...", options: ["14", "15", "16", "17"], answer: "15" },
  { question: "Hasil dari 14 + 9 adalah...", options: ["22", "23", "24", "25"], answer: "23" },
  { question: "Hasil dari 27 + 15 adalah...", options: ["41", "42", "43", "44"], answer: "42" },
  { question: "Hasil dari 36 + 22 adalah...", options: ["57", "58", "59", "60"], answer: "58" },
  { question: "Hasil dari 45 + 32 adalah...", options: ["76", "77", "78", "79"], answer: "77" },
  { question: "Hasil dari 58 + 36 adalah...", options: ["93", "94", "95", "96"], answer: "94" },
  { question: "Hasil dari 67 + 48 adalah...", options: ["114", "115", "116", "117"], answer: "115" },
  { question: "Hasil dari 89 + 43 adalah...", options: ["131", "132", "133", "134"], answer: "132" },
  { question: "Hasil dari 97 + 59 adalah...", options: ["155", "156", "157", "158"], answer: "156" },
  { question: "Hasil dari 125 + 59 adalah...", options: ["183", "184", "185", "186"], answer: "184" }
];

// ================================
// VARIABEL GLOBAL
// ================================
let timerInterval;
let timeLeft = 0;
let currentQuestions = [];
let isSubmitted = false;
let soundEnabled = true;
let voiceEnabled = false;

// ================================
// FUNGSI UTAMA
// ================================

// Update semua judul secara dinamis
function updateQuizTitles() {
  const fullTitle = `Kuis ${quizConfig.subject} - ${quizConfig.title}`;
  
  document.getElementById('dynamicTitle').textContent = fullTitle;
  document.getElementById('quizTitle').textContent = `🧮 ${fullTitle}`;
  document.getElementById('quizSubtitle').textContent = quizConfig.description;
  document.getElementById('resultTitle').innerHTML = `<strong>${fullTitle}</strong>`;
  document.getElementById('certificateTitle').innerHTML = `<strong>${fullTitle}</strong>`;
}

// Sound Effects menggunakan Web Audio API
const audioContext = new (window.AudioContext || window.webkitAudioContext)();

function playSound(frequency, duration, type = 'sine') {
  if (!soundEnabled) return;
  
  try {
    if (audioContext.state === 'suspended') {
      audioContext.resume();
    }
    
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);
    
    oscillator.frequency.setValueAtTime(frequency, audioContext.currentTime);
    oscillator.type = type;
    
    gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + duration);
    
    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + duration);
  } catch (error) {
    console.log('Sound tidak didukung di browser ini');
  }
}

function playSelectSound() {
  playSound(392, 0.1);
}

function playCorrectSound() {
  playSound(523.25, 0.2);
  setTimeout(() => playSound(659.25, 0.2), 150);
}

function playWrongSound() {
  playSound(220, 0.3, 'square');
}

function playCompleteSound() {
  playSound(523.25, 0.2);
  setTimeout(() => playSound(659.25, 0.2), 200);
  setTimeout(() => playSound(783.99, 0.4), 400);
}

function playTimerSound() {
  playSound(330, 0.1);
}

// Text-to-Speech
function speakText(text) {
  if (!voiceEnabled) return;
  
  if ('speechSynthesis' in window) {
    window.speechSynthesis.cancel();
    
    const speech = new SpeechSynthesisUtterance(text);
    speech.lang = 'id-ID';
    speech.rate = 0.9;
    speech.pitch = 1;
    speech.volume = 1;
    
    window.speechSynthesis.speak(speech);
  }
}

// Update tampilan indikator suara
function updateVoiceIndicator() {
  const questions = document.querySelectorAll('.question');
  const voiceBtn = document.getElementById('voiceBtn');
  
  if (voiceEnabled) {
    document.getElementById('quizContent').classList.add('voice-enabled');
    voiceBtn.classList.add('active');
    voiceBtn.innerHTML = '🔊 Baca Soal';
    
    questions.forEach(question => {
      const questionText = question.querySelector('p');
      if (!questionText.querySelector('.voice-indicator')) {
        const indicator = document.createElement('span');
        indicator.className = 'voice-indicator';
        indicator.innerHTML = '🔊';
        questionText.appendChild(indicator);
      }
    });
  } else {
    document.getElementById('quizContent').classList.remove('voice-enabled');
    voiceBtn.classList.remove('active');
    voiceBtn.innerHTML = '🎤 Baca Soal';
    
    questions.forEach(question => {
      const indicator = question.querySelector('.voice-indicator');
      if (indicator) {
        indicator.remove();
      }
    });
  }
}

// Progress Saving
function saveProgress() {
  const progress = {
    name: document.getElementById('name').value,
    school: document.getElementById('school').value,
    currentQuestion: currentQuestions.length > 0 ? currentQuestions.map((q, index) => {
      const questionDiv = document.querySelector(`.question:nth-child(${index + 1})`);
      const selected = questionDiv ? questionDiv.querySelector('input[type="radio"]:checked') : null;
      return {
        question: q.question,
        selectedAnswer: selected ? selected.value : null,
        isCorrect: selected ? selected.value === q.answer : false
      };
    }) : [],
    timeLeft: timeLeft,
    timestamp: new Date().getTime()
  };
  
  localStorage.setItem('quizProgress', JSON.stringify(progress));
  updateProgressIndicator('Progress tersimpan!');
}

function loadProgress() {
  const saved = localStorage.getItem('quizProgress');
  if (saved) {
    const progress = JSON.parse(saved);
    
    const oneHour = 60 * 60 * 1000;
    if (new Date().getTime() - progress.timestamp < oneHour) {
      document.getElementById('name').value = progress.name || '';
      document.getElementById('school').value = progress.school || '';
      updateProgressIndicator('Progress sebelumnya ditemukan! Klik "Lanjutkan" untuk melanjutkan.');
      return progress;
    } else {
      localStorage.removeItem('quizProgress');
    }
  }
  return null;
}

function updateProgressIndicator(message) {
  const indicator = document.getElementById('progressIndicator');
  indicator.textContent = message;
  indicator.style.display = 'block';
  
  setTimeout(() => {
    indicator.style.display = 'none';
  }, 3000);
}

// Social Sharing
async function shareResults() {
  const score = document.getElementById('score').textContent;
  const name = document.getElementById('studentName').textContent;
  const text = `🎉 ${name} berhasil mendapatkan nilai ${score}% dalam Kuis ${quizConfig.subject} - ${quizConfig.title} dari Bimbel Brilian! 🧮✨`;
  
  try {
    if (navigator.share) {
      await navigator.share({
        title: `Hasil Kuis ${quizConfig.subject} Bimbel Brilian`,
        text: text,
        url: window.location.href
      });
    } else if (navigator.clipboard) {
      await navigator.clipboard.writeText(text);
      alert('📋 Hasil berhasil disalin ke clipboard!');
    } else {
      const textArea = document.createElement('textarea');
      textArea.value = text;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      alert('📋 Hasil berhasil disalin ke clipboard!');
    }
  } catch (error) {
    console.log('Error sharing:', error);
    alert('❌ Gagal membagikan hasil. Silakan coba manual.');
  }
}

// Fisher-Yates Shuffle Algorithm
function shuffleArray(array) {
  const newArray = [...array];
  for (let i = newArray.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
  }
  return newArray;
}

// Initialize Event Listeners
function initializeEventListeners() {
  document.getElementById('startBtn').addEventListener('click', startQuiz);
  document.getElementById('soundToggle').addEventListener('click', toggleSound);
  document.getElementById('voiceBtn').addEventListener('click', toggleVoice);
  document.getElementById('shareBtn').addEventListener('click', shareResults);
  
  setupResultButtonListeners();
}

function toggleSound() {
  soundEnabled = !soundEnabled;
  const button = document.getElementById('soundToggle');
  button.textContent = soundEnabled ? '🔊 Sound' : '🔇 Sound';
  playSound(440, 0.1);
}

function toggleVoice() {
  voiceEnabled = !voiceEnabled;
  updateVoiceIndicator();
  
  if (voiceEnabled) {
    speakText('Fitur suara diaktifkan. Klik pada soal untuk mendengarkan pertanyaan.');
  }
}

// Setup event listeners untuk tombol hasil
function setupResultButtonListeners() {
  const certificateBtn = document.getElementById('certificateBtn');
  const downloadBtn = document.getElementById('downloadBtn');
  const retryResultBtn = document.getElementById('retryResultBtn');
  const wrongResultBtn = document.getElementById('wrongResultBtn');
  
  certificateBtn.replaceWith(certificateBtn.cloneNode(true));
  downloadBtn.replaceWith(downloadBtn.cloneNode(true));
  retryResultBtn.replaceWith(retryResultBtn.cloneNode(true));
  wrongResultBtn.replaceWith(wrongResultBtn.cloneNode(true));
  
  document.getElementById('certificateBtn').addEventListener('click', toggleCertificate);
  document.getElementById('downloadBtn').addEventListener('click', downloadCertificate);
  document.getElementById('retryResultBtn').addEventListener('click', retryQuiz);
  document.getElementById('wrongResultBtn').addEventListener('click', showWrong);
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

  isSubmitted = false;
  generateQuestions();

  timeLeft = currentQuestions.length * 5 * 60;

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
    
    if (timeLeft <= 60 && timeLeft % 10 === 0) {
      playTimerSound();
    }
    
    if (timeLeft <= 0) {
      clearInterval(timerInterval);
      submitQuiz();
    }
  }, 1000);

  playSound(523.25, 0.3);
}

function generateQuestions() {
  const quizContent = document.getElementById("quizContent");
  quizContent.innerHTML = '';
  
  currentQuestions = [...questionBank];
  
  currentQuestions.forEach((q, index) => {
    const questionDiv = document.createElement('div');
    questionDiv.className = 'question';
    questionDiv.dataset.answer = q.answer;
    
    const shuffledOptions = shuffleArray([...q.options]);
    const optionLetters = ['a', 'b', 'c', 'd'];
    
    let optionsHTML = '';
    shuffledOptions.forEach((option, optIndex) => {
      optionsHTML += `
        <label>
          <input type="radio" name="q${index + 1}" value="${option}">
          ${optionLetters[optIndex]}. ${option}
        </label>
      `;
    });
    
    questionDiv.innerHTML = `
      <p onclick="speakText('${q.question}')">${index + 1}. ${q.question}</p>
      ${optionsHTML}
      <p class="feedback"></p>
    `;
    
    quizContent.appendChild(questionDiv);
  });

  updateVoiceIndicator();

  setTimeout(() => {
    document.querySelectorAll('input[type="radio"]').forEach(radio => {
      radio.addEventListener('change', function() {
        if (this.checked) {
          playSelectSound();
        }
      });
    });
  }, 100);

  const buttonGroup = document.createElement('div');
  buttonGroup.className = 'button-group';
  buttonGroup.innerHTML = `
    <button id="submitBtn">✅ Koreksi Jawaban</button>
    <button id="retryBtn" class="hidden">🔄 Kerjakan Ulang</button>
    <button id="wrongBtn" class="hidden">📝 Lihat Hasil Salah Saja</button>
  `;
  quizContent.appendChild(buttonGroup);

  document.getElementById('submitBtn').addEventListener('click', submitQuiz);
  document.getElementById('retryBtn').addEventListener('click', retryQuiz);
  document.getElementById('wrongBtn').addEventListener('click', showWrong);
}

function updateTimer() {
  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;
  document.getElementById("time").textContent =
    `${minutes.toString().padStart(2,"0")}:${seconds.toString().padStart(2,"0")}`;
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

    if (selected) {
      if (selected.value === answer) {
        correct++;
        feedback.textContent = "✅ Jawaban Benar!";
        feedback.className = "feedback benar";
        playCorrectSound();
      } else {
        wrong++;
        wrongList.push(index + 1);
        feedback.textContent = "❌ Jawaban Salah";
        feedback.className = "feedback salah";
        playWrongSound();
      }
    } else {
      wrong++;
      wrongList.push(index + 1);
      feedback.textContent = "⏰ Belum dijawab";
      feedback.className = "feedback salah";
      playWrongSound();
    }
  });

  const total = correct + wrong;
  const nilai = Math.round((correct / total) * 100);

  document.getElementById("studentName").textContent = document.getElementById("name").value;
  document.getElementById("studentSchool").textContent = document.getElementById("school").value;
  document.getElementById("score").textContent = nilai;
  document.getElementById("summary").textContent =
    `Jawaban Benar: ${correct} | Jawaban Salah: ${wrong}`;
  document.getElementById("wrongNumbers").textContent =
    wrongList.length > 0 ? `Soal yang salah: ${wrongList.join(", ")}` : "🎊 Semua soal benar!";

  const today = new Date();
  const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
  const tanggal = today.toLocaleDateString('id-ID', options);
  document.getElementById("tanggal").textContent = `Dikerjakan pada ${tanggal}`;

  updateStars(nilai, "starContainer");
  updateAchievements(nilai, correct, total);

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

function updateStars(score, containerId) {
  const starContainer = document.getElementById(containerId);
  starContainer.innerHTML = '';
  
  const totalStars = 5;
  const filledStars = Math.round((score / 100) * totalStars);
  
  for (let i = 0; i < totalStars; i++) {
    const star = document.createElement('div');
    star.className = `star ${i < filledStars ? 'filled' : ''}`;
    star.innerHTML = '★';
    starContainer.appendChild(star);
  }
}

function updateAchievements(score, correct, total) {
  const achievementsContainer = document.getElementById("achievements");
  achievementsContainer.innerHTML = '';
  
  const achievements = [];
  
  if (score === 100) {
    achievements.push('🏆 Perfect Score!');
  }
  if (score >= 90) {
    achievements.push('⭐ Excellent!');
  }
  if (score >= 80) {
    achievements.push('👍 Great Job!');
  }
  if (correct === total) {
    achievements.push('🎯 All Correct!');
  }
  if (score >= 70) {
    achievements.push('💪 Good Effort!');
  }
  
  achievements.forEach(achievement => {
    const badge = document.createElement('span');
    badge.className = 'achievement-badge';
    badge.textContent = achievement;
    achievementsContainer.appendChild(badge);
  });
}

function toggleCertificate() {
  const certificate = document.getElementById("certificate");
  certificate.style.display = certificate.style.display === 'none' ? 'block' : 'none';
}

function downloadCertificate() {
  const canvas = document.getElementById('downloadCanvas');
  const ctx = canvas.getContext('2d');
  
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  
  const gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
  gradient.addColorStop(0, '#fffbeb');
  gradient.addColorStop(1, '#fef3c7');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  
  ctx.strokeStyle = 'gold';
  ctx.lineWidth = 10;
  ctx.strokeRect(20, 20, canvas.width - 40, canvas.height - 40);
  
  ctx.fillStyle = '#4f46e5';
  ctx.font = 'bold 60px Arial';
  ctx.textAlign = 'center';
  ctx.fillText('🏆 Sertifikat Prestasi', canvas.width / 2, 120);
  
  ctx.fillStyle = '#1e293b';
  ctx.font = '30px Arial';
  ctx.fillText('Diberikan kepada:', canvas.width / 2, 200);
  
  ctx.fillStyle = '#4f46e5';
  ctx.font = 'bold 40px Arial';
  ctx.fillText(document.getElementById("name").value, canvas.width / 2, 260);
  
  ctx.fillStyle = '#1e293b';
  ctx.font = '25px Arial';
  ctx.fillText(`Asal Sekolah: ${document.getElementById("school").value}`, canvas.width / 2, 310);
  ctx.fillText('Atas antusias dan prestasi luar biasanya dalam mengerjakan', canvas.width / 2, 360);
  
  ctx.font = 'bold 30px Arial';
  ctx.fillText(`Kuis ${quizConfig.subject} - ${quizConfig.title}`, canvas.width / 2, 410);
  
  const score = document.getElementById("score").textContent;
  ctx.fillStyle = '#10b981';
  ctx.font = 'bold 80px Arial';
  ctx.fillText(score, canvas.width / 2, 500);
  
  ctx.fillStyle = '#64748b';
  ctx.font = '20px Arial';
  ctx.fillText(document.getElementById("certificateDate").textContent, canvas.width / 2, 560);
  
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
  
  ctx.fillStyle = '#64748b';
  ctx.font = '18px Arial';
  ctx.fillText('Dibuat oleh Bimbel Brilian - www.bimbelbrilian.com', canvas.width / 2, 700);
  
  const link = document.createElement('a');
  const fileName = `sertifikat-${document.getElementById("name").value}-${score}.jpg`;
  link.download = fileName;
  link.href = canvas.toDataURL('image/jpeg', 0.9);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

function retryQuiz() {
  document.getElementById("result").style.display = "none";
  document.getElementById("certificate").style.display = "none";
  
  document.getElementById("quizContent").classList.add("hidden");
  document.getElementById("quizControls").classList.add("hidden");
  document.getElementById("startBtn").style.display = "block";
}

function showWrong() {
  document.querySelectorAll(".question").forEach((q, index) => {
    const selected = q.querySelector("input[type='radio']:checked");
    const answer = q.dataset.answer;
    if (selected && selected.value === answer) {
      q.style.display = "none";
    } else {
      q.style.display = "block";
    }
  });
}

// Initialize aplikasi saat DOM siap
document.addEventListener('DOMContentLoaded', function() {
  updateQuizTitles();
  initializeEventListeners();
  
  const savedProgress = loadProgress();
  if (savedProgress) {
    document.getElementById('startBtn').textContent = '🚀 LANJUTKAN KUIS';
  }
});
