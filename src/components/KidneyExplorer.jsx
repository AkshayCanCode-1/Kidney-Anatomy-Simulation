import { useCallback, useMemo, useRef, useState } from "react";
import AnatomyInfoPanel from "./AnatomyInfoPanel.jsx";
import AnatomyOverlay from "./AnatomyOverlay.jsx";
import GuidedLearning from "./GuidedLearning.jsx";
import KidneyModel from "./KidneyModel.jsx";
import KidneyQuiz from "./KidneyQuiz.jsx";
import { guidedSteps, interactivePartIds, kidneyParts, translations, getTranslatedPart } from "../data/kidneyAnatomyData.js";
import { useSelectedAnatomyPart } from "../hooks/useSelectedAnatomyPart.js";

function getDefaultSideForPart(partId, fallbackSide = "left") {
  return kidneyParts[partId]?.side ?? (kidneyParts[partId]?.internal ? fallbackSide : null);
}

export default function KidneyExplorer() {
  const viewerRef = useRef(null);
  const screenCoordsRef = useRef({});
  const { selectedPartId, selectedPart, setSelectedPartId } = useSelectedAnatomyPart();
  const [labelsVisible, setLabelsVisible] = useState(false);
  const [selectedLabelVisible, setSelectedLabelVisible] = useState(false);
  const [resetSignal, setResetSignal] = useState(0);
  const [cameraView, setCameraView] = useState("full");
  const [activeSide, setActiveSide] = useState("left");
  const [activeTab, setActiveTab] = useState("learn");
  const [guideStep, setGuideStep] = useState(0);
  const quizModelModeRef = useRef(null);

  const [language, setLanguage] = useState(() => {
    try {
      return sessionStorage.getItem("kidney_sim_lang") || "en";
    } catch {
      return "en";
    }
  });

  const handleLanguageChange = (lang) => {
    setLanguage(lang);
    try {
      sessionStorage.setItem("kidney_sim_lang", lang);
    } catch (e) {
      console.error(e);
    }
  };

  const translatedTabs = useMemo(() => [
    { id: "learn", label: translations[language].tabLearn },
    { id: "guide", label: translations[language].tabPath },
    { id: "quiz", label: translations[language].tabQuiz },
  ], [language]);

  const translatedCameraViewOptions = useMemo(() => [
    { id: "full", label: translations[language].viewFullSystem },
    { id: "leftKidney", label: translations[language].viewLeftKidney },
    { id: "rightKidney", label: translations[language].viewRightKidney },
    { id: "bladder", label: translations[language].viewBladder },
  ], [language]);

  const partList = useMemo(
    () => interactivePartIds.map((partId) => kidneyParts[partId]),
    []
  );

  const translatedSelectedPart = useMemo(
    () => getTranslatedPart(selectedPart, language),
    [selectedPart, language]
  );

  const highlightPart = useCallback((partId, sideOverride) => {
    setSelectedLabelVisible(true);
    const nextSide = sideOverride ?? getDefaultSideForPart(partId, activeSide);
    setSelectedPartId(partId);
    if (nextSide) setActiveSide(nextSide);
  }, [activeSide, setSelectedPartId]);

  const clearSelection = useCallback(() => {
    setSelectedPartId(null);
    setSelectedLabelVisible(false);
  }, [setSelectedPartId]);

  const handleEmptyViewerClick = useCallback(() => {
    clearSelection();
  }, [clearSelection]);

  const selectPart = (partId, sideOverride) => {
    if (quizModelModeRef.current?.onPartClick) {
      const handledByQuiz = quizModelModeRef.current.onPartClick(partId, sideOverride);
      if (handledByQuiz) return;
    }

    highlightPart(partId, sideOverride);
  };

  const handleQuizModeChange = useCallback((mode) => {
    quizModelModeRef.current = mode;
  }, []);

  const handleGuideStep = (nextStep) => {
    const safeStep = Math.min(Math.max(nextStep, 0), guidedSteps.length - 1);
    const stepPartId = guidedSteps[safeStep].id;
    setGuideStep(safeStep);
    selectPart(stepPartId, getDefaultSideForPart(stepPartId, activeSide));
    setActiveTab("guide");
  };

  const handleFullscreen = async () => {
    if (!viewerRef.current) return;
    if (document.fullscreenElement) {
      await document.exitFullscreen();
      return;
    }
    await viewerRef.current.requestFullscreen();
  };

  return (
    <main className="min-h-screen bg-[#eef5f4] p-3 text-slate-900 lg:p-4">
      <div className="viewer-grid mx-auto grid max-w-[1700px] gap-4">
        <section
          ref={viewerRef}
          className="relative min-h-[430px] overflow-hidden rounded-lg border border-white/70 bg-[#c7d2d6] shadow-lab h-[62vh] lg:h-[calc(100vh-2rem)]"
          aria-label="Interactive 3D kidney model viewer"
        >
          <KidneyModel
            selectedPartId={selectedPartId}
            activeSide={activeSide}
            onSelectPart={selectPart}
            onClearSelection={handleEmptyViewerClick}
            resetSignal={resetSignal}
            viewPreset={cameraView}
            screenCoordsRef={screenCoordsRef}
            language={language}
          />
          <AnatomyOverlay
            screenCoordsRef={screenCoordsRef}
            containerRef={viewerRef}
            labelsVisible={labelsVisible}
            selectedLabelVisible={selectedLabelVisible}
            selectedPartId={selectedPartId}
            activeSide={activeSide}
            onSelectPart={selectPart}
            language={language}
          />

          {/* Language Toggle */}
          <div className="absolute right-3 top-3 z-10 sm:right-4 sm:top-4">
            <div className="flex rounded-lg border border-slate-200 bg-white/95 p-0.5 shadow-sm backdrop-blur">
              <button
                type="button"
                onClick={() => handleLanguageChange("en")}
                className={`rounded-md px-2.5 py-1 text-xs font-bold transition-all ${
                  language === "en"
                    ? "bg-teal-700 text-white"
                    : "text-slate-700 hover:bg-slate-100"
                }`}
              >
                EN
              </button>
              <button
                type="button"
                onClick={() => handleLanguageChange("ta")}
                className={`rounded-md px-2.5 py-1 text-xs font-bold transition-all ${
                  language === "ta"
                    ? "bg-teal-700 text-white"
                    : "text-slate-700 hover:bg-slate-100"
                }`}
              >
                தமிழ்
              </button>
            </div>
          </div>

          <div className="pointer-events-none absolute left-3 top-3 max-w-[78%] rounded-lg bg-white/90 px-3 py-2 shadow-sm backdrop-blur sm:left-4 sm:top-4 sm:max-w-md">
            <p className="text-xs font-semibold uppercase tracking-wide text-teal-700">
              {translations[language].class11}
            </p>
            <h1 className="text-lg font-bold text-slate-950 sm:text-2xl">
              {translations[language].title}
            </h1>
          </div>

          <div className="absolute bottom-3 left-3 right-3 flex flex-wrap items-center gap-2 sm:bottom-4 sm:left-4 sm:right-4">
            <button
              type="button"
              className="control-button rounded-md bg-white/95 px-3 py-2 text-sm font-semibold text-slate-800 shadow-sm"
              onClick={() => {
                setCameraView("full");
                setResetSignal((value) => value + 1);
              }}
            >
              {translations[language].btnResetView}
            </button>
            <button
              type="button"
              className={[
                "control-button rounded-md px-3 py-2 text-sm font-semibold shadow-sm",
                labelsVisible
                  ? "bg-teal-700 text-white"
                  : "bg-white/95 text-slate-800",
              ].join(" ")}
              onClick={() => {
                setLabelsVisible((value) => {
                  if (value) setSelectedLabelVisible(false);
                  return !value;
                });
              }}
            >
              {translations[language].btnLabels}
            </button>
            <button
              type="button"
              className="control-button rounded-md bg-white/95 px-3 py-2 text-sm font-semibold text-slate-800 shadow-sm"
              onClick={handleFullscreen}
            >
              {translations[language].btnFullscreen}
            </button>
          </div>
        </section>

        <aside className="panel-scroll flex flex-col gap-4 overflow-y-auto rounded-lg border border-white/70 bg-slate-50/90 p-3 shadow-lab lg:h-[calc(100vh-2rem)] lg:p-4">
          <div className="grid grid-cols-3 gap-2 rounded-lg bg-white p-1 shadow-sm">
            {translatedTabs.map((tab) => (
              <button
                key={tab.id}
                type="button"
                className={[
                  "control-button rounded-md px-3 py-2 text-sm font-bold transition",
                  activeTab === tab.id
                    ? "bg-teal-700 text-white"
                    : "text-slate-700 hover:bg-slate-100",
                ].join(" ")}
                onClick={() => {
                  if (activeTab === "quiz" && tab.id !== "quiz") {
                    clearSelection();
                    handleQuizModeChange(null);
                  }
                  setActiveTab(tab.id);
                }}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {activeTab !== "quiz" && (
            <AnatomyInfoPanel
              selectedPart={translatedSelectedPart}
              language={language}
            />
          )}

          <section className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
            <h2 className="text-sm font-bold uppercase tracking-wide text-slate-700">
              {translations[language].lblQuickViews}
            </h2>
            <div className="mt-3 grid grid-cols-2 gap-2">
              {translatedCameraViewOptions.map((view) => (
                <button
                  key={view.id}
                  type="button"
                  className={[
                    "control-button rounded-md border px-3 py-2 text-left text-sm font-semibold transition",
                    cameraView === view.id
                      ? "border-teal-600 bg-teal-50 text-teal-900"
                      : "border-slate-200 bg-white text-slate-700 hover:border-teal-300",
                  ].join(" ")}
                  onClick={() => {
                    setCameraView(view.id);
                    if (view.id === "leftKidney") setActiveSide("left");
                    if (view.id === "rightKidney") setActiveSide("right");
                    setResetSignal((value) => value + 1);
                  }}
                >
                  {view.label}
                </button>
              ))}
            </div>
          </section>

          {activeTab === "learn" && (
            <>
              <details className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
                <summary className="cursor-pointer text-sm font-bold uppercase tracking-wide text-slate-700">
                  {translations[language].lblAnatomyParts}
                </summary>
                <div className="mt-3 grid grid-cols-2 gap-2">
                  {partList.map((part) => {
                    const translatedPart = getTranslatedPart(part, language);
                    return (
                      <button
                        key={part.id}
                        type="button"
                        className={[
                          "control-button rounded-md border px-3 py-2 text-left text-sm font-semibold transition",
                          selectedPartId === part.id
                            ? "border-teal-600 bg-teal-50 text-teal-900"
                            : "border-slate-200 bg-white text-slate-700 hover:border-teal-300",
                        ].join(" ")}
                        onClick={() => selectPart(part.id, getDefaultSideForPart(part.id, activeSide))}
                      >
                        {translatedPart.shortLabel}
                      </button>
                    );
                  })}
                </div>
              </details>
            </>
          )}

          {activeTab === "guide" && (
            <>
              <GuidedLearning
                currentStep={guideStep}
                onStepChange={handleGuideStep}
                language={language}
              />
            </>
          )}

          {activeTab === "quiz" && (
            <KidneyQuiz
              onQuizModeChange={handleQuizModeChange}
              onHighlightPart={highlightPart}
              onClearHighlight={clearSelection}
              language={language}
            />
          )}
        </aside>
      </div>
    </main>
  );
}
