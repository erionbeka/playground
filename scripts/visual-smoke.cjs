const { chromium } = require("playwright");
const fs = require("fs");
const path = require("path");

const base = process.env.VISUAL_SMOKE_BASE_URL || "http://127.0.0.1:8080";
const outDir = path.resolve(process.env.VISUAL_SMOKE_OUT_DIR || "test-results/visual-smoke");

fs.mkdirSync(outDir, { recursive: true });

async function loginAndPatch(page, gameId) {
  await page.goto(`${base}/family`, { waitUntil: "networkidle" });
  await page.evaluate((nextGameId) => {
    const raw = localStorage.getItem("playground-life.backend.v2");
    const data = raw ? JSON.parse(raw) : null;

    if (data) {
      const assignment = data.assignments.find((entry) => entry.id === "cw-1") || data.assignments.find((entry) => entry.childId === "child-1");
      assignment.gameIds = [nextGameId];
      assignment.completedGames = [];
      assignment.results = [];
      assignment.status = "pending";
      assignment.type = "classwork";
      assignment.difficulty = "easy";
      assignment.mode = "single";
      assignment.therapistApproval = "approved";
      localStorage.setItem("playground-life.backend.v2", JSON.stringify(data));
    }

    localStorage.removeItem("playground-life.session.v1");
  }, gameId);

  await page.reload({ waitUntil: "networkidle" });
  await page.getByLabel(/phone number/i).fill("555-0101");
  await page.getByLabel(/^password$/i).fill("emma123");
  await page.getByRole("button", { name: "Sign In" }).click();
  await page.getByRole("button", { name: /Start today's session/i }).click();
  await page.getByRole("button", { name: /^Start$/i }).click();
  await page.waitForTimeout(1200);
}

async function loginTherapist(page) {
  await page.goto(`${base}/therapist`, { waitUntil: "networkidle" });
  await page.getByLabel(/clinic email/i).fill("therapist@playgroundlife.app");
  await page.getByLabel(/^password$/i).fill("therapist123");
  await page.getByRole("button", { name: "Sign In" }).click();
  await page.waitForTimeout(800);
}

async function seedNeedsReviewAttempt(page) {
  await page.evaluate(() => {
    const raw = localStorage.getItem("playground-life.backend.v2");
    const data = raw ? JSON.parse(raw) : null;
    if (!data) return;

    const assignment = data.assignments.find((entry) => entry.id === "cw-1") || data.assignments.find((entry) => entry.childId === "child-1");
    if (!assignment) return;

    assignment.status = "pending";
    assignment.therapistApproval = "pending";
    assignment.completedGames = [];
    assignment.results = [{
      gameId: assignment.gameIds[0] || "game-052",
      completedAt: "2026-05-30T10:00:00.000Z",
      durationSeconds: 88,
      score: 45,
      interactions: 9,
      completedSuccessfully: false,
      trials: 10,
      correctTrials: 4,
      errors: 6,
      accuracy: 40,
      masteryThreshold: 70,
      attemptsBySkill: { "visual-recognition": 10 },
      observations: ["Needed support identifying matching facial cues"],
    }];

    localStorage.setItem("playground-life.backend.v2", JSON.stringify(data));
  });
}

async function runDesktop(page) {
  await loginTherapist(page);
  await page.screenshot({ path: path.join(outDir, "therapist-overview.png"), fullPage: true });
  const therapistChecks = {
    dashboard: await page.getByText(/Therapist Dashboard/i).isVisible(),
    navButtons: await page.locator("nav button").count(),
    visibleIcons: await page.locator("nav svg").count(),
  };

  await page.getByRole("button", { name: /Children/i }).click();
  await page.getByLabel(/select child/i).selectOption("child-2");
  await page.screenshot({ path: path.join(outDir, "therapist-children-focused.png"), fullPage: true });
  const childrenChecks = {
    selector: await page.getByLabel(/select child/i).isVisible(),
    selectedChild: await page.getByRole("heading", { name: /^Liam$/i }).isVisible(),
    hiddenChild: await page.getByRole("heading", { name: /^Emma$/i }).count(),
  };

  await seedNeedsReviewAttempt(page);
  await page.reload({ waitUntil: "networkidle" });
  await page.getByRole("button", { name: /Outcomes/i }).click();
  await page.screenshot({ path: path.join(outDir, "therapist-needs-review.png"), fullPage: true });
  await page.getByRole("button", { name: /Open review/i }).first().click();
  await page.screenshot({ path: path.join(outDir, "therapist-attempt-review.png"), fullPage: true });
  const reviewChecks = {
    quickReview: await page.getByText(/Quick Assignment Review/i).isVisible(),
    openReview: await page.getByText(/Retry/i).isVisible(),
    accuracy: await page.getByText(/40%/i).isVisible(),
    skillEvidence: await page.getByText(/visual recognition: 10/i).isVisible(),
  };

  await page.getByRole("button", { name: /Classwork/i }).click();
  await page.screenshot({ path: path.join(outDir, "therapist-classwork-access.png"), fullPage: true });
  const classworkChecks = {
    accessCopy: await page.getByText(/How kids access classwork/i).isVisible(),
    createFlow: await page.getByText(/Create classwork here/i).isVisible(),
  };

  await loginAndPatch(page, "game-093");
  await page.screenshot({ path: path.join(outDir, "froebel-building.png"), fullPage: true });
  const buildingChecks = {
    studio: await page.getByText(/Froebel Gift Studio/i).isVisible(),
    modelTray: await page.getByText(/Model Tray/i).isVisible(),
    chooseSolid: await page.getByText(/Choose the next solid/i).isVisible(),
    buttons: await page.getByRole("button", { name: /piece/i }).count(),
  };

  await loginAndPatch(page, "game-001");
  await page.screenshot({ path: path.join(outDir, "froebel-playground.png"), fullPage: true });
  const playgroundChecks = {
    garden: await page.getByText(/Froebel Play Garden/i).isVisible(),
    nextMove: await page.getByRole("button", { name: /Build the next move|Finish the garden/i }).isVisible(),
    cards: await page.locator(".playground-step-card").count(),
  };

  await loginAndPatch(page, "game-017");
  await page.screenshot({ path: path.join(outDir, "matching-learning.png"), fullPage: true });
  const matchingChecks = {
    purpose: await page.getByText(/Vocabulary matching/i).isVisible(),
    prompt: await page.getByText(/Look, say the word/i).isVisible(),
    hiddenCards: await page.getByRole("button", { name: "hidden matching card" }).count(),
  };

  await loginAndPatch(page, "game-034");
  await page.screenshot({ path: path.join(outDir, "sequence-learning.png"), fullPage: true });
  const sequenceChecks = {
    purpose: await page.getByText(/Pattern and routine sequencing/i).isVisible(),
    prompt: await page.getByText(/Watch the order/i).isVisible(),
    routineWords: await page.getByText(/Wake|Wash|Dress|Eat/i).count(),
  };

  await loginAndPatch(page, "game-131");
  await page.screenshot({ path: path.join(outDir, "memory-learning.png"), fullPage: true });
  const memoryChecks = {
    purpose: await page.getByText(/Working memory/i).isVisible(),
    prompt: await page.getByText(/Say the name quietly|Which card was/i).isVisible(),
    cards: await page.locator("span").filter({ hasText: /CAT|SUN|TREE/i }).count(),
  };

  await loginAndPatch(page, "game-105");
  await page.screenshot({ path: path.join(outDir, "recognition-learning.png"), fullPage: true });
  const recognitionChecks = {
    target: await page.getByText(/Pick the red things/i).isVisible(),
    teachingPoint: await page.getByText(/Color recognition/i).isVisible(),
    choices: await page.getByRole("button").count(),
  };

  await page.goto(base, { waitUntil: "networkidle" });
  await page.screenshot({ path: path.join(outDir, "home.png"), fullPage: true });
  const homeChecks = {
    loaded: await page.locator("body").innerText().then((text) => text.trim().length > 0),
  };

  return { therapistChecks, childrenChecks, reviewChecks, classworkChecks, buildingChecks, playgroundChecks, matchingChecks, sequenceChecks, memoryChecks, recognitionChecks, homeChecks };
}

async function runMobile(page) {
  await loginTherapist(page);
  await page.screenshot({ path: path.join(outDir, "therapist-overview-mobile.png"), fullPage: true });
  const therapistChecks = {
    dashboard: await page.getByText(/Therapist Dashboard/i).isVisible(),
    navButtons: await page.locator("nav button").count(),
    visibleIcons: await page.locator("nav svg").count(),
  };

  await loginAndPatch(page, "game-093");
  await page.screenshot({ path: path.join(outDir, "froebel-building-mobile.png"), fullPage: true });
  const buildingChecks = {
    studio: await page.getByText(/Froebel Gift Studio/i).isVisible(),
    choices: await page.getByRole("button", { name: /piece/i }).count(),
    header: await page.getByText(/Build a Triangle/i).first().isVisible(),
  };

  await loginAndPatch(page, "game-001");
  await page.screenshot({ path: path.join(outDir, "froebel-playground-mobile.png"), fullPage: true });
  const cards = await page.locator(".playground-step-card").evaluateAll((elements) =>
    elements.map((element) => {
      const rect = element.getBoundingClientRect();
      return { left: Math.round(rect.left), right: Math.round(rect.right), width: Math.round(rect.width) };
    })
  );

  return {
    therapistChecks,
    buildingChecks,
    playgroundChecks: {
      garden: await page.getByText(/Froebel Play Garden/i).isVisible(),
      cards: cards.length,
      action: await page.getByRole("button", { name: /Build the next move|Finish the garden/i }).isVisible(),
      cardRects: cards,
    },
  };
}

function assertChecks(result) {
  const failures = [];
  if (!result.desktop.therapistChecks.dashboard) failures.push("Desktop therapist dashboard is missing");
  if (result.desktop.therapistChecks.navButtons !== 5) failures.push("Desktop therapist nav should show 5 tabs");
  if (result.desktop.therapistChecks.visibleIcons < 5) failures.push("Desktop therapist nav icons are missing");
  if (!result.desktop.childrenChecks.selector) failures.push("Desktop children selector is missing");
  if (!result.desktop.childrenChecks.selectedChild) failures.push("Desktop children selector did not show the selected child");
  if (result.desktop.childrenChecks.hiddenChild !== 0) failures.push("Desktop children page still shows unselected child details");
  if (!result.desktop.reviewChecks.quickReview) failures.push("Desktop therapist review list is missing");
  if (!result.desktop.reviewChecks.openReview) failures.push("Desktop needs-review drilldown is missing retry outcome");
  if (!result.desktop.reviewChecks.accuracy) failures.push("Desktop needs-review drilldown is missing accuracy");
  if (!result.desktop.reviewChecks.skillEvidence) failures.push("Desktop needs-review drilldown is missing skill evidence");
  if (!result.desktop.classworkChecks.accessCopy) failures.push("Desktop classwork access explanation is missing");
  if (!result.desktop.classworkChecks.createFlow) failures.push("Desktop classwork creation flow copy is missing");
  if (!result.desktop.buildingChecks.studio) failures.push("Desktop building studio is missing");
  if (!result.desktop.buildingChecks.modelTray) failures.push("Desktop building model tray is missing");
  if (!result.desktop.buildingChecks.chooseSolid) failures.push("Desktop building choice panel is missing");
  if (result.desktop.buildingChecks.buttons < 4) failures.push("Desktop building needs at least 4 piece buttons");
  if (!result.desktop.playgroundChecks.garden) failures.push("Desktop playground garden header is missing");
  if (!result.desktop.playgroundChecks.nextMove) failures.push("Desktop playground action is missing");
  if (result.desktop.playgroundChecks.cards !== 4) failures.push("Desktop playground should show 4 step cards");
  if (!result.desktop.matchingChecks.purpose) failures.push("Desktop matching learning purpose is missing");
  if (!result.desktop.matchingChecks.prompt) failures.push("Desktop matching learning prompt is missing");
  if (result.desktop.matchingChecks.hiddenCards < 8) failures.push("Desktop matching cards are missing");
  if (!result.desktop.sequenceChecks.purpose) failures.push("Desktop sequence learning purpose is missing");
  if (!result.desktop.sequenceChecks.prompt) failures.push("Desktop sequence learning prompt is missing");
  if (result.desktop.sequenceChecks.routineWords < 4) failures.push("Desktop sequence routine words are missing");
  if (!result.desktop.memoryChecks.purpose) failures.push("Desktop memory learning purpose is missing");
  if (!result.desktop.memoryChecks.prompt) failures.push("Desktop memory learning prompt is missing");
  if (result.desktop.memoryChecks.cards < 3) failures.push("Desktop memory word cards are missing");
  if (!result.desktop.recognitionChecks.target) failures.push("Desktop recognition target is missing");
  if (!result.desktop.recognitionChecks.teachingPoint) failures.push("Desktop recognition teaching point is missing");
  if (result.desktop.recognitionChecks.choices < 6) failures.push("Desktop recognition choices are missing");
  if (!result.desktop.homeChecks.loaded) failures.push("Home page body is empty");
  if (!result.mobile.buildingChecks.studio) failures.push("Mobile building studio is missing");
  if (!result.mobile.therapistChecks.dashboard) failures.push("Mobile therapist dashboard is missing");
  if (result.mobile.therapistChecks.navButtons !== 5) failures.push("Mobile therapist nav should show 5 tabs");
  if (result.mobile.therapistChecks.visibleIcons < 5) failures.push("Mobile therapist nav icons are missing");
  if (result.mobile.buildingChecks.choices < 4) failures.push("Mobile building needs at least 4 choices");
  if (!result.mobile.playgroundChecks.garden) failures.push("Mobile playground garden header is missing");
  if (result.mobile.playgroundChecks.cards !== 4) failures.push("Mobile playground should show 4 cards");
  if (!result.mobile.playgroundChecks.action) failures.push("Mobile playground action is missing");
  if (result.mobile.playgroundChecks.cardRects.some((rect) => rect.left < 0 || rect.right > 390)) failures.push("Mobile playground card is clipped horizontally");

  if (failures.length > 0) {
    throw new Error(failures.join("; "));
  }
}

async function run() {
  const browser = await chromium.launch({ headless: true });
  const desktop = await browser.newPage({ viewport: { width: 1440, height: 1100 }, deviceScaleFactor: 1 });
  const mobile = await browser.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2 });

  const result = {
    base,
    output: outDir,
    desktop: await runDesktop(desktop),
    mobile: await runMobile(mobile),
  };

  await browser.close();
  assertChecks(result);
  console.log(JSON.stringify(result, null, 2));
}

run().catch((error) => {
  console.error(error);
  process.exit(1);
});
