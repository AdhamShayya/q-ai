// import React, { useState } from"react";
// import Navbar from"../../components/Navbar";
// import SVGIcon from"../../components/SVGIcon";
// import Button from"../../components/Button";

// // ── Mock data ────────────────────────────────────────────────────────────────

// const CURRENT_MATERIAL = {
//  title:"Introduction to Cellular Biology",
//  subtitle:"Chapter 3: Cellular Respiration",
//  progress: 45,
//  keyConceptsCovered: 12,
// };

// const QUICK_MATERIALS = [
//  { id: 1, title:"Quantum Physics Notes", subtitle:"PDF • 45 pages"},
//  { id: 2, title:"Chemistry Lab Report", subtitle:"Document • 12 pages"},
//  { id: 3, title:"Biology Lecture Video", subtitle:"Video • 52 min"},
// ];

// const VOICE_TIPS = [
// "Speak naturally - the AI understands conversational language",
// "Use voice commands to switch materials or review sections",
// "Bookmark important explanations for later review",
// "Adjust playback speed to match your learning pace",
// ];

// // Bar heights for the waveform visualizer (fixed to avoid re-renders)
// const WAVEFORM_HEIGHTS = [
//  28, 48, 68, 42, 78, 58, 88, 52, 36, 72, 62, 82, 48, 58, 68, 42, 78, 52, 38,
//  66, 55, 72, 44, 60,
// ];

// // ── Sub-components ───────────────────────────────────────────────────────────

// function ProgressBar({ pct }: { pct: number }) {
//  return (
//  <div className="h-2 rounded-full overflow-hidden">
//  <div
//  className="h-full bg-primary rounded-full transition-[width] duration-600"
//  style={{ width:`${pct}%`}}
//  />
//  </div>
//  );
// }

// function CurrentMaterialCard() {
//  const { title, subtitle, progress, keyConceptsCovered } = CURRENT_MATERIAL;
//  return (
//  <div className="border-[1.5px] rounded-xl p-6">
//  <div className="flex items-start gap-3 mb-4">
//  <SVGIcon
//  name="file"
//  size={14}
//  style={{
//  color:"var(--color-text-secondary)",
//  flexShrink: 0,
//  marginTop: 2,
//  }}
//  />
//  <div>
//  <h3 className="text-base font-bold text-primary leading-snug">
//  {title}
//  </h3>
//  <p className="text-sm mt-0.5">{subtitle}</p>
//  </div>
//  </div>

//  <div className="mb-3">
//  <div className="flex justify-between mb-1.5">
//  <span className="text-sm">Progress</span>
//  <span className="text-sm font-semibold text-primary">
//  {progress}%
//  </span>
//  </div>
//  <ProgressBar pct={progress} />
//  </div>

//  <div className="flex items-center gap-1.5 text-sm text-warning">
//  <span>💡</span>
//  <span className="">
//  {keyConceptsCovered} key concepts covered
//  </span>
//  </div>
//  </div>
//  );
// }

// function Waveform({ active }: { active: boolean }) {
//  return (
//  <div className="flex items-center justify-center gap-1 h-14">
//  {WAVEFORM_HEIGHTS.map((h, i) => (
//  <div
//  key={i}
//  className={`w-1 rounded-full ${active ?"waveform-bar bg-accent":"bg-border"}`}
//  style={{
//  height: h,
//  animationDelay: active ?`${(i * 0.05).toFixed(2)}s`: undefined,
//  transformOrigin:"center",
//  }}
//  />
//  ))}
//  </div>
//  );
// }

// function CircleButton({
//  onClick,
//  children,
//  className ="",
// }: {
//  onClick?: () => void;
//  children: React.ReactNode;
//  className?: string;
// }) {
//  return (
//  <button
//  onClick={onClick}
//  className={`w-11 h-11 rounded-full border-[1.5px] flex items-center justify-center transition-colors ${className}`}
//  >
//  {children}
//  </button>
//  );
// }

// function VoicePanel({
//  isListening,
//  onToggle,
// }: {
//  isListening: boolean;
//  onToggle: () => void;
// }) {
//  return (
//  <div className="border-[1.5px] rounded-xl p-8 flex flex-col items-center gap-6">
//  <div className="flex items-center gap-2 self-start">
//  <div
//  className={`w-2 h-2 rounded-full ${isListening ?"bg-accent animate-pulse":"bg-text-muted"}`}
//  />
//  <span
//  className={`text-sm font-medium ${isListening ?"text-accent":""}`}
//  >
//  {isListening ?"Listening...":"Ready"}
//  </span>
//  {isListening === false && (
//  <span className="text-sm">
//  · Tap the microphone to start
//  </span>
//  )}
//  </div>

//  {/* Waveform */}
//  <Waveform active={isListening} />

//  {/* Mic button */}
//  <button
//  onClick={onToggle}
//  className="w-18 h-18 rounded-full bg-primary text-white flex items-center justify-center hover:bg-primary-hover transition-colors shadow-md"
//  >
//  <SVGIcon name="mic"size={26} />
//  </button>

//  {/* Instruction */}
//  <p className="text-sm text-center max-w-xs">
//  Tap the microphone and ask a question about your study material
//  </p>

