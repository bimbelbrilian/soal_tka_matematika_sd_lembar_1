// =================================================================
// 🎯 PUSAT KONFIGURASI KUIS (EDIT HANYA BAGIAN INI UNTUK MENGGANTI KUIS)
// =================================================================

const quizConfig = {
    // 1. INFORMASI UMUM KUIS
    quizName: "Soal TKA Matematika SD", // Judul utama yang muncul di tampilan dan sertifikat
    quizTopic: "Soal TKA Matematika SD Lembar 1", // Nama kuis yang muncul di hasil penilaian
    quizIcon: "🧮", // Emoji atau ikon yang muncul di judul utama
    
    // 2. TIMING
    timePerQuestionMinutes: 5, // Waktu pengerjaan per soal (dalam menit)
    
    // 3. BRANDING
    mainSubtitle: "Dibuat oleh Bimbel Brilian - www.bimbelbrilian.com", // Subjudul kuis
    footerText: "Dibuat oleh Bimbel Brilian - www.bimbelbrilian.com", // Teks footer di sertifikat
};

// =================================================================
// 📝 DATABASE SOAL (EDIT JUGA BAGIAN INI UNTUK SOAL BARU)
// =================================================================

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

// =================================================================
// ⚙️ LOGIKA KUIS (JANGAN UBAH KECUALI ANDA PAHAM JAVASCRIPT)
// =================================================================

let timerInterval;
let timeLeft = 0;
let currentQuestions = [];
let isSubmitted = false;
let soundEnabled = true;
let voiceEnabled = false;

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
    voiceBtn.innerHTML = '🔊 Sound Aktif';

    questions.forEach(question => {
      const questionText = question.querySelector('p');
      if (!questionText.querySelector('.voice-indicator')) {
        const indicator = document.createElement('span');
        indicator.className = 'voice-indicator';
        indicator.innerHTML = '🔊';
        questionText.appendChild(indicator);
        questionText.onclick = () => speakText(questionText.textContent.replace('🔊', '').trim());
      }
    });
  } else {
    document.getElementById('quizContent').classList.remove('voice-enabled');
    voiceBtn.classList.remove('active');
    voiceBtn.innerHTML = '🎤 Baca Soal';

    questions.forEach(question => {
      const questionText = question.querySelector('p');
      if (questionText) {
        questionText.onclick = null;
      }
      const indicator = question.querySelector('.voice-indicator');
      if (indicator) {
        indicator.remove();
      }
    });
  }
}

