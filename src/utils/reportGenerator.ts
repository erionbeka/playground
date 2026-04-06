import { HomeworkAssignment, Child, GameResult } from "@/context/AppContext";
import { getGameById } from "@/data/games";
import jsPDF from "jspdf";

interface ReportData {
  childName: string;
  filterType: string;
  assignments: HomeworkAssignment[];
  children: Child[];
  allResults: GameResult[];
  metrics: {
    avgScore: number;
    avgAttention: number | null;
    avgPrompts: string | null;
    avgEmotionReg: number | null;
    avgComm: number | null;
    totalFrustration: number;
    avgIndependence: number | null;
    totalPlayTime: number;
  };
}

export function generateReport(data: ReportData) {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  let y = 20;

  const addText = (text: string, x: number, yPos: number, opts?: { fontSize?: number; fontStyle?: string; color?: [number, number, number] }) => {
    doc.setFontSize(opts?.fontSize || 10);
    doc.setFont("helvetica", opts?.fontStyle || "normal");
    if (opts?.color) doc.setTextColor(...opts.color);
    else doc.setTextColor(50, 50, 50);
    doc.text(text, x, yPos);
  };

  const addLine = (yPos: number) => {
    doc.setDrawColor(200, 200, 200);
    doc.line(15, yPos, pageWidth - 15, yPos);
  };

  const checkPage = () => {
    if (y > 270) { doc.addPage(); y = 20; }
  };

  // Header
  addText("Playground Life", 15, y, { fontSize: 22, fontStyle: "bold", color: [80, 120, 200] });
  y += 8;
  addText("Clinical Progress Report", 15, y, { fontSize: 14, fontStyle: "bold" });
  y += 7;
  addText(`Generated: ${new Date().toLocaleDateString()} | Child: ${data.childName} | Type: ${data.filterType}`, 15, y, { fontSize: 9, color: [120, 120, 120] });
  y += 5;
  addLine(y);
  y += 10;

  // Executive Summary
  addText("EXECUTIVE SUMMARY", 15, y, { fontSize: 12, fontStyle: "bold", color: [80, 120, 200] });
  y += 8;
  const summaryItems = [
    `Total assignments: ${data.assignments.length}`,
    `Games completed: ${data.allResults.length}`,
    `Average task score: ${data.metrics.avgScore}/100`,
    `Total play time: ${data.metrics.totalPlayTime} minutes`,
  ];
  summaryItems.forEach((item) => { addText(`• ${item}`, 20, y); y += 6; });
  y += 4;

  // Clinical Metrics
  checkPage();
  addText("CLINICAL METRICS", 15, y, { fontSize: 12, fontStyle: "bold", color: [80, 120, 200] });
  y += 8;

  const metricRows: [string, string, string][] = [
    ["Metric", "Value", "Clinical Significance"],
    ["Task Performance Score", `${data.metrics.avgScore}/100`, data.metrics.avgScore >= 80 ? "Above expectations" : data.metrics.avgScore >= 60 ? "Meeting expectations" : "Needs support"],
  ];
  if (data.metrics.avgAttention != null) metricRows.push(["Attention Span", `${data.metrics.avgAttention}/10`, data.metrics.avgAttention >= 7 ? "Sustained attention" : "Attention support needed"]);
  if (data.metrics.avgPrompts != null) metricRows.push(["Prompts Needed", `${data.metrics.avgPrompts} avg`, parseFloat(data.metrics.avgPrompts) <= 2 ? "High independence" : "Prompting required"]);
  if (data.metrics.avgEmotionReg != null) metricRows.push(["Emotional Regulation", `${data.metrics.avgEmotionReg}/10`, data.metrics.avgEmotionReg >= 7 ? "Good self-regulation" : "Regulation support needed"]);
  if (data.metrics.avgComm != null) metricRows.push(["Communication Attempts", `${data.metrics.avgComm} avg/session`, data.metrics.avgComm >= 8 ? "Active communicator" : "Encourage communication"]);
  metricRows.push(["Frustration Events", `${data.metrics.totalFrustration} total`, data.metrics.totalFrustration <= 2 ? "Low frustration tolerance issues" : "Monitor frustration triggers"]);
  if (data.metrics.avgIndependence != null) metricRows.push(["Independence Level", `${data.metrics.avgIndependence}/10`, data.metrics.avgIndependence >= 7 ? "Working independently" : "Scaffolding recommended"]);

  // Draw table
  const colWidths = [55, 35, 90];
  metricRows.forEach((row, ri) => {
    checkPage();
    const bgColor: [number, number, number] = ri === 0 ? [80, 120, 200] : ri % 2 === 0 ? [245, 245, 250] : [255, 255, 255];
    doc.setFillColor(...bgColor);
    doc.rect(15, y - 4, pageWidth - 30, 7, "F");
    row.forEach((cell, ci) => {
      const x = 17 + colWidths.slice(0, ci).reduce((s, w) => s + w, 0);
      addText(cell, x, y, { fontSize: 8, fontStyle: ri === 0 ? "bold" : "normal", color: ri === 0 ? [255, 255, 255] : [50, 50, 50] });
    });
    y += 7;
  });
  y += 6;

  // Assignment Details
  checkPage();
  addText("ASSIGNMENT DETAILS", 15, y, { fontSize: 12, fontStyle: "bold", color: [80, 120, 200] });
  y += 8;

  data.assignments.forEach((a) => {
    checkPage();
    const child = data.children.find((c) => c.id === a.childId);
    const progress = a.gameIds.length > 0 ? Math.round((a.completedGames.length / a.gameIds.length) * 100) : 0;

    addText(`${child?.name || "Unknown"} — ${a.type === "classwork" ? "Classwork" : "Homework"} (${a.status})`, 17, y, { fontSize: 9, fontStyle: "bold" });
    y += 5;
    addText(`Due: ${a.dueDate} | Progress: ${progress}% | Mode: ${a.mode} | Difficulty: ${a.difficulty}`, 20, y, { fontSize: 8, color: [100, 100, 100] });
    y += 5;

    // Games
    const gameNames = a.gameIds.map((gid) => {
      const g = getGameById(gid);
      const done = a.completedGames.includes(gid);
      return `${done ? "✓" : "○"} ${g?.name || gid}`;
    });
    addText(`Games: ${gameNames.join(", ")}`, 20, y, { fontSize: 8 });
    y += 5;

    if (a.notes) { addText(`Notes: ${a.notes}`, 20, y, { fontSize: 8, fontStyle: "italic", color: [100, 100, 100] }); y += 5; }

    // Per-game results
    if (a.results.length > 0) {
      a.results.forEach((r) => {
        checkPage();
        const g = getGameById(r.gameId);
        let line = `  ${g?.name || r.gameId}: Score ${r.score}, ${r.interactions} interactions, ${Math.round(r.durationSeconds / 60)}m`;
        if (r.attentionSpan != null) line += `, Attention ${r.attentionSpan}/10`;
        if (r.emotionalRegulation != null) line += `, EmReg ${r.emotionalRegulation}/10`;
        if (r.promptsNeeded != null) line += `, ${r.promptsNeeded} prompts`;
        addText(line, 22, y, { fontSize: 7 });
        y += 4;
      });
    }
    y += 3;
    addLine(y);
    y += 5;
  });

  // Recommendations
  checkPage();
  y += 3;
  addText("CLINICAL OBSERVATIONS & RECOMMENDATIONS", 15, y, { fontSize: 12, fontStyle: "bold", color: [80, 120, 200] });
  y += 8;

  const recs: string[] = [];
  if (data.metrics.avgScore < 60) recs.push("Task scores below expectations — consider reducing difficulty or providing more scaffolding.");
  if (data.metrics.avgAttention != null && data.metrics.avgAttention < 6) recs.push("Attention span below average — incorporate shorter activities with visual timers.");
  if (data.metrics.avgPrompts != null && parseFloat(data.metrics.avgPrompts) > 3) recs.push("High prompting frequency — work on fading prompts gradually using visual supports.");
  if (data.metrics.avgEmotionReg != null && data.metrics.avgEmotionReg < 6) recs.push("Emotional regulation needs support — introduce calming strategies before challenging tasks.");
  if (data.metrics.totalFrustration > 3) recs.push("Multiple frustration events observed — analyze triggers and introduce coping strategies.");
  if (data.metrics.avgIndependence != null && data.metrics.avgIndependence < 6) recs.push("Independence level indicates need for continued scaffolding with gradual release.");
  if (data.metrics.avgComm != null && data.metrics.avgComm < 5) recs.push("Limited communication attempts — use high-interest activities to encourage verbal/non-verbal interaction.");
  if (recs.length === 0) recs.push("Overall performance is within expected range. Continue current intervention plan.");
  recs.push("Continue to monitor progress across sessions and adjust difficulty as appropriate.");

  recs.forEach((rec) => {
    checkPage();
    addText(`• ${rec}`, 20, y, { fontSize: 9 });
    y += 7;
  });

  // Footer
  y += 8;
  checkPage();
  addLine(y);
  y += 5;
  addText("This report is auto-generated by Playground Life. Clinical decisions should be made in consultation with qualified professionals.", 15, y, { fontSize: 7, color: [150, 150, 150] });

  doc.save(`PlaygroundLife_Report_${data.childName.replace(/\s/g, "_")}_${new Date().toISOString().slice(0, 10)}.pdf`);
}
