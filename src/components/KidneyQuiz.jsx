import { useEffect, useMemo, useState } from "react";
import { kidneyParts, quizQuestions, translations, getTranslatedQuestion } from "../data/kidneyAnatomyData.js";

function shuffleItems(items) {
  const shuffled = [...items];
  for (let index = shuffled.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(Math.random() * (index + 1));
    [shuffled[index], shuffled[swapIndex]] = [shuffled[swapIndex], shuffled[index]];
  }
  return shuffled;
}

function createQuizAttempt() {
  const uniqueQuestions = [];
  const usedQuestionIds = new Set();

  for (const question of quizQuestions) {
    if (!usedQuestionIds.has(question.id)) {
      usedQuestionIds.add(question.id);
      uniqueQuestions.push(question);
    }
  }

  // Shuffle the unique questions list to randomize order
  const shuffledQuestions = shuffleItems(uniqueQuestions);

  return shuffledQuestions.map((question) => {
    if (question.type !== "mcq") return question;
    return {
      ...question,
      options: shuffleItems(question.options),
    };
  });
}

function getResultMessage(score, total, language) {
  const percent = total > 0 ? score / total : 0;
  if (language === "ta") {
    if (percent >= 0.8) return "சிறந்த செயல்பாடு! சிறுநீரக மண்டலத்தின் முக்கிய பகுதிகளை நீங்கள் சரியாகக் கண்டறிந்துள்ளீர்கள்.";
    if (percent >= 0.5) return "நல்ல முயற்சி. நீங்கள் தவறிய பகுதிகளை மீண்டும் ஒருமுறை படித்துவிட்டு முயலவும்.";
    return "தொடர்ந்து பயிற்சி செய்யவும். மாதிரியின் பெயரிடல்களைப் பயன்படுத்திப் படித்துவிட்டு, வினாடி வினாவை மீண்டும் தொடங்கவும்.";
  }
  if (percent >= 0.8) return "Great work! You identified the major parts of the urinary system.";
  if (percent >= 0.5) return "Good effort. Review the parts you missed and try once more.";
  return "Keep practicing. Use the model labels, then restart the quiz.";
}

function isCorrectPart(question, partId) {
  return question.answerPartIds?.includes(partId);
}

function getClickedPartName(partId, language) {
  const part = kidneyParts[partId];
  if (!part) return language === "ta" ? "மற்றொரு பகுதி" : "another part";
  if (language === "ta" && part.ta) {
    return part.ta.name ?? part.name;
  }
  return part.name;
}

function getProgressiveHint(question, attempts) {
  if (attempts >= 2 && question.strongerHint) return question.strongerHint;
  return question.hint;
}

function getWrongClickFeedback(question, partId, nextAttempts, language) {
  const clickedName = getClickedPartName(partId, language);
  const hint = getProgressiveHint(question, nextAttempts);

  if (language === "ta") {
    return `${nextAttempts === 1 ? "சரியாக இல்லை" : "நல்ல முயற்சி"}. நீங்கள் சொடுக்கியது ${clickedName}. குறிப்பு: ${hint} மீண்டும் முயலவும்.`;
  }
  return `${nextAttempts === 1 ? "Not quite" : "Good try"}. You clicked ${clickedName}. Hint: ${hint} Try again.`;
}

function getMasteredPartName(question) {
  if (!question) return null;
  if (question.type === "click") {
    return question.answerLabel;
  }
  if (question.type === "mcq") {
    const partId = question.correctOptionId;
    if (partId === "kidney" || partId === "leftKidney" || partId === "rightKidney") return "Kidney";
    if (partId === "bladder" || partId === "urinaryBladder") return "Urinary bladder";
    if (partId === "ureter" || partId === "leftUreter" || partId === "rightUreter") return "Ureter";
    return kidneyParts[partId]?.name ?? question.answer ?? "Unknown";
  }
  return null;
}

