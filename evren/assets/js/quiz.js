const quizDataUrl = "../assets/data/quiz/quiz.json";

let allQuestions = [];
let currentQuestions = [];
let currentIndex = 0;
let score = 0;
let seri = 0;
let seriBonus = 0;
let stage = 1;
let timer;
let timeLeft = 15;

// Ekran elemanları
const startScreen = document.getElementById("startScreen");
const quizScreen = document.getElementById("quizScreen");
const resultScreen = document.getElementById("resultScreen");

const questionText = document.getElementById("questionText");
const questionImage = document.getElementById("questionImage");
const optionsContainer = document.getElementById("optionsContainer");
const progressBar = document.getElementById("progressBar");
const seriInfo = document.getElementById("streakInfo");
const stageInfo = document.getElementById("stageInfo");

// Süre göstergesi
const timerDisplay = document.createElement("p");
timerDisplay.className = "mt-2 text-lg font-bold";
document.querySelector("#quizScreen .flex-1").insertBefore(timerDisplay, optionsContainer);

document.getElementById("startBtn").addEventListener("click", startGame);
document.getElementById("retryBtn").addEventListener("click", () => location.reload());

async function startGame() {
    const res = await fetch(quizDataUrl);
    allQuestions = await res.json();

    currentQuestions = getStageQuestions(stage);

    score = 0;
    seri = 0;
    seriBonus = 0;
    currentIndex = 0;

    startScreen.classList.add("hidden");
    quizScreen.classList.remove("hidden");

    showQuestion();
}

function getStageQuestions(stageNum) {
    let diff;
    if (stageNum === 1) diff = ["easy", "medium"];
    else if (stageNum === 2) diff = ["medium", "hard"];
    else diff = ["hard"];
    return shuffleArray(allQuestions.filter(q => diff.includes(q.difficulty))).slice(0, 10);
}

function showQuestion() {
    const q = currentQuestions[currentIndex];
    questionText.textContent = q.question;
    stageInfo.textContent = `Aşama ${stage} - Soru ${currentIndex + 1} / ${currentQuestions.length}`;

    if (q.image) {
        questionImage.src = q.image;
        let blurClass = q.difficulty === "easy" ? "blur-[1px]" : q.difficulty === "medium" ? "blur-[2px]" : "blur-[3px]";
        questionImage.className = `max-h-64 mb-4 rounded-lg quiz-image transition-all ${blurClass}`;
        questionImage.classList.remove("hidden");
    } else {
        questionImage.classList.add("hidden");
    }

    optionsContainer.innerHTML = "";
    q.options.forEach((opt, i) => {
        const btn = document.createElement("button");
        btn.textContent = opt;
        btn.className = "bg-gray-700 hover:bg-gray-600 px-4 py-2 rounded-lg text-left transition transform hover:scale-105";
        btn.onclick = () => selectAnswer(i);
        optionsContainer.appendChild(btn);
    });

    progressBar.style.width = `${(currentIndex / currentQuestions.length) * 100}%`;
    seriInfo.textContent = `🔥 Seri: ${seri}`;

    startTimer();
}

function startTimer() {
    timeLeft = 15;
    timerDisplay.textContent = `⏳ Kalan Süre: ${timeLeft} sn`;
    timerDisplay.classList.remove("text-red-500", "text-orange-400");
    clearInterval(timer);
    timer = setInterval(() => {
        timeLeft--;
        timerDisplay.textContent = `⏳ Kalan Süre: ${timeLeft} sn`;

        if (timeLeft <= 5) {
            timerDisplay.classList.add("text-red-500");
        } else if (timeLeft <= 10) {
            timerDisplay.classList.add("text-orange-400");
        }

        if (timeLeft <= 0) {
            clearInterval(timer);
            seri = 0;
            nextQuestion();
        }
    }, 1000);
}

function selectAnswer(i) {
    clearInterval(timer);

    const q = currentQuestions[currentIndex];
    const correctIndex = Number(q.answerIndex);

    const buttons = optionsContainer.querySelectorAll("button");

    buttons.forEach((btn, idx) => {
        btn.disabled = true;
        btn.classList.remove("bg-gray-700", "hover:bg-gray-600", "bg-red-600", "bg-green-600");

        if (idx === correctIndex) {
            btn.classList.add("bg-green-600", "text-white");
        } else if (idx === i && idx !== correctIndex) {
            btn.classList.add("bg-red-600", "text-white", "shake");
        } else {
            btn.classList.add("bg-gray-700");
        }
    });

    questionImage.classList.remove("blur-[1px]", "blur-[2px]", "blur-[3px]");

    if (i === correctIndex) {
        score++;
        seri++;
        if (seri > 0 && seri % 3 === 0) {
            seriBonus += 5;
        }
    } else {
        seri = 0;
    }

    setTimeout(nextQuestion, 1000);
}

function nextQuestion() {
    currentIndex++;
    if (currentIndex >= currentQuestions.length) {
        checkStage();
    } else {
        showQuestion();
    }
}

function checkStage() {
    const required = stage === 1 ? 5 : stage === 2 ? 6 : 7;
    if (score >= required) {
        stage++;
        if (stage > 3) {
            endGame();
            return;
        }
        currentQuestions = getStageQuestions(stage);
        currentIndex = 0;
        score = 0;
        showQuestion();
    } else {
        endGame();
    }
}

function endGame() {
    quizScreen.classList.add("hidden");
    resultScreen.classList.remove("hidden");

    document.getElementById("scoreText").textContent = `Skor: ${score} / ${currentQuestions.length}`;
    document.getElementById("stagesText").textContent = `Geçilen aşama: ${stage}`;
    document.getElementById("bonusText").textContent = `🔥 Seri bonus: +${seriBonus} puan`;
}

function shuffleArray(arr) {
    return arr.sort(() => Math.random() - 0.5);
}