// Fungsi untuk mengganti semua teks berdasarkan quizConfig
function updateQuizText() {
    // 1. Mengganti Judul Utama Halaman (Tab Browser)
    document.getElementById('pageTitle').textContent = quizConfig.quizName;

    // 2. Mengganti Judul Utama di Tampilan (H1)
    document.getElementById('mainTitle').innerHTML = `${quizConfig.quizIcon} ${quizConfig.quizName}`;
    
    // 3. Mengganti Subjudul (Subtitle)
    document.getElementById('mainSubtitle').textContent = quizConfig.mainSubtitle;
    
    // 4. Mengganti Nama Kuis di Hasil Penilaian
    document.getElementById('resultQuizTopic').textContent = quizConfig.quizTopic;
    
    // 5. Mengganti Nama Kuis di Sertifikat
    document.getElementById('certificateQuizTopic').textContent = quizConfig.quizTopic;
    
    // 6. Mengganti Teks Footer Sertifikat
    document.getElementById('certificateFooterText').textContent = quizConfig.footerText;
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
  const text = `🎉 ${name} berhasil mendapatkan nilai ${score}% dalam ${quizConfig.quizName} dari Bimbel Brilian! ✨`;

  try {
    if (navigator.share) {
      await navigator.share({
        title: `Hasil ${quizConfig.quizName} Bimbel Brilian`,
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
  } else {
    window.speechSynthesis.cancel();
  }
}

function setupResultButtonListeners() {
  const certificateBtn = document.getElementById('certificateBtn');
  const downloadBtn = document.getElementById('downloadBtn');
  const retryResultBtn = document.getElementById('retryResultBtn');
  const wrongResultBtn = document.getElementById('wrongResultBtn');

  // Clone and replace to safely remove old listeners
  const cloneAndReplace = (oldEl) => {
    const newEl = oldEl.cloneNode(true);
    oldEl.parentNode.replaceChild(newEl, oldEl);
    return newEl;
  };

  cloneAndReplace(certificateBtn).addEventListener('click', toggleCertificate);
  cloneAndReplace(downloadBtn).addEventListener('click', downloadCertificate);
  cloneAndReplace(retryResultBtn).addEventListener('click', retryQuiz);
  cloneAndReplace(wrongResultBtn).addEventListener('click', showWrong);
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
    // Gunakan konfigurasi waktu baru
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

function generateQuestions(progress = null) {
  const quizContent = document.getElementById("quizContent");
  quizContent.innerHTML = '';

  if (!progress) {
    currentQuestions = [...questionBank];
  }

  currentQuestions.forEach((q, index) => {
    const questionDiv = document.createElement('div');
    questionDiv.className = 'question';
    questionDiv.dataset.answer = q.answer;

    const optionsToShuffle = questionBank.find(qb => qb.question === q.question).options;
    const shuffledOptions = shuffleArray([...optionsToShuffle]);
    const optionLetters = ['a', 'b', 'c', 'd'];

    let optionsHTML = '';
    shuffledOptions.forEach((option, optIndex) => {
      const isChecked = progress && progress.currentQuestion[index].selectedAnswer === option ? 'checked' : '';

      optionsHTML += `
        <label>
          <input type="radio" name="q${index + 1}" value="${option}" ${isChecked}>
          ${optionLetters[optIndex]}. ${option}
        </label>
      `;
    });

    questionDiv.innerHTML = `
      <p>${index + 1}. ${q.question}</p>
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
  document.getElementById('retryBtn').classList.add("hidden");
  document.getElementById('wrongBtn').classList.add("hidden");
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
  
  // Update canvas text based on current config (penting untuk download)
  const score = document.getElementById("score").textContent;
  const name = document.getElementById("name").value;
  const school = document.getElementById("school").value;
  const date = document.getElementById("certificateDate").textContent;
  const quizName = quizConfig.quizName;

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
  ctx.fillText(quizConfig.footerText, canvas.width / 2, 700);

  // Download image
  const link = document.createElement('a');
  const fileName = `sertifikat-${name}-${score}.jpg`;
  link.download = fileName;
  link.href = canvas.toDataURL('image/jpeg', 0.9);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

function retryQuiz() {
  clearInterval(timerInterval);
  window.speechSynthesis.cancel();
  localStorage.removeItem('quizProgress');

  document.getElementById("result").style.display = "none";
  document.getElementById("certificate").style.display = "none";
  document.getElementById("quizContent").classList.add("hidden");
  document.getElementById("quizControls").classList.add("hidden");
  document.getElementById("timer").classList.add("hidden");
  document.getElementById("startBtn").style.display = "block";
  document.getElementById("startBtn").textContent = '🚀 MULAI MENGERJAKAN';

  document.getElementById("quizContent").innerHTML = '';
}

function showWrong() {
  document.querySelectorAll(".question").forEach((q, index) => {
    const answer = q.dataset.answer;
    const selected = q.querySelector("input[type='radio']:checked");
    if (selected && selected.value === answer) {
      q.style.display = "none";
    } else {
      q.style.display = "block";
    }
  });
}

// Initialize aplikasi saat DOM siap
document.addEventListener('DOMContentLoaded', function() {
  // Panggil fungsi untuk mengisi teks dari konfigurasi
  updateQuizText();

  initializeEventListeners();

  const savedProgress = loadProgress();
  if (savedProgress) {
    document.getElementById('startBtn').textContent = '🚀 LANJUTKAN KUIS';
  }
});
