import { translations } from "../data/kidneyAnatomyData.js";

export default function AnatomyInfoPanel({ selectedPart, language = "en" }) {
  if (!selectedPart) {
    return (
      <section className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
        <div className="mb-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-teal-700">
            {translations[language].overview}
          </p>
          <h2 className="text-2xl font-bold text-slate-950">
            {translations[language].overviewTitle}
          </h2>
          <p className="mt-2 text-sm leading-6 text-slate-700">
            {translations[language].overviewDesc}
          </p>
        </div>

        <div className="space-y-2 text-sm leading-6 text-slate-700">
          <p>{translations[language].overviewFilter}</p>
          <p>{translations[language].overviewUreters}</p>
          <p>{translations[language].overviewBladder}</p>
          <p>{translations[language].overviewArtery}</p>
          <p>{translations[language].overviewVein}</p>
        </div>

        <p className="mt-4 rounded-md bg-teal-50 px-3 py-2 text-sm font-semibold text-teal-900">
          {translations[language].overviewInstruction}
        </p>
      </section>
    );
  }

  const sections = [
    [translations[language].infoDefinition, selectedPart.definition],
    [translations[language].infoFunction, selectedPart.function],
    [translations[language].infoImportance, selectedPart.importance],
    [translations[language].infoConnection, selectedPart.class11Connection],
    [translations[language].infoTip, selectedPart.memoryTip],
  ];

  return (
    <section className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
      <div className="mb-4 flex items-start gap-3">
        <span
          className="mt-1 h-3 w-3 shrink-0 rounded-full"
          style={{ backgroundColor: selectedPart.color }}
          aria-hidden="true"
        />
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-teal-700">
            {translations[language].selectedPart}
          </p>
          <h2 className="text-2xl font-bold text-slate-950">{selectedPart.name}</h2>
        </div>
      </div>

      <div className="space-y-3">
        {sections.map(([title, text]) => (
          <div key={title}>
            <h3 className="text-sm font-semibold text-slate-950">{title}</h3>
            <p className="mt-1 text-sm leading-6 text-slate-700">{text}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
