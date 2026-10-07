const questions = [
  // Debug note: each question object is the source of one quiz screen; check the list order when tracing progress.
  {
    question: "How has your day been so far?",
    // Debug note: answer labels are rendered as individual buttons in the same order as this array.
    answers: ["Good", "Bad"],
    // A question can have one correct answer or several correct answers.
    // Debug note: this string tests the single-answer format handled by the answer normalization below.
    correctAnswers: "Good",
  },
  {
    question: "If your day was bad, then how can you make it better?",
    answers: [
      "By being kind",
      "By saying kind words and doing kind actions",
      "Looking at it from a positive way",
    ],
    // Debug note: the array form marks every accepted answer as correct for this question.
    correctAnswers: [
      "By being kind",
      "By saying kind words and doing kind actions",
      "Looking at it from a positive way",
    ],
  },
  {
    question: "What are some benefits to having a good day?",
    answers: ["Increased productivity", "Better mood", "Improved relationships"],
    correctAnswers: ["Increased productivity", "Better mood", "Improved relationships"],
  },
  {
    question: "What are some ways to stay positive during difficult times?",
    answers: ["Focus on what you can control", "Seek support from others", "Practice gratitude"],
    correctAnswers: ["Focus on what you can control", "Seek support from others", "Practice gratitude"],
  },
  {
    question: "If you have a bad day what is one thing you can do to make it better?",
    answers: ["Don't do anything", "Do something you enjoy", "Do something you don't enjoy"],
    correctAnswers: ["Do something you enjoy"],
  },
];

// Find the page elements by their HTML IDs so the script can update them.
// The # selector means "find the element whose ID matches this name."
const questionElement = document.querySelector("#question");
const answersElement = document.querySelector("#answers");
const feedbackElement = document.querySelector("#feedback");
const nextButton = document.querySelector("#next-button");
const gameMenu = document.querySelector("#game-menu");
const quizLink = document.querySelector('a[href="#quiz"]');
const quiz = document.querySelector("#quiz");
const reactionGameLink = document.querySelector('a[href="#reaction-game"]');
const reactionGame = document.querySelector("#reaction-game");
const quizMenuButton = document.querySelector("#quiz-menu-button");
const reactionMenuButton = document.querySelector("#reaction-menu-button");
const reactionButton = document.querySelector("#reaction-button");
const reactionInstructions = document.querySelector("#reaction-instructions");
const reactionTime = document.querySelector("#reaction-time");

let currentQuestionIndex = 0;
// Debug note: reactionState controls which action a click on the reaction button will take.
let reactionState = "idle";
let reactionTimer;
let reactionStartTime;

function showQuestion() {
  // Debug note: inspect this index and questions.length if the quiz displays no current question.
  const currentQuestion = questions[currentQuestionIndex];

  questionElement.textContent = currentQuestion.question;
  // Debug note: clearing old children prevents answers from earlier questions remaining clickable.
  answersElement.replaceChildren();
  // Debug note: stale correctness feedback should disappear whenever a new question is shown.
  feedbackElement.textContent = "";
  // Debug note: progression stays blocked until the current answer handler accepts an answer.
  nextButton.disabled = true;

  for (let i = 0; i < currentQuestion.answers.length; i++) {
    const answer = currentQuestion.answers[i];
    const answerButton = document.createElement("button");

    answerButton.textContent = answer;
    answerButton.addEventListener("click", function () {
      // Convert one correct answer to a list so both question formats work.
      const correctAnswers = Array.isArray(currentQuestion.correctAnswers)
        ? currentQuestion.correctAnswers
        : [currentQuestion.correctAnswers];

      if (correctAnswers.includes(answer)) {
        // Debug note: a correct choice both reports success and unlocks the Next Question control.
        feedbackElement.textContent = "Correct! Well done, brave knight.";
        nextButton.disabled = false;
      } else {
        // Debug note: a wrong choice leaves progression disabled so another option can be tried.
        feedbackElement.textContent = "Not quite—try another answer.";
      }
    });

    answersElement.append(answerButton);
  }
}