function translateMasteredPart(name, language) {
  if (language !== "ta") return name;
  const lower = name.toLowerCase();
  if (lower === "kidney") return "சிறுநீரகம்";
  if (lower === "urinary bladder" || lower === "bladder") return "சிறுநீர்ப்பை";
  if (lower === "ureter") return "சிறுநீர்க்குழாய்";
  for (const part of Object.values(kidneyParts)) {
    if (part.name.toLowerCase() === lower || part.shortLabel.toLowerCase() === lower) {
      return part.ta?.name ?? part.ta?.shortLabel ?? name;
    }
  }
  return name;
}

export default function KidneyQuiz({ onQuizModeChange, onHighlightPart, onClearHighlight, language = "en" }) {
  const [quizItems, setQuizItems] = useState(() => createQuizAttempt());
  const [currentIndex, setCurrentIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [selectedOption, setSelectedOption] = useState(null);
  const [feedback, setFeedback] = useState(null);
  const [answered, setAnswered] = useState(false);
  const [attempts, setAttempts] = useState(0);
  const [wrongAttempts, setWrongAttempts] = useState(0);
  const [totalAttempts, setTotalAttempts] = useState(0);
  const [streak, setStreak] = useState(0);
  const [masteredParts, setMasteredParts] = useState([]);
  const [incorrectAnswers, setIncorrectAnswers] = useState([]);

  const currentQuestion = useMemo(() => {
    if (currentIndex >= quizItems.length) return null;
    return getTranslatedQuestion(quizItems[currentIndex], language);
  }, [quizItems, currentIndex, language]);

  const isComplete = currentIndex >= quizItems.length;
  const progressPercent = Math.round((currentIndex / quizItems.length) * 100);

  const typeLabel = useMemo(() => {
    if (isComplete) return language === "ta" ? "முடிந்தது" : "Complete";
    return currentQuestion?.type === "click" 
      ? (language === "ta" ? "மாதிரியைச் சொடுக்கவும்" : "Click on model") 
      : "MCQ";
  }, [currentQuestion, isComplete, language]);

  useEffect(() => {
    if (isComplete || !currentQuestion || currentQuestion.type !== "click" || answered) {
      onQuizModeChange?.(null);
      return undefined;
    }

    onQuizModeChange?.({
      active: true,
      onPartClick: (partId, side) => {
        setTotalAttempts((val) => val + 1);

        if (isCorrectPart(currentQuestion, partId)) {
          setAnswered(true);

          const isFirstTry = attempts === 0;
          if (isFirstTry) {
            setScore((value) => value + 1);
            setStreak((value) => value + 1);
          } else {
            setStreak(0);
          }

          const partName = getMasteredPartName(quizItems[currentIndex]);
          if (partName) {
            setMasteredParts((prev) => {
              if (prev.includes(partName)) return prev;
              return [...prev, partName];
            });
          }

          setFeedback({
            tone: "correct",
            text: currentQuestion.explanation,
          });
          onHighlightPart?.(partId, side);
          return true;
        }

        const nextAttempts = attempts + 1;
        setAttempts(nextAttempts);
        setWrongAttempts((val) => val + 1);
        setStreak(0);

        setFeedback({
          tone: "wrong",
          text: getWrongClickFeedback(currentQuestion, partId, nextAttempts, language),
        });
        return true;
      },
    });

    return () => onQuizModeChange?.(null);
  }, [answered, attempts, currentQuestion, isComplete, onHighlightPart, onQuizModeChange, language, quizItems, currentIndex]);

  const recordIncorrect = (question, pickedAnswer) => {
    setIncorrectAnswers((items) => [
      ...items,
      {
        questionId: question.id,
        pickedAnswer,
      },
    ]);
  };

  const handleMcqAnswer = (option) => {
    if (answered || currentQuestion.type !== "mcq") return;

    setTotalAttempts((val) => val + 1);

    const isCorrect = option.id === currentQuestion.correctOptionId;
    const nextAttempts = attempts + 1;
    setSelectedOption(option);
    setAttempts(nextAttempts);

    if (isCorrect) {
      setAnswered(true);

      const isFirstTry = attempts === 0;
      if (isFirstTry) {
        setScore((value) => value + 1);
        setStreak((value) => value + 1);
      } else {
        setStreak(0);
      }

      const partName = getMasteredPartName(quizItems[currentIndex]);
      if (partName) {
        setMasteredParts((prev) => {
          if (prev.includes(partName)) return prev;
          return [...prev, partName];
        });
      }

      setFeedback({ 
        tone: "correct", 
        text: language === "ta" ? `சரியானது! ${currentQuestion.explanation}` : `Correct! ${currentQuestion.explanation}` 
      });
      return;
    }

    setWrongAttempts((val) => val + 1);
    setStreak(0);
    setFeedback({
      tone: "wrong",
      text: language === "ta"
        ? `${nextAttempts === 1 ? "சரியாக இல்லை" : "நல்ல முயற்சி"}. குறிப்பு: ${getProgressiveHint(currentQuestion, nextAttempts)} மீண்டும் முயலவும்.`
        : `${nextAttempts === 1 ? "Not quite" : "Good try"}. Hint: ${getProgressiveHint(currentQuestion, nextAttempts)} Try again.`,
    });
  };

  const handleNext = () => {
    if (attempts > 1) {
      recordIncorrect(quizItems[currentIndex], selectedOption?.text ?? (language === "ta" ? "தவறான சொடுக்கு" : "Incorrect click"));
    }

    onClearHighlight?.();
    setCurrentIndex((value) => value + 1);
    setSelectedOption(null);
    setFeedback(null);
    setAnswered(false);
    setAttempts(0);
  };

  const restartQuiz = () => {
    onClearHighlight?.();
    setQuizItems(createQuizAttempt());
    setCurrentIndex(0);
    setScore(0);
    setSelectedOption(null);
    setFeedback(null);
    setAnswered(false);
    setAttempts(0);
    setWrongAttempts(0);
    setTotalAttempts(0);
    setStreak(0);
    setMasteredParts([]);
    setIncorrectAnswers([]);
    onQuizModeChange?.(null);
  };

  const renderDashboard = () => {
    const accuracy = currentIndex > 0 ? Math.round((score / currentIndex) * 100) : 0;

    return (
      <div className="mt-4 rounded-xl border border-slate-100 bg-gradient-to-b from-slate-50 to-white p-3.5 shadow-sm text-[11px] text-slate-700">
        <div className="flex items-center justify-between border-b border-slate-100 pb-1.5 mb-2.5">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
            {translations[language].learningProgress}
          </span>
          {streak > 0 && (
            <span className="inline-flex items-center gap-0.5 rounded-full bg-amber-50 px-2 py-0.5 text-[9px] font-bold text-amber-700 border border-amber-200">
              {streak} {translations[language].quizStreak}
            </span>
          )}
        </div>

        <div className="grid grid-cols-3 gap-1.5 text-center">
          {/* Progress Card */}
          <div className="rounded-lg bg-teal-50/30 p-1.5 border border-teal-100/20">
            <span className="block text-[8px] font-bold text-slate-400 uppercase tracking-wider">
              {translations[language].quizProgress}
            </span>
            <span className="text-xs font-black text-teal-800">{currentIndex} / {quizItems.length}</span>
          </div>

          {/* Score Card */}
          <div className="rounded-lg bg-emerald-50/30 p-1.5 border border-emerald-100/20">
            <span className="block text-[8px] font-bold text-slate-400 uppercase tracking-wider">
              {translations[language].quizScore}
            </span>
            <span className="text-xs font-black text-emerald-700">{score}</span>
          </div>

          {/* Accuracy Card */}
          <div className={`rounded-lg p-1.5 border ${accuracy >= 70 ? 'bg-indigo-50/30 border-indigo-100/20 text-indigo-700' : 'bg-slate-50/50 border-slate-100/30 text-slate-600'}`}>
            <span className="block text-[8px] font-bold text-slate-400 uppercase tracking-wider">
              {translations[language].quizAccuracy}
            </span>
            <span className="text-xs font-black">{accuracy}%</span>
          </div>

          {/* Attempts Card */}
          <div className="rounded-lg bg-slate-50/50 p-1.5 border border-slate-100">
            <span className="block text-[8px] font-bold text-slate-400 uppercase tracking-wider">
              {translations[language].quizAttempts}
            </span>
            <span className="text-xs font-extrabold text-slate-700">{totalAttempts}</span>
          </div>

          {/* Mistakes Card */}
          <div className="rounded-lg bg-rose-50/20 p-1.5 border border-rose-100/20">
            <span className="block text-[8px] font-bold text-slate-400 uppercase tracking-wider">
              {translations[language].quizWrong}
            </span>
            <span className="text-xs font-extrabold text-rose-600">{wrongAttempts}</span>
          </div>

          {/* Streak Card */}
          <div className="rounded-lg bg-amber-50/20 p-1.5 border border-amber-100/20">
            <span className="block text-[8px] font-bold text-slate-400 uppercase tracking-wider">
              {translations[language].quizStreak}
            </span>
            <span className="text-xs font-extrabold text-amber-700">🔥 {streak}</span>
          </div>
        </div>

        {masteredParts.length > 0 && (
          <div className="mt-2.5 border-t border-slate-100 pt-2">
            <span className="text-[9px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
              {translations[language].quizPartsMastered}
            </span>
            <div className="flex flex-wrap gap-1">
              {masteredParts.map((part) => (
                <span
                  key={part}
                  className="inline-flex items-center rounded-md bg-teal-50 px-1.5 py-0.5 text-[9px] font-bold text-teal-700 border border-teal-100/50"
                >
                  {translateMasteredPart(part, language)}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  };

  if (isComplete) {
    return (
      <section className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm text-slate-800">
        <div className="text-center pb-1">
          <p className="text-xs font-semibold uppercase tracking-wide text-teal-700">
            {translations[language].quizLearningCheck}
          </p>
          <h2 className="text-lg font-bold text-slate-950 mt-0.5">
            {translations[language].quizComplete}
          </h2>
          <p className="mt-2 text-xs leading-relaxed text-slate-500 px-2">
            {getResultMessage(score, quizItems.length, language)}
          </p>
        </div>

        <div className="mt-4 rounded-xl bg-teal-50/50 p-3 border border-teal-100/50 text-center">
          <span className="block text-[9px] font-bold text-teal-850 uppercase tracking-wider">
            {translations[language].quizFinalScore}
          </span>
          <span className="block text-xl font-black text-teal-700 my-0.5">{score} / {quizItems.length}</span>
          <span className="inline-block text-[10px] font-bold text-teal-600 bg-white px-2 py-0.5 rounded-full border border-teal-100 shadow-sm">
            {translations[language].quizAccuracy}: {quizItems.length > 0 ? Math.round((score / quizItems.length) * 100) : 0}%
          </span>
        </div>

        {renderDashboard()}

        {incorrectAnswers.length > 0 && (
          <div className="mt-4 border-t border-slate-100 pt-3">
            <details className="group">
              <summary className="flex cursor-pointer items-center justify-between text-xs font-bold uppercase tracking-wider text-slate-500 hover:text-slate-800 transition">
                <span>
                  {translations[language].quizReviewMistakes} ({incorrectAnswers.length})
                </span>
                <span className="text-[10px] text-slate-400 group-open:rotate-180 transition-transform duration-200">▼</span>
              </summary>
              <div className="mt-2 max-h-[140px] overflow-y-auto pr-1 space-y-1.5 scrollbar-thin">
                {incorrectAnswers.map((item, idx) => {
                  const originalQuestion = quizQuestions.find((q) => q.id === item.questionId);
                  const resolvedQuestion = getTranslatedQuestion(originalQuestion, language);
                  const questionText = resolvedQuestion?.question ?? originalQuestion?.question ?? "";
                  const resolvedCorrectAnswer = resolvedQuestion
                    ? (resolvedQuestion.answer ?? resolvedQuestion.answerLabel)
                    : (originalQuestion?.answer ?? originalQuestion?.answerLabel ?? "");

                  return (
                    <div key={idx} className="rounded-lg bg-slate-50 p-2 text-xs border border-slate-100">
                      <p className="font-semibold text-slate-700 text-[10px] leading-snug">{questionText}</p>
                      <p className="mt-0.5 font-bold text-teal-700 text-[10px]">
                        {translations[language].quizCorrectLabel} {resolvedCorrectAnswer}
                      </p>
                    </div>
                  );
                })}
              </div>
            </details>
          </div>
        )}

        <button
          type="button"
          className="control-button mt-4 w-full rounded-lg bg-teal-700 py-2.5 text-xs font-bold text-white hover:bg-teal-800 transition"
          onClick={restartQuiz}
        >
          {translations[language].btnRestartQuiz}
        </button>
      </section>
    );
  }

  return (
    <section className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-teal-700">
            {translations[language].quizLearningCheck}
          </p>
          <h2 className="text-lg font-bold text-slate-950">
            {translations[language].quizInteractive}
          </h2>
        </div>
        <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-700">
          {typeLabel}
        </span>
      </div>

      <div className="mt-4">
        <div className="flex items-center justify-between text-xs font-semibold text-slate-600">
          <span>
            {language === "ta" ? `கேள்வி ${currentIndex + 1}/${quizItems.length}` : `Question ${currentIndex + 1}/${quizItems.length}`}
          </span>
          <span>
            {language === "ta" ? `மதிப்பெண் ${score}` : `Score ${score}`}
          </span>
        </div>
        <div className="mt-2 h-2 overflow-hidden rounded-full bg-slate-100">
          <div
            className="h-full rounded-full bg-teal-600 transition-all"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </div>

      <div className="mt-4 rounded-lg border border-slate-200 bg-slate-50 p-3">
        <p className="text-base font-bold leading-6 text-slate-950">
          {currentQuestion.question}
        </p>
        {currentQuestion.type === "click" && !answered && (
          <p className="mt-2 text-sm font-semibold text-teal-800">
            {translations[language].quizClickOnModel}
          </p>
        )}
      </div>

      {currentQuestion.type === "mcq" && (
        <div className="mt-3 grid gap-2">
          {currentQuestion.options.map((option) => {
            const isPicked = selectedOption?.id === option.id;
            const isCorrect = answered && option.id === currentQuestion.correctOptionId;
            const isWrong = answered && isPicked && option.id !== currentQuestion.correctOptionId;

            return (
              <button
                key={option.id}
                type="button"
                className={[
                  "quiz-option rounded-md border px-3 py-2 text-left text-sm transition",
                  isCorrect
                    ? "border-emerald-500 bg-emerald-50 text-emerald-900"
                    : isWrong
                      ? "border-rose-400 bg-rose-50 text-rose-900"
                      : isPicked
                        ? "border-teal-500 bg-teal-50 text-teal-900"
                        : "border-slate-200 bg-white text-slate-700 hover:border-teal-300",
                ].join(" ")}
                onClick={() => handleMcqAnswer(option)}
              >
                {option.text}
              </button>
            );
          })}
        </div>
      )}

      {feedback && (
        <div
          className={[
            "mt-4 rounded-md border px-3 py-2 text-sm font-semibold",
            feedback.tone === "correct"
              ? "border-emerald-200 bg-emerald-50 text-emerald-900"
              : "border-amber-200 bg-amber-50 text-amber-900",
          ].join(" ")}
        >
          {feedback.text}
        </div>
      )}

      {renderDashboard()}

      <div className="mt-4 grid grid-cols-2 gap-2">
        <button
          type="button"
          className="control-button rounded-md bg-teal-700 px-3 py-2 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-45"
          disabled={!answered}
          onClick={handleNext}
        >
          {translations[language].btnNextQuestion}
        </button>
        <button
          type="button"
          className="control-button rounded-md border border-slate-300 px-3 py-2 text-sm font-semibold text-slate-700"
          onClick={restartQuiz}
        >
          {translations[language].btnRestart}
        </button>
      </div>
    </section>
  );
}
