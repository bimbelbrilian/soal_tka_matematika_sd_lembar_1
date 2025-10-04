let timerInterval;
let timeLeft = 0;
let currentQuestions = [];
let isSubmitted = false;
let soundEnabled = true;
let voiceEnabled = false;

// Database soal
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

// Sound Effects menggunakan Web Audio API
const audioContext = new (window.AudioContext || window.webkitAudioContext)();

function playSound(frequency, duration, type = 'sine') {
  if (!soundEnabled) return;

  try {
    // Resume audio context jika suspended
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
  playSound(392, 0.1); // G4 - Sound ketika memilih jawaban
}

function playCorrectSound() {
  playSound(523.25, 0.2); // C5
  setTimeout(() => playSound(659.25, 0.2), 150); // E5
}

function playWrongSound() {
  playSound(220, 0.3, 'square'); // A3
}

function playCompleteSound() {
  playSound(523.25, 0.2); // C5
  setTimeout(() => playSound(659.25, 0.2), 200); // E5
  setTimeout(() => playSound(783.99, 0.4), 400); // G5
}

function playTimerSound() {
  playSound(330, 0.1); // E4
}

// Text-to-Speech
function speakText(text) {
  if (!voiceEnabled) return;

  if ('speechSynthesis' in window) {
    // Stop any ongoing speech
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
    // Mode aktif - tambah indikator dan styling
    document.getElementById('quizContent').classList.add('voice-enabled');
    voiceBtn.classList.add('active');
    voiceBtn.innerHTML = '🔊 Baca Soal';

    // Tambah indikator pada setiap soal
    questions.forEach(question => {
      const questionText = question.querySelector('p');
      if (!questionText.querySelector('.voice-indicator')) {
        const indicator = document.createElement('span');
        indicator.className = 'voice-indicator';
        indicator.innerHTML = '🔊';
        questionText.appendChild(indicator);
        // Tambahkan event listener untuk memanggil speakText saat diklik
        questionText.onclick = () => speakText(questionText.textContent.replace('🔊', '').trim());
      }
    });
  } else {
    // Mode non-aktif - hapus indikator dan styling
    document.getElementById('quizContent').classList.remove('voice-enabled');
    voiceBtn.classList.remove('active');
    voiceBtn.innerHTML = '🎤 Baca Soal';

    // Hapus indikator dari setiap soal
    questions.forEach(question => {
      const questionText = question.querySelector('p');
      if (questionText) {
        questionText.onclick = null; // Hapus event listener
      }
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

    // Cek jika progress masih valid (kurang dari 1 jam)
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
  const text = `🎉 ${name} berhasil mendapatkan nilai ${score}% dalam Kuis Matematika - Penjumlahan dari Bimbel Brilian! 🧮✨`;

  try {
    if (navigator.share) {
      await navigator.share({
        title: 'Hasil Kuis Matematika Bimbel Brilian',
        text: text,
        url: window.location.href
      });
    } else if (navigator.clipboard) {
      await navigator.clipboard.writeText(text);
      alert('📋 Hasil berhasil disalin ke clipboard!');
    } else {
      // Fallback untuk browser lama
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
  // Tombol Start
  document.getElementById('startBtn').addEventListener('click', startQuiz);

  // Tombol Fitur
  document.getElementById('soundToggle').addEventListener('click', toggleSound);
  document.getElementById('voiceBtn').addEventListener('click', toggleVoice);
  document.getElementById('shareBtn').addEventListener('click', shareResults);

  // Tombol di hasil (akan di-set ulang setiap submit)
  setupResultButtonListeners();
}

function toggleSound() {
  soundEnabled = !soundEnabled;
  const button = document.getElementById('soundToggle');
  button.textContent = soundEnabled ? '🔊 Sound' : '🔇 Sound';
  playSound(440, 0.1); // Feedback sound
}

function toggleVoice() {
  voiceEnabled = !voiceEnabled;
  updateVoiceIndicator();

  if (voiceEnabled) {
    // Baca instruksi pertama kali
    speakText('Fitur suara diaktifkan. Klik pada soal untuk mendengarkan pertanyaan.');
  } else {
    window.speechSynthesis.cancel();
  }
}

// Setup event listeners untuk tombol hasil
function setupResultButtonListeners() {
  // Dapatkan elemen tombol yang sudah ada di DOM
  const certificateBtn = document.getElementById('certificateBtn');
  const downloadBtn = document.getElementById('downloadBtn');
  const retryResultBtn = document.getElementById('retryResultBtn');
  const wrongResultBtn = document.getElementById('wrongResultBtn');

  // Hapus event listener lama dengan mengganti node (metode yang aman)
  const newCertificateBtn = certificateBtn.cloneNode(true);
  certificateBtn.parentNode.replaceChild(newCertificateBtn, certificateBtn);
  const newDownloadBtn = downloadBtn.cloneNode(true);
  downloadBtn.parentNode.replaceChild(newDownloadBtn, downloadBtn);
  const newRetryResultBtn = retryResultBtn.cloneNode(true);
  retryResultBtn.parentNode.replaceChild(newRetryResultBtn, retryResultBtn);
  const newWrongResultBtn = wrongResultBtn.cloneNode(true);
  wrongResultBtn.parentNode.replaceChild(newWrongResultBtn, wrongResultBtn);


  // Tambah event listener baru pada node yang baru
  document.getElementById('certificateBtn').addEventListener('click', toggleCertificate);
  document.getElementById('downloadBtn').addEventListener('click', downloadCertificate);
  document.getElementById('retryResultBtn').addEventListener('click', retryQuiz);
  document.getElementById('wrongResultBtn').addEventListener('click', showWrong);
}

function startQuiz() {
  const name = document.getElementById("name").value.trim();
  const school = document.getElementById("school").value.trim();

  // Validasi HTML5 required
  if (!name || !school) {
    alert("Silakan isi nama dan asal sekolah terlebih dahulu!");
    return;
  }

  document.getElementById("startBtn").style.display = "none";
  document.getElementById("quizContent").classList.remove("hidden");
  document.getElementById("quizControls").classList.remove("hidden");
  document.getElementById("timer").classList.remove("hidden");
  document.getElementById("result").style.display = "none"; // Sembunyikan hasil jika ada

  // Reset status submit
  isSubmitted = false;

  // Cek dan muat progress jika ada
  const savedProgress = loadProgress();

  if (savedProgress && savedProgress.currentQuestion.length > 0) {
    // Muat soal dari progress yang tersimpan
    currentQuestions = savedProgress.currentQuestion.map(q => ({
      question: q.question,
      options: questionBank.find(qb => qb.question === q.question).options, // Ambil opsi asli dari questionBank
      answer: questionBank.find(qb => qb.question === q.question).answer,
      selectedAnswer: q.selectedAnswer,
      isCorrect: q.isCorrect
    }));
    timeLeft = savedProgress.timeLeft;
    generateQuestions(savedProgress); // Kirim savedProgress untuk pre-select jawaban
  } else {
    // Generate soal baru
    generateQuestions();
    // Timer = jumlah soal × 5 menit
    timeLeft = currentQuestions.length * 5 * 60; // detik
  }

  // Auto-save progress setiap 30 detik
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

    // Play timer sound setiap 10 detik terakhir
    if (timeLeft <= 10 && timeLeft > 0) {
      playTimerSound();
    }
    // Play timer sound setiap 30 detik terakhir
    else if (timeLeft <= 60 && timeLeft > 0 && timeLeft % 10 === 0) {
      playTimerSound();
    }

    if (timeLeft <= 0) {
      clearInterval(timerInterval);
      submitQuiz();
    }
  }, 1000);

  playSound(523.25, 0.3); // Start sound
}

function generateQuestions(progress = null) {
  const quizContent = document.getElementById("quizContent");
  quizContent.innerHTML = '';

  // Jika tidak ada progress, inisialisasi currentQuestions dari questionBank
  if (!progress) {
    // Urutan soal tetap, hanya opsi yang akan diacak di bawah
    currentQuestions = [...questionBank];
  } else {
    // Jika ada progress, currentQuestions sudah terisi saat memuat progress
  }

  currentQuestions.forEach((q, index) => {
    const questionDiv = document.createElement('div');
    questionDiv.className = 'question';
    questionDiv.dataset.answer = q.answer;

    // Acak urutan opsi jawaban menggunakan Fisher-Yates
    const optionsToShuffle = progress ? questionBank.find(qb => qb.question === q.question).options : q.options;
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

  // Update indikator suara setelah soal digenerate
  updateVoiceIndicator();

  // Tambahkan event listener untuk setiap radio button (sound effect ketika dipilih)
  setTimeout(() => {
    document.querySelectorAll('input[type="radio"]').forEach(radio => {
      radio.addEventListener('change', function() {
        if (this.checked) {
          playSelectSound();
        }
      });
    });
  }, 100);

  // Tambahkan tombol submit dengan event listener yang benar
  const buttonGroup = document.createElement('div');
  buttonGroup.className = 'button-group';
  buttonGroup.innerHTML = `
    <button id="submitBtn">✅ Koreksi Jawaban</button>
    <button id="retryBtn" class="hidden">🔄 Kerjakan Ulang</button>
    <button id="wrongBtn" class="hidden">📝 Lihat Hasil Salah Saja</button>
  `;
  quizContent.appendChild(buttonGroup);

  // Tambahkan event listeners untuk tombol kuis
  document.getElementById('submitBtn').addEventListener('click', submitQuiz);
  // Pastikan tombol-tombol lain tersembunyi pada awal kuis
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
  if (isSubmitted) return; // Prevent multiple submissions

  isSubmitted = true;
  const submitBtn = document.getElementById("submitBtn");
  if (submitBtn) {
    submitBtn.disabled = true;
    submitBtn.style.display = 'none'; // Hilangkan tombol koreksi jawaban
  }

  clearInterval(timerInterval);
  window.speechSynthesis.cancel(); // Hentikan baca soal jika sedang berjalan

  let correct = 0;
  let wrong = 0;
  let wrongList = [];

  document.querySelectorAll(".question").forEach((q, index) => {
    const answer = q.dataset.answer;
    const selected = q.querySelector("input[type='radio']:checked");
    const feedback = q.querySelector(".feedback");
    const options = q.querySelectorAll("input[type='radio']");
    let isCurrentCorrect = false;

    options.forEach(opt => {
      opt.disabled = true; // Non-aktifkan semua opsi
      if (opt.value === answer) opt.parentElement.style.background = "#d1fae5"; // Highlight jawaban benar
      if (selected && opt === selected && opt.value !== answer) {
        opt.parentElement.style.background = "#fee2e2"; // Highlight jawaban salah yang dipilih
      }
    });

    if (selected) {
      if (selected.value === answer) {
        correct++;
        isCurrentCorrect = true;
        feedback.textContent = "✅ Jawaban Benar!";
        feedback.className = "feedback benar";
        playCorrectSound();
      } else {
        wrong++;
        wrongList.push(index + 1);
        feedback.textContent = `❌ Jawaban Salah. Jawaban yang benar adalah: ${answer}`;
        feedback.className = "feedback salah";
        playWrongSound();
      }
    } else {
      wrong++;
      wrongList.push(index + 1);
      feedback.textContent = `⏰ Belum dijawab. Jawaban yang benar adalah: ${answer}`;
      feedback.className = "feedback salah";
      playWrongSound();
    }
  });

  const total = questionBank.length; // Hitung total dari questionBank yang asli
  const nilai = Math.round((correct / total) * 100);

  // Update hasil
  document.getElementById("studentName").textContent = document.getElementById("name").value;
  document.getElementById("studentSchool").textContent = document.getElementById("school").value;
  document.getElementById("score").textContent = nilai;
  document.getElementById("summary").textContent =
    `Jawaban Benar: ${correct} | Jawaban Salah/Kosong: ${wrong}`;
  document.getElementById("wrongNumbers").textContent =
    wrongList.length > 0 ? `Soal yang salah/kosong: ${wrongList.join(", ")}` : "🎊 Semua soal benar!";

  // Format tanggal
  const today = new Date();
  const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
  const tanggal = today.toLocaleDateString('id-ID', options);
  document.getElementById("tanggal").textContent = `Dikerjakan pada ${tanggal}`;

  // Sistem bintang
  updateStars(nilai, "starContainer");

  // Achievement badges
  updateAchievements(nilai, correct, total);

  // Update sertifikat
  document.getElementById("certificateName").textContent = document.getElementById("name").value;
  document.getElementById("certificateSchool").textContent = document.getElementById("school").value;
  document.getElementById("certificateScore").textContent = nilai;
  document.getElementById("certificateDate").textContent = `Tanggal: ${tanggal}`;
  updateStars(nilai, "certificateStars");

  // Setup ulang event listeners untuk tombol hasil
  setupResultButtonListeners();

  // Tampilkan tombol retry dan wrong pada area kuis
  document.getElementById("retryBtn").classList.remove("hidden");
  document.getElementById("wrongBtn").classList.remove("hidden");

  // Tampilkan hasil dan tombol hasil
  document.getElementById("result").style.display = "block";
  document.getElementById("retryResultBtn").classList.remove("hidden");
  document.getElementById("wrongResultBtn").classList.remove("hidden");

  // Play completion sound
  playCompleteSound();

  // Clear saved progress
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

  // Clear canvas
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // Background gradient
  const gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
  gradient.addColorStop(0, '#fffbeb');
  gradient.addColorStop(1, '#fef3c7');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Border emas
  ctx.strokeStyle = 'gold';
  ctx.lineWidth = 10;
  ctx.strokeRect(20, 20, canvas.width - 40, canvas.height - 40);

  // Judul sertifikat
  ctx.fillStyle = '#4f46e5';
  ctx.font = 'bold 60px Arial';
  ctx.textAlign = 'center';
  ctx.fillText('🏆 Sertifikat Prestasi', canvas.width / 2, 120);

  // Konten sertifikat
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
  ctx.fillText('Kuis Matematika - Penjumlahan', canvas.width / 2, 410);

  // Nilai
  const score = document.getElementById("score").textContent;
  ctx.fillStyle = '#10b981';
  ctx.font = 'bold 80px Arial';
  ctx.fillText(score, canvas.width / 2, 500);

  // Tanggal
  ctx.fillStyle = '#64748b';
  ctx.font = '20px Arial';
  ctx.fillText(document.getElementById("certificateDate").textContent, canvas.width / 2, 560);

  // Bintang - Rata tengah
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
  ctx.fillText('Dibuat oleh Bimbel Brilian - www.bimbelbrilian.com', canvas.width / 2, 700);

  // Download image
  const link = document.createElement('a');
  const fileName = `sertifikat-${document.getElementById("name").value}-${score}.jpg`;
  link.download = fileName;
  link.href = canvas.toDataURL('image/jpeg', 0.9);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

function retryQuiz() {
  // Clear any active interval or speech
  clearInterval(timerInterval);
  window.speechSynthesis.cancel();
  localStorage.removeItem('quizProgress');

  // Reset elements
  document.getElementById("result").style.display = "none";
  document.getElementById("certificate").style.display = "none";
  document.getElementById("quizContent").classList.add("hidden");
  document.getElementById("quizControls").classList.add("hidden");
  document.getElementById("timer").classList.add("hidden");
  document.getElementById("startBtn").style.display = "block";
  document.getElementById("startBtn").textContent = '🚀 MULAI MENGERJAKAN'; // Reset text just in case

  // Clear name/school for a fresh start or let the user decide
  // document.getElementById("name").value = '';
  // document.getElementById("school").value = '';

  // Clear quiz content
  document.getElementById("quizContent").innerHTML = '';
}

function showWrong() {
  document.querySelectorAll(".question").forEach((q, index) => {
    const answer = q.dataset.answer;
    const selected = q.querySelector("input[type='radio']:checked");
    // Tampilkan hanya jika jawaban salah atau belum dijawab
    if (selected && selected.value === answer) {
      q.style.display = "none";
    } else {
      q.style.display = "block";
    }
  });
}

// Initialize aplikasi saat DOM siap
document.addEventListener('DOMContentLoaded', function() {
  initializeEventListeners();

  // Cek progress yang tersimpan
  const savedProgress = loadProgress();
  if (savedProgress) {
    document.getElementById('startBtn').textContent = '🚀 LANJUTKAN KUIS';
  }
});