function resetQuiz() {
  // Debug note: reopening the quiz starts a fresh run at its first configured question.
  currentQuestionIndex = 0;
  // Debug note: the completion state hides this control, so reset makes it available again.
  nextButton.hidden = false;
  showQuestion();
}

function resetReactionGame() {
  // Debug note: clear any scheduled signal before restoring the idle screen to avoid stale callbacks.
  window.clearTimeout(reactionTimer);
  // Debug note: idle is the state from which a new reaction round can begin.
  reactionState = "idle";
  reactionButton.classList.remove("reaction-ready");
  reactionButton.textContent = "Start reaction test";
  reactionInstructions.textContent =
    "Press start, then click only when the button turns green.";
  reactionTime.textContent = "";
}

// These menu links switch screens instead of scrolling to the section.
quizLink.addEventListener("click", function (event) {
  // Debug note: preventDefault keeps navigation in this single-page game instead of scrolling to the fragment.
  event.preventDefault();
  gameMenu.hidden = true;
  reactionGame.hidden = true;
  quiz.hidden = false;
  resetQuiz();
});

reactionGameLink.addEventListener("click", function (event) {
  event.preventDefault();
  gameMenu.hidden = true;
  quiz.hidden = true;
  reactionGame.hidden = false;
  resetReactionGame();
});

nextButton.addEventListener("click", function () {
  // Debug note: the next index is checked against the question count to decide between another prompt and completion.
  currentQuestionIndex = currentQuestionIndex + 1;

  if (currentQuestionIndex < questions.length) {
    showQuestion();
  } else {
    // Debug note: completion clears answer controls and removes Next so the finished quiz cannot advance further.
    questionElement.textContent = "You finished the quiz!";
    answersElement.replaceChildren();
    feedbackElement.textContent = "";
    nextButton.hidden = true;
  }
});

// Going back to the menu also cancels any reaction timer still in progress.
quizMenuButton.addEventListener("click", function () {
  quiz.hidden = true;
  gameMenu.hidden = false;
});

reactionMenuButton.addEventListener("click", function () {
  // Debug note: reset before hiding the panel also cancels a waiting round's pending timeout.
  resetReactionGame();
  reactionGame.hidden = true;
  gameMenu.hidden = false;
});

// The player starts waiting; clicking too early or after the green signal
// changes the state and gives the appropriate result.
reactionButton.addEventListener("click", function () {
  if (reactionState === "idle" || reactionState === "early" || reactionState === "complete") {
    // Debug note: every new attempt first removes the previous result and restores the idle appearance.
    resetReactionGame();
    reactionState = "waiting";
    reactionInstructions.textContent = "Wait for the button to turn green…";
    reactionButton.textContent = "Wait…";

    // Debug note: the randomized wait is between 1500 and 4000 milliseconds before the green signal.
    const delay = 1500 + Math.random() * 2500;
    reactionTimer = window.setTimeout(function () {
      // Debug note: setting ready and recording the clock happen together at the signal transition.
      reactionState = "ready";
      reactionStartTime = performance.now();
      reactionButton.textContent = "CLICK NOW!";
      reactionButton.classList.add("reaction-ready");
      reactionInstructions.textContent = "Click the green button as fast as you can!";
    }, delay);
  } else if (reactionState === "waiting") {
    // Debug note: an early click cancels the signal and moves the round to a retryable early state.
    window.clearTimeout(reactionTimer);
    reactionState = "early";
    reactionInstructions.textContent = "Too soon! Wait until the button turns green.";
    reactionButton.textContent = "Try again";
  } else if (reactionState === "ready") {
    // Debug note: subtract the signal timestamp from the current high-resolution time for elapsed milliseconds.
    const elapsedMilliseconds = Math.round(performance.now() - reactionStartTime);
    // Debug note: completed state prevents this click from being treated as another valid timing result.
    reactionState = "complete";
    reactionButton.classList.remove("reaction-ready");
    reactionButton.textContent = "Try again";
    reactionInstructions.textContent = "Nice reaction!";
    reactionTime.textContent = `Your reaction time was ${elapsedMilliseconds} ms.`;
  }
});