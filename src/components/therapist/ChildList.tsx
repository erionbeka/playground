import { useState } from "react";
import { useApp, Child, FamilyMember } from "@/context/AppContext";
import { motion, AnimatePresence } from "framer-motion";

export default function ChildList() {
  const { children, addChild, removeChild, updateChild, assignments } = useApp();
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState("");
  const [age, setAge] = useState("6");
  const [avatar, setAvatar] = useState("🧒");
  const [notes, setNotes] = useState("");
  const [diagnosis, setDiagnosis] = useState("");

  // Family member form
  const [addingFamilyTo, setAddingFamilyTo] = useState<string | null>(null);
  const [fmName, setFmName] = useState("");
  const [fmRelationship, setFmRelationship] = useState<FamilyMember["relationship"]>("parent");
  const [fmAvatar, setFmAvatar] = useState("👩");

  const avatars = ["🧒", "👦", "👧", "👶", "🧒🏽", "👦🏻", "👧🏾", "🧒🏿"];
  const fmAvatars = ["👩", "👨", "👧", "👦", "👵", "👴", "👩🏽", "👨🏾"];

  const relationshipLabels: Record<string, string> = {
    parent: "Parent",
    sibling: "Sibling",
    grandparent: "Grandparent",
    "aunt-uncle": "Aunt/Uncle",
    other: "Other",
  };

  const handleAdd = () => {
    if (!name.trim()) return;
    addChild({ name: name.trim(), age: parseInt(age), avatar, notes, diagnosis, familyMembers: [] });
    setName(""); setAge("6"); setAvatar("🧒"); setNotes(""); setDiagnosis("");
    setShowForm(false);
  };

  const handleAddFamily = (childId: string) => {
    if (!fmName.trim()) return;
    const child = children.find((c) => c.id === childId);
    if (!child) return;
    const newFm: FamilyMember = { id: `fm-${Date.now()}`, name: fmName.trim(), relationship: fmRelationship, avatar: fmAvatar };
    updateChild(childId, { familyMembers: [...child.familyMembers, newFm] });
    setFmName(""); setFmRelationship("parent"); setFmAvatar("👩");
    setAddingFamilyTo(null);
  };

  const removeFamilyMember = (childId: string, fmId: string) => {
    const child = children.find((c) => c.id === childId);
    if (!child) return;
    updateChild(childId, { familyMembers: child.familyMembers.filter((fm) => fm.id !== fmId) });
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="font-display text-lg font-bold text-foreground">My Children ({children.length})</h2>
        <button onClick={() => setShowForm(!showForm)} className="bg-primary text-primary-foreground px-4 py-2 rounded-lg font-semibold text-sm touch-target">
          {showForm ? "Cancel" : "+ Add Child"}
        </button>
      </div>

      <AnimatePresence>
        {showForm && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="bg-muted rounded-xl p-4 mb-6 overflow-hidden">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-semibold text-foreground block mb-1">Name</label>
                <input value={name} onChange={(e) => setName(e.target.value)} className="w-full rounded-lg border border-border bg-card px-3 py-2 text-foreground" placeholder="Child's name" />
              </div>
              <div>
                <label className="text-sm font-semibold text-foreground block mb-1">Age</label>
                <input type="number" value={age} onChange={(e) => setAge(e.target.value)} className="w-full rounded-lg border border-border bg-card px-3 py-2 text-foreground" min="2" max="18" />
              </div>
              <div>
                <label className="text-sm font-semibold text-foreground block mb-1">Diagnosis</label>
                <select value={diagnosis} onChange={(e) => setDiagnosis(e.target.value)} className="w-full rounded-lg border border-border bg-card px-3 py-2 text-foreground">
                  <option value="">Select...</option>
                  <option value="ASD Level 1">ASD Level 1</option>
                  <option value="ASD Level 2">ASD Level 2</option>
                  <option value="ASD Level 3">ASD Level 3</option>
                  <option value="ADHD">ADHD</option>
                  <option value="ASD + ADHD">ASD + ADHD</option>
                  <option value="Other">Other</option>
                </select>
              </div>
              <div>
                <label className="text-sm font-semibold text-foreground block mb-1">Avatar</label>
                <div className="flex gap-2 flex-wrap">
                  {avatars.map((a) => (
                    <button key={a} onClick={() => setAvatar(a)} className={`text-2xl p-1 rounded-lg transition-colors ${avatar === a ? "bg-primary/20 ring-2 ring-primary" : ""}`}>{a}</button>
                  ))}
                </div>
              </div>
              <div className="col-span-2">
                <label className="text-sm font-semibold text-foreground block mb-1">Notes</label>
                <input value={notes} onChange={(e) => setNotes(e.target.value)} className="w-full rounded-lg border border-border bg-card px-3 py-2 text-foreground" placeholder="Preferences, sensory needs, strengths..." />
              </div>
            </div>
            <button onClick={handleAdd} className="mt-4 bg-secondary text-secondary-foreground px-6 py-2 rounded-lg font-semibold text-sm touch-target">
              Save Child
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {children.map((child) => {
          const childAssignments = assignments.filter((a) => a.childId === child.id);
          const pending = childAssignments.filter((a) => a.status === "pending").length;
          const completed = childAssignments.filter((a) => a.status === "completed").length;
          const homeworkCount = childAssignments.filter((a) => a.type === "homework").length;
          const classworkCount = childAssignments.filter((a) => a.type === "classwork").length;

          return (
            <motion.div key={child.id} initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="bg-card border border-border rounded-xl p-5 shadow-sm">
              <div className="flex items-center gap-3 mb-3">
                <span className="text-4xl">{child.avatar}</span>
                <div>
                  <h3 className="font-display font-bold text-foreground">{child.name}</h3>
                  <p className="text-sm text-muted-foreground">Age {child.age}</p>
                  {child.diagnosis && <p className="text-xs text-primary font-semibold">{child.diagnosis}</p>}
                </div>
              </div>
              {child.notes && <p className="text-sm text-muted-foreground mb-3 italic">"{child.notes}"</p>}

              <div className="flex gap-2 text-xs flex-wrap mb-3">
                <span className="bg-accent/20 text-accent-foreground px-2 py-1 rounded-full">{pending} pending</span>
                <span className="bg-secondary/20 text-foreground px-2 py-1 rounded-full">{completed} completed</span>
                <span className="bg-primary/10 text-foreground px-2 py-1 rounded-full">📝 {homeworkCount}</span>
                <span className="bg-primary/10 text-foreground px-2 py-1 rounded-full">🏥 {classworkCount}</span>
              </div>

              {/* Family Members */}
              <div className="border-t border-border pt-3">
                <p className="text-xs font-semibold text-foreground mb-2">👨‍👩‍👧‍👦 Family Members</p>
                <div className="space-y-1 mb-2">
                  {child.familyMembers.map((fm) => (
                    <div key={fm.id} className="flex items-center justify-between text-xs bg-muted rounded-lg px-2 py-1">
                      <span>{fm.avatar} {fm.name} <span className="text-muted-foreground">({relationshipLabels[fm.relationship]})</span></span>
                      <button onClick={() => removeFamilyMember(child.id, fm.id)} className="text-destructive hover:underline text-[10px]">✕</button>
                    </div>
                  ))}
                  {child.familyMembers.length === 0 && <p className="text-xs text-muted-foreground">No family members added</p>}
                </div>

                {addingFamilyTo === child.id ? (
                  <div className="bg-muted rounded-lg p-2 space-y-2">
                    <input value={fmName} onChange={(e) => setFmName(e.target.value)} className="w-full rounded border border-border bg-card px-2 py-1 text-xs text-foreground" placeholder="Name" />
                    <select value={fmRelationship} onChange={(e) => setFmRelationship(e.target.value as FamilyMember["relationship"])} className="w-full rounded border border-border bg-card px-2 py-1 text-xs text-foreground">
                      <option value="parent">Parent</option>
                      <option value="sibling">Sibling</option>
                      <option value="grandparent">Grandparent</option>
                      <option value="aunt-uncle">Aunt/Uncle</option>
                      <option value="other">Other</option>
                    </select>
                    <div className="flex gap-1">
                      {fmAvatars.map((a) => (
                        <button key={a} onClick={() => setFmAvatar(a)} className={`text-lg p-0.5 rounded ${fmAvatar === a ? "ring-2 ring-primary" : ""}`}>{a}</button>
                      ))}
                    </div>
                    <div className="flex gap-2">
                      <button onClick={() => handleAddFamily(child.id)} className="bg-primary text-primary-foreground px-3 py-1 rounded text-xs font-semibold">Add</button>
                      <button onClick={() => setAddingFamilyTo(null)} className="text-xs text-muted-foreground">Cancel</button>
                    </div>
                  </div>
                ) : (
                  <button onClick={() => setAddingFamilyTo(child.id)} className="text-xs text-primary hover:underline font-semibold">+ Add Family Member</button>
                )}
              </div>

              <button onClick={() => removeChild(child.id)} className="mt-3 text-xs text-destructive hover:underline">
                Remove Child
              </button>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
