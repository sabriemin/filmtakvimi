
let questions = [];

fetch("quiz_questions.json")
  .then(response => response.json())
  .then(data => {
    questions = data;
    startQuiz();
  });

let currentQuestionIndex = 0;
let score = 0;

const questionContainer = document.getElementById("question-container");
const questionElement = document.getElementById("question");
const choicesElement = document.getElementById("choices");
const resultElement = document.getElementById("result");
const scoreElement = document.getElementById("score");

function startQuiz() {
  showQuestion();
}

function showQuestion() {
  if (currentQuestionIndex >= questions.length) {
    questionContainer.innerHTML = "<h2>Quiz bitti! Skorunuz: " + score + "</h2>";
    return;
  }

  const currentQuestion = questions[currentQuestionIndex];
  questionElement.textContent = currentQuestion.question;

  choicesElement.innerHTML = "";
  currentQuestion.choices.forEach(choice => {
    const button = document.createElement("button");
    button.textContent = choice;
    button.classList.add("choice-button");
    button.onclick = () => selectAnswer(choice);
    choicesElement.appendChild(button);
  });
}

function selectAnswer(selectedChoice) {
  const correct = questions[currentQuestionIndex].answer;
  if (selectedChoice === correct) {
    score++;
  }

  currentQuestionIndex++;
  showQuestion();
}
