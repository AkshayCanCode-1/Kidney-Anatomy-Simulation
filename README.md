# Kidney Anatomy Explorer
> An interactive 3D Class 11 Biology learning lab for exploring the human excretory system.

[![Vite](https://img.shields.io/badge/Vite-646CFF?style=for-the-badge&logo=Vite&logoColor=white)](https://vite.dev/)
[![React](https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)](https://react.dev/)
[![Three.js](https://img.shields.io/badge/Three.js-black?style=for-the-badge&logo=three.js&logoColor=white)](https://threejs.org/)
[![TailwindCSS](https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)
[![Class 11 Biology](https://img.shields.io/badge/Class_11-Biology_NCERT-FF6B6B?style=for-the-badge&logo=bookstack&logoColor=white)](#learning-outcomes)

An immersive, touch-friendly, 3D exploration tool built to bridge the gap between abstract textbook diagrams and spatial anatomical reality. Designed explicitly to align with the **Class 11 CBSE/NCERT Excretory Products and Their Elimination** curriculum.

---

## Preview & Demo

### Application Interface Mockup
![Kidney Anatomy Explorer Preview](./preview.png)

### Experience It Live
**Live Demo:** [Coming Soon](https://github.com)  
*Or run it locally by following the [Installation & Setup](#installation-and-setup) instructions below.*

<img width="1919" height="1079" alt="image" src="https://github.com/user-attachments/assets/1612284c-2365-4057-9839-365323cf85a0" />

---

## Why This Project Exists

Traditional biology education relies heavily on 2D cross-sections that fail to convey the three-dimensional relationship between organs, blood supply networks, and waste pathways. 

**Kidney Anatomy Explorer** transforms static study into active learning:
* **Overcomes spatial confusion:** Helps students understand where the renal artery branches, how ureters connect to the bladder, and where the cortex sits relative to the medulla.
* **Reinforces conceptual models:** Connects structures directly with their biological purpose, memory tricks, and Class 11 examination syllabus points.
* **Encourages self-assessment:** Includes a real-time biology quiz to let students test their retention immediately.

---

## Key Features

* **Interactive 3D Kidney Model:** Fully rotatable, zoomable, and clickable 3D GLB model representing the human urinary system.
* **Dynamic Highlighting & Glow:** Selected parts stand out with glowing highlights while retaining their realistic GLB textures.
* **Anatomy Callout Labels:** High-fidelity 3D HTML annotations anchored to their exact anatomical coordinates, keeping labels clean and readable.
* **Class 11 Biology Focus:** Every explanation is tailored to school syllabus level, offering definitions, functions, and NCERT-aligned exam tips.
* **Bilingual English/Tamil Support:** Clean language toggle button (`EN | தமிழ்`) in the top-right corner to switch all interface texts, labels, explanations, learning paths, and quiz questions instantly.
* **Quick View Buttons:** Effortlessly orbit to default viewpoints (e.g. Full system, Left Kidney close-up, Right Kidney close-up, Bladder) with one click.
* **Path Mode:** Step-by-step learning walkthrough tracing the path of blood filtration and urine elimination.
* **Interactive Quiz:** Standardized multiple-choice questions mixed with model-click tasks ("Click the correct part on the 3D model").
* **Unlimited Retry System:** Students learn through discovery; wrong attempts show helpful hints, and answers are never automatically revealed.
* **Compact Progress Dashboard:** Real-time metrics inside the quiz tracking questions completed, score, accuracy percentage, total attempts, wrong attempts, and current streak.
* **Parts Mastered Tracking:** Awards visual badges/chips for every anatomical part correctly identified in the quiz.
* **Consistent Deselection:** Click empty space on the 3D viewer in any mode (Learn, Path, or Quiz) to instantly clear highlights and labels.

---

## Learning Flow

1. **Explore (Learn Mode):** Spin and zoom the model. Click on any organ, blood vessel, or inner structure to open its descriptive biology panel.
2. **Trace (Path Mode):** Walk through the step-by-step guide outlining how blood enters the kidney, gets filtered, and leaves the body as urine.
3. **Assess (Quiz Mode):** Take a randomized quiz testing identification skills and anatomical pathways. Learn from wrong clicks using smart hints.
4. **Master (Progress Dashboard):** Complete the quiz to see your final score card, accuracy percentage, and list of parts mastered.

---

## Anatomy Parts Explorer

Clicking any part on the 3D model highlights it and opens a dedicated knowledge panel. Here is a breakdown of the parts detailed in the app:

| Organ / Structure | Core Biological Function | Class 11 NCERT Syllabus Connection |
| :--- | :--- | :--- |
| **Left & Right Kidney** | Filters nitrogenous wastes (urea) & maintains osmoregulation. | Primary excretory organs in human physiology. |
| **Renal Artery** | Brings oxygenated, waste-rich blood from aorta into kidneys. | Point of entry for filtration; high pressure supply. |
| **Renal Vein** | Carries deoxygenated, filtered blood back into systemic circulation. | Lacks urea compared to the renal artery. |
| **Left & Right Ureter** | Transports urine from renal pelvis to the urinary bladder. | Relies on peristaltic muscle movements for transport. |
| **Urinary Bladder** | Muscular sac that temporarily stores urine. | Detrusor muscle contraction triggers micturition. |
| **Renal Cortex** | Outer kidney layer containing glomeruli and convoluted tubules. | Site of ultrafiltration in nephrons. |
| **Renal Medulla** | Inner kidney layer organized into renal pyramids. | Concentration of urine (counter-current mechanism). |

---

## How Students Use It

1. **Rotate & Inspect:** Drag to spin the 3D model, scroll to zoom, and locate organs.
2. **Select & Study:** Click directly on any organ or vessel (or select it from the list/quick view).
3. **Absorb Knowledge:** Read the right-side information panel detailing definitions, key functions, exam tips, and memory devices.
4. **Follow the Flow:** Toggle **Guided Tour** to watch the sequential path of blood entering, filtering, and leaving the system.
5. **Test Retention:** Take the built-in **Anatomy Quiz** to check preparation for biology exams.

---

## Tech Stack

The explorer is engineered with modern, high-performance web tools:

* **Framework:** [React 18](https://react.dev/) — Declarative component architecture.
* **Build Tool:** [Vite](https://vite.dev/) — Lightning-fast development server and optimized bundler.
* **3D Renderer:** [Three.js](https://threejs.org/) — WebGL rendering engine.
* **React wrapper:** [React Three Fiber (R3F)](https://github.com/pmndrs/react-three-fiber) — Declarative Three.js components.
* **R3F Helpers:** [Drei](https://github.com/pmndrs/drei) — Useful controls, HTML projections, and loaders for glTF assets.
* **Styling:** [Tailwind CSS](https://tailwindcss.com/) — Utility-first, responsive modern styles.
* **Asset:** GLB 3D model optimized for web delivery.

---

## Project Structure

```bash
kidney-anatomy-explorer/
├── public/
│   └── Kidney.glb                 # Optimized 3D model file
├── src/
│   ├── components/
│   │   ├── AnatomyInfoPanel.jsx   # Right-side learning explanation card
│   │   ├── AnatomyLabels.jsx      # Clean overlay lines and text anchors
│   │   ├── GuidedLearning.jsx     # Step-by-step filtration path flow
│   │   ├── KidneyExplorer.jsx     # Main workspace combining UI & canvas
│   │   ├── KidneyModel.jsx        # Three.js canvas, GLB loaders, raycast clicks
│   │   └── KidneyQuiz.jsx         # Biology self-evaluation quiz module
│   ├── data/
│   │   ├── kidneyAnatomyData.js   # Definitions, quiz questions, positions
│   │   └── kidneyMeshMap.js       # Mapping GLB mesh names to react IDs
│   ├── hooks/
│   │   └── useSelectedAnatomyPart.js # Selection state management hook
│   ├── App.jsx                    # Root App component
│   ├── index.css                  # Core CSS and Tailwind style injection
│   └── main.jsx                   # React application entry point
├── package.json                   # Project dependencies and script runner
├── tailwind.config.js             # Tailwind design customization
└── vite.config.js                 # Vite bundler options
```

---

## Installation and Setup

Follow these steps to run the Kidney Anatomy Explorer on your local computer:

### Prerequisites
Make sure you have [Node.js (version 16 or above)](https://nodejs.org/) installed.

### Steps
1. **Clone the Repository:**
   ```bash
   git clone https://github.com/YourUsername/kidney-anatomy-explorer.git
   cd kidney-anatomy-explorer
   ```

2. **Install Dependencies:**
   ```bash
   npm install
   ```

3. **Start the Development Server:**
   ```bash
   npm run dev
   ```

4. **Open in Browser:**
   Open your browser and navigate to the local server address (usually `http://localhost:5173`).

---

## Vercel Deployment

This project is configured for seamless deployment to **Vercel** with one click.

### Deployment settings:
* **Framework Preset:** `Vite`
* **Build Command:** `npm run build`
* **Output Directory:** `dist`
* **Install Command:** `npm install`

### Steps to Deploy:
1. Push your code repository to GitHub/GitLab/Bitbucket.
2. Sign in to your [Vercel Dashboard](https://vercel.com).
3. Click **New Project** and select your imported repository.
4. Verify the build settings match above and click **Deploy**.

---

## UI/UX Highlights

* **Glassmorphic HUD:** Transparent panels that sit beautifully over the canvas layout.
* **Smooth Orbit Controls:** Automatic damping for realistic momentum when rotating or panning the model.
* **Focus States:** Selected parts stand out with glowing highlights while unselected parts dim slightly, making visual isolation immediate.

---

## Learning Outcomes (Class 11 Physiology)

By using this explorer, students will master:
* **The anatomical pathway of urine:** Kidneys -> Ureters -> Urinary Bladder -> Urethra.
* **The difference between cortex and medulla:** Understanding that the cortex forms the outer cap while the medulla contains the loop of Henle and collecting ducts.
* **Osmoregulation processes:** Identifying how the kidneys maintain water and salt equilibrium.
* **Renal circulatory loops:** Understanding why the renal artery carries nitrogenous waste while the renal vein carries clean blood.

---

## Future Scope

* **Microscopic Zoom:** Click to dive deep into a 3D simulation of a single **Nephron** showing Bowman’s capsule, PCT, Loop of Henle, and DCT.
* **Urine Formation Animation:** Dynamic visuals representing urine filtration and concentration flows (particle effects).
* **Clinical Case Studies:** Real-world biological conditions like kidney stones (renal calculi), glomerulonephritis, and dialysis simulations.
* **WebXR Support:** Virtual Reality (VR) and Augmented Reality (AR) mode for immersive VR classrooms.

---

## Credits

* **3D Asset Source:** Optimized anatomically-representative urinary system GLB model.
* **Educational Reference:** NCERT Class 11 Biology Textbooks (Chapter: *Excretory Products and their Elimination*).

---

## Author

* **Vinay Verma / Github Profile** - [Vinay Verma](https://github.com/ItsVinayProgrammer)
* Feel free to reach out for collaboration or improvements!

---
*Developed for biology students and science lovers everywhere.*