//  {/* Playback controls */}
//  <div className="flex items-center gap-3">
//  <CircleButton>
//  <SVGIcon name="rotate-ccw"size={15} />
//  </CircleButton>
//  <CircleButton>
//  <SVGIcon name="pause"size={15} />
//  </CircleButton>
//  <CircleButton>
//  <span className="text-xs font-semibold">1x</span>
//  </CircleButton>
//  </div>
//  </div>
//  );
// }

// function CollapsibleSection({
//  title,
//  icon,
//  open,
//  onToggle,
//  children,
// }: {
//  title: string;
//  icon?: React.ReactNode;
//  open: boolean;
//  onToggle: () => void;
//  children: React.ReactNode;
// }) {
//  return (
//  <div className="bg-white rounded-xl overflow-hidden">
//  <div
//  onClick={onToggle}
//  className="w-full flex items-center justify-between px-6 py-4 bg-white border-b border-(--primary-color) transition-colors"
//  >
//  <div className="flex items-center gap-2.5 font-semibold text-black">
//  {icon}
//  {title}
//  </div>
//  <SVGIcon
//  name={open ?"chevron-up":"chevron-down"}
//  size={16}
//  strokeWidth={2}
//  style={{ color:"var(--color-text-secondary)"}}
//  />
//  </div>
//  {open && <div className="px-6 pb-6">{children}</div>}
//  </div>
//  );
// }

// function TranscriptEmptyState() {
//  return (
//  <div className="flex flex-col items-center gap-3 py-8">
//  <SVGIcon
//  name="message-square"
//  size={40}
//  strokeWidth={1.5}
//  style={{ color:"var(--color-border)"}}
//  />
//  <p className="text-sm">
//  Start speaking to begin your voice study session
//  </p>
//  </div>
//  );
// }

// function QuickMaterialList() {
//  return (
//  <div className="flex flex-col gap-3 pt-4">
//  {QUICK_MATERIALS.map((m) => (
//  <button
//  key={m.id}
//  className="flex items-center gap-3 p-3 border hover:bg-white transition-colors text-left"
//  >
//  <SVGIcon
//  name="file"
//  size={14}
//  style={{ color:"var(--color-text-muted)", flexShrink: 0 }}
//  />
//  <div>
//  <p className="text-sm font-medium text-primary leading-snug">
//  {m.title}
//  </p>
//  <p className="text-xs">{m.subtitle}</p>
//  </div>
//  </button>
//  ))}
//  </div>
//  );
// }

// function VoiceStudyTipsCard() {
//  return (
//  <div className="border-[1.5px] rounded-xl p-6">
//  <div className="flex items-center gap-2 mb-4">
//  <span>💡</span>
//  <h3 className="font-semibold text-primary">Voice Study Tips</h3>
//  </div>
//  <ul className="flex flex-col gap-2.5">
//  {VOICE_TIPS.map((tip, i) => (
//  <li
//  key={i}
//  className="flex items-start gap-2.5 text-sm"
//  >
//  <span className="text-warning mt-0.5">•</span>
//  {tip}
//  </li>
//  ))}
//  </ul>
//  </div>
//  );
// }

// // ── Page ─────────────────────────────────────────────────────────────────────

// function VoiceStudyPage() {
//  const [isListening, setIsListening] = useState(false);
//  const [transcriptOpen, setTranscriptOpen] = useState(true);
//  const [materialSwitchOpen, setMaterialSwitchOpen] = useState(false);

//  return (
//  <div className="min-h-screen flex flex-col">
//  <Navbar />

//  <main className="flex-1 container w-full px-6 py-10">
//  {/* Header */}
//  <div className="flex items-start justify-between mb-8 gap-4">
//  <div>
//  <h3>Voice Study Mode</h3>
//  <p className="text-sm pt-1">
//  Learn hands-free with AI-powered audio conversations
//  </p>
//  </div>
//  <div className="flex items-center gap-2 shrink-0">
//  <Button
//  variant="outline"
//  size="sm"
//  leftIcon={<span className="text-xs">❓</span>}
//  >
//  Voice Commands
//  </Button>
//  <Button
//  variant="outline"
//  size="sm"
//  leftIcon={
//  <SVGIcon name="message-square"size={13} strokeWidth={1.5} />
//  }
//  >
//  Text Mode
//  </Button>
//  </div>
//  </div>

//  <div className="flex flex-col gap-4">
//  <CurrentMaterialCard />

//  <VoicePanel
//  isListening={isListening}
//  onToggle={() => setIsListening((v) => !v)}
//  />

//  <CollapsibleSection
//  title="Conversation Transcript"
//  icon={<SVGIcon name="file"size={14} style={{ color:"black"}} />}
//  open={transcriptOpen}
//  onToggle={() => setTranscriptOpen((v) => !v)}
//  >
//  <TranscriptEmptyState />
//  </CollapsibleSection>

//  <CollapsibleSection
//  title="Quick Material Switch"
//  open={materialSwitchOpen}
//  onToggle={() => setMaterialSwitchOpen((v) => !v)}
//  >
//  <QuickMaterialList />
//  </CollapsibleSection>

//  <VoiceStudyTipsCard />
//  </div>
//  </main>
//  </div>
//  );
// }

// export default VoiceStudyPage;
