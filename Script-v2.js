const questions = [
  ["Which is one way to make a hard day easier?", ["Be kind to yourself", "Pretend hard days never happen", "Fix everything at once"], 0],
  ["What can help when something feels difficult?", ["Keep every worry to yourself", "Ask someone you trust for support", "Decide nothing can change"], 1],
  ["How can you stay positive during a challenge?", ["Focus on what you can control", "Worry about every outcome", "Give up before you start"], 0],
  ["How can gratitude help?", ["You cannot feel sad", "Notice small things you appreciate", "Every problem disappears"], 1],
  ["What is one kind thing to do for yourself?", ["Take a break or do something you enjoy", "Ignore what you need", "Wait until everything is perfect"], 0],
].map(([question, answers, correct]) => ({ question, answers, correct }));

const $ = (selector) => document.querySelector(selector);
const screens = {
  checkin: $("#check-in"),
  menu: $("#game-menu"),
  quiz: $("#quiz-screen"),
  reaction: $("#reaction-screen"),
};
const moodOptions = document.querySelectorAll(".mood-option");
const answers = $("#answers");
const nextButton = $("#next-button");
const progress = $("#quiz-progress");
const progressFill = $("#quiz-progress-fill");
const reactionButton = $("#reaction-button");
const reactionOrb = $("#reaction-orb");

let mood = "";
let questionIndex = 0;
let score = 0;
let reactionState = "idle";
let reactionTimer;
let reactionStart;

function showScreen(id) {
  Object.entries(screens).forEach(([name, screen]) => {
    screen.hidden = name !== id;
  });
}

moodOptions.forEach((option) => {
  option.addEventListener("click", () => {
    mood = option.dataset.mood;
    moodOptions.forEach((item) => item.setAttribute("aria-pressed", String(item === option)));
    $("#reflection").hidden = false;
    $("#continue-button").disabled = false;
    $("#checkin-message").textContent = mood === "hard"
      ? "Thanks for checking in. Share more, or skip ahead."
      : "Glad you found a bright spot. Share more, or head to your quest.";
  });
});

$("#continue-button").addEventListener("click", () => {
  if (!mood) return;
  $("#menu-intro").textContent = mood === "hard"
    ? "A tough day does not define you. Choose a gentle activity, or just play for fun."
    : "Hold on to that bright spot—or simply enjoy a few minutes of play.";
  showScreen("menu");
});

document.querySelectorAll("[data-open]").forEach((button) => {
  button.addEventListener("click", () => {
    const screen = button.dataset.open;
    if (screen === "quiz") resetQuiz();
    if (screen === "reaction") resetReaction();
    showScreen(screen);
  });
});

function updateScore() {
  $("#score-label").textContent = `Score ${score} / ${questions.length}`;
}

function renderQuestion() {
  const current = questions[questionIndex];
  $("#quiz-title").textContent = current.question;
  $("#question-count").textContent = `QUESTION ${questionIndex + 1} OF ${questions.length}`;
  $("#quiz-feedback").textContent = "";
  $("#quiz-result").hidden = true;
  $("#quiz-title").hidden = $("#question-count").hidden = answers.hidden = false;
  nextButton.hidden = progress.hidden = false;
  nextButton.disabled = true;
  nextButton.innerHTML = questionIndex === questions.length - 1
    ? 'See my results <span aria-hidden="true">→</span>'
    : 'Next question <span aria-hidden="true">→</span>';
  answers.replaceChildren(...current.answers.map((answer, index) => {
    const button = document.createElement("button");
    button.className = "answer-button";
    button.type = "button";
    button.textContent = answer;
    button.addEventListener("click", () => {
      if (index === current.correct) {
        score++;
        updateScore();
        $("#quiz-feedback").textContent = "That's right! A thoughtful answer. ✨";
        answers.querySelectorAll("button").forEach((item) => { item.disabled = true; });
        button.classList.add("answer-correct");
        nextButton.disabled = false;
      } else {
        $("#quiz-feedback").textContent = "Not quite—try a different answer.";
        button.disabled = true;
      }
    });
    return button;
  }));
}

function resetQuiz() {
  questionIndex = score = 0;
  updateScore();
  progress.setAttribute("aria-valuenow", "0");
  progressFill.style.width = "0";
  renderQuestion();
}

function showResults() {
  $("#quiz-title").hidden = $("#question-count").hidden = answers.hidden = true;
  nextButton.hidden = progress.hidden = true;
  $("#quiz-feedback").textContent = "";
  $("#quiz-result").hidden = false;

  const [title, message] = score === questions.length
    ? ["A perfect little quest!", "You got every answer. Keep sharing that thoughtful energy."]
    : score >= 3
      ? ["Look at you go!", "You found lots of thoughtful answers. Keep learning."]
      : ["You showed up—and that counts.", "A quiz is practice, not a measure of you. Try again whenever you like."];
  $("#result-title").textContent = title;
  $("#result-message").textContent = message;
  $("#final-score").textContent = `Your score: ${score} out of ${questions.length}`;
}

nextButton.addEventListener("click", () => {
  questionIndex++;
  progress.setAttribute("aria-valuenow", String(questionIndex));
  progressFill.style.width = `${questionIndex / questions.length * 100}%`;
  questionIndex < questions.length ? renderQuestion() : showResults();
});

$("#replay-quiz").addEventListener("click", resetQuiz);

function resetReaction() {
  clearTimeout(reactionTimer);
  reactionState = "idle";
  reactionButton.classList.remove("reaction-ready");
  reactionOrb.classList.remove("orb-ready");
  reactionButton.innerHTML = 'Start reaction test <span aria-hidden="true">→</span>';
  $("#reaction-instructions").textContent = "The signal appears after a random pause. Get set!";
  $("#reaction-time").textContent = "";
}

reactionButton.addEventListener("click", () => {
  const instructions = $("#reaction-instructions");
  if (["idle", "early", "complete"].includes(reactionState)) {
    resetReaction();
    reactionState = "waiting";
    reactionButton.textContent = "Wait for the glow…";
    instructions.textContent = "Hold on… wait for green!";
    reactionTimer = setTimeout(() => {
      reactionState = "ready";
      reactionStart = performance.now();
      reactionButton.innerHTML = 'TAP NOW! <span aria-hidden="true">✦</span>';
      reactionButton.classList.add("reaction-ready");
      reactionOrb.classList.add("orb-ready");
      instructions.textContent = "Green! Tap as quickly as you can!";
    }, 1500 + Math.random() * 2500);
  } else if (reactionState === "waiting") {
    clearTimeout(reactionTimer);
    reactionState = "early";
    instructions.textContent = "Too soon—but no worries. Take a breath and try again.";
    reactionButton.innerHTML = 'Try again <span aria-hidden="true">↻</span>';
  } else {
    reactionState = "complete";
    reactionButton.classList.remove("reaction-ready");
    reactionOrb.classList.remove("orb-ready");
    reactionButton.innerHTML = 'Play another round <span aria-hidden="true">↻</span>';
    instructions.textContent = "Nice reaction! Your castle reflexes are strong.";
    $("#reaction-time").textContent = `Your reaction time: ${Math.round(performance.now() - reactionStart)} ms`;
  }
});
