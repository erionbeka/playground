import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { useApp } from "@/context/AppContext";
import { getGameById } from "@/data/games";
import GamePlayer from "../game/GamePlayer";

export default function ParentDashboard() {
  const { setRole, children, assignments, selectedChildId, setSelectedChildId, currentAssignment, setCurrentAssignment } = useApp();
  const [playingGameId, setPlayingGameId] = useState<string | null>(null);
  const [signedInFamilyMemberId, setSignedInFamilyMemberId] = useState<string | null>(null);
  const [phoneNumber, setPhoneNumber] = useState("");
  const [password, setPassword] = useState("");
  const [signInError, setSignInError] = useState("");

  const familyProfiles = useMemo(
    () =>
      children.flatMap((child) =>
        child.familyMembers.map((familyMember) => ({
          child,
          familyMember,
        }))
      ),
    [children]
  );

  const child = useMemo(
    () => children.find((candidate) => candidate.id === selectedChildId),
    [children, selectedChildId]
  );

  const signedInFamilyMember = useMemo(
    () => child?.familyMembers.find((familyMember) => familyMember.id === signedInFamilyMemberId) || null,
    [child, signedInFamilyMemberId]
  );

  const childAssignments = useMemo(
    () => assignments.filter((assignment) => assignment.childId === selectedChildId && assignment.type === "homework"),
    [assignments, selectedChildId]
  );

  const pendingAssignments = useMemo(
    () => childAssignments.filter((assignment) => assignment.status !== "completed"),
    [childAssignments]
  );

  const completedAssignments = useMemo(
    () => childAssignments.filter((assignment) => assignment.status === "completed"),
    [childAssignments]
  );

  const childPersonalization = useMemo(
    () => (child?.notes ? `${child.name} ${child.notes.toLowerCase()}` : null),
    [child]
  );

  const resetFamilySession = () => {
    setSelectedChildId(null);
    setCurrentAssignment(null);
    setSignedInFamilyMemberId(null);
    setPhoneNumber("");
    setPassword("");
    setSignInError("");
  };

  if (!selectedChildId) {
    return (
      <div className="flex min-h-screen items-center justify-center p-4 sm:p-6">
        <div className="w-full max-w-md">
          <button onClick={() => setRole("none")} className="absolute left-4 top-4 text-sm text-muted-foreground hover:text-foreground touch-target">
            Back
          </button>

          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-3xl border border-white/35 bg-card/82 p-6 shadow-[0_24px_70px_rgba(21,31,56,0.16)] backdrop-blur-xl sm:p-8"
          >
            <div className="mb-8 text-center">
              <h1 className="mb-2 font-display text-3xl font-extrabold text-foreground">Family Sign In</h1>
              <p className="text-sm text-muted-foreground sm:text-base">Sign in with your phone number and password to open your child&apos;s activities.</p>
            </div>

            <form
              className="space-y-4"
              onSubmit={(event) => {
                event.preventDefault();

                const normalizedPhoneNumber = phoneNumber.replace(/\D/g, "");
                const match = familyProfiles.find(
                  ({ familyMember }) =>
                    familyMember.phoneNumber.replace(/\D/g, "") === normalizedPhoneNumber &&
                    familyMember.password === password
                );

                if (!match) {
                  setSignInError("We couldn't sign you in. Check the phone number and password and try again.");
                  return;
                }

                setSignInError("");
                setSignedInFamilyMemberId(match.familyMember.id);
                setSelectedChildId(match.child.id);
              }}
            >
              <div className="space-y-2">
                <label htmlFor="phone-number" className="block text-sm font-semibold text-foreground">
                  Phone number
                </label>
                <input
                  id="phone-number"
                  value={phoneNumber}
                  onChange={(event) => {
                    setPhoneNumber(event.target.value);
                    if (signInError) setSignInError("");
                  }}
                  inputMode="tel"
                  autoComplete="tel"
                  placeholder="555-0101"
                  className="h-12 w-full rounded-xl border border-border bg-background/85 px-4 text-base text-foreground outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
                />
              </div>

              <div className="space-y-2">
                <label htmlFor="family-password" className="block text-sm font-semibold text-foreground">
                  Password
                </label>
                <input
                  id="family-password"
                  type="password"
                  value={password}
                  onChange={(event) => {
                    setPassword(event.target.value);
                    if (signInError) setSignInError("");
                  }}
                  autoComplete="current-password"
                  placeholder="Enter password"
                  className="h-12 w-full rounded-xl border border-border bg-background/85 px-4 text-base text-foreground outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
                />
              </div>

              {signInError ? <p className="text-sm text-destructive">{signInError}</p> : null}

              <button
                type="submit"
                className="touch-target w-full rounded-xl bg-primary px-4 py-3 font-semibold text-primary-foreground shadow-[0_16px_40px_rgba(77,170,206,0.28)] transition hover:brightness-105"
              >
                Sign In
              </button>
            </form>

            <div className="mt-6 rounded-2xl border border-border/70 bg-background/45 p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">Demo logins</p>
              <div className="mt-3 space-y-2 text-sm text-muted-foreground">
                <p>555-0101 / emma123</p>
                <p>555-0201 / liam123</p>
                <p>555-0301 / sofia123</p>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    );
  }

  if (playingGameId && currentAssignment) {
    return (
      <GamePlayer
        gameId={playingGameId}
        assignment={currentAssignment}
        onComplete={() => {
          setPlayingGameId(null);
          setCurrentAssignment(null);
        }}
      />
    );
  }

  return (
    <div className="min-h-screen">
      <header className="flex items-center justify-between border-b border-border bg-card/85 px-4 py-4 backdrop-blur-md sm:px-6">
        <div className="flex items-center gap-3">
          <button onClick={resetFamilySession} className="touch-target text-sm text-muted-foreground hover:text-foreground">
            Back
          </button>
          <span className="text-2xl">{child?.avatar}</span>
          <div>
            <h1 className="font-display text-xl font-bold text-foreground">{child?.name}&apos;s Activities</h1>
            {signedInFamilyMember ? (
              <p className="text-xs text-muted-foreground">
                Signed in as {signedInFamilyMember.avatar} {signedInFamilyMember.name}
              </p>
            ) : child?.familyMembers && child.familyMembers.length > 0 ? (
              <p className="text-xs text-muted-foreground">
                Family: {child.familyMembers.map((familyMember) => `${familyMember.avatar} ${familyMember.name}`).join(" - ")}
              </p>
            ) : null}
          </div>
        </div>

        <button
          onClick={() => {
            setRole("none");
            resetFamilySession();
          }}
          className="touch-target px-3 text-sm text-muted-foreground hover:text-foreground"
        >
          Exit
        </button>
      </header>

      <div className="mx-auto max-w-3xl p-4 sm:p-6">
        {pendingAssignments.length > 0 ? (
          <div className="mb-8">
            <h2 className="mb-4 font-display text-lg font-bold text-foreground">To Do</h2>
            <div className="space-y-4">
              {pendingAssignments.map((assignment) => {
                const progress = assignment.gameIds.length > 0 ? Math.round((assignment.completedGames.length / assignment.gameIds.length) * 100) : 0;
                const assignedFamilyMember = assignment.assignedFamilyMemberId
                  ? child?.familyMembers.find((familyMember) => familyMember.id === assignment.assignedFamilyMemberId)
                  : null;

                return (
                  <motion.div key={assignment.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="rounded-2xl border border-border bg-card p-5 shadow-sm">
                    <div className="mb-3 flex items-center justify-between">
                      <div>
                        <p className="text-sm text-muted-foreground">Due {assignment.dueDate}</p>
                        <p className="text-sm font-semibold text-foreground">
                          {assignment.gameIds.length} games - {assignment.difficulty} - {assignment.mode === "shared" ? "With Family" : "Solo"}
                        </p>
                        {assignedFamilyMember ? (
                          <p className="mt-1 text-xs font-semibold text-primary">
                            Assigned to: {assignedFamilyMember.avatar} {assignedFamilyMember.name}
                          </p>
                        ) : null}
                      </div>
                      <span className="rounded-full bg-accent/20 px-2 py-1 text-xs font-semibold text-foreground">{progress}% done</span>
                    </div>

                    <div className="mb-4 h-3 w-full rounded-full bg-muted">
                      <div className="h-3 rounded-full bg-primary transition-all" style={{ width: `${progress}%` }} />
                    </div>

                    {assignment.notes ? (
                      <div className="mb-4 rounded-xl bg-muted p-3">
                        <p className="text-xs text-muted-foreground">From therapist:</p>
                        <p className="text-sm text-foreground">{assignment.notes}</p>
                      </div>
                    ) : null}

                    <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                      {assignment.gameIds.map((gameId) => {
                        const game = getGameById(gameId);
                        const done = assignment.completedGames.includes(gameId);

                        return (
                          <button
                            key={gameId}
                            disabled={done}
                            onClick={() => {
                              setCurrentAssignment(assignment);
                              setPlayingGameId(gameId);
                            }}
                            className={`touch-target flex items-center gap-3 rounded-xl border-2 p-3 transition-all ${
                              done ? "bg-secondary/10 border-secondary/30 opacity-60" : "border-border bg-card hover:border-primary hover:shadow-md"
                            }`}
                          >
                            <span className="text-3xl">{game?.emoji || "?"}</span>
                            <div className="flex-1 text-left">
                              <p className="text-sm font-bold text-foreground">{game?.name || gameId}</p>
                              <p className="text-xs text-muted-foreground">{game?.estimatedMinutes || 5} min</p>
                              {done && childPersonalization ? <p className="mt-1 text-xs italic text-muted-foreground">{childPersonalization}</p> : null}
                            </div>
                            {done ? <span className="text-sm font-bold text-secondary">Done</span> : <span className="text-sm font-bold text-primary">Play</span>}
                          </button>
                        );
                      })}
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </div>
        ) : (
          <div className="py-12 text-center">
            <div className="mb-4 text-6xl animate-bounce-gentle">Done</div>
            <h2 className="mb-2 font-display text-2xl font-bold text-foreground">All Done!</h2>
            <p className="text-muted-foreground">No homework pending. Great job!</p>
          </div>
        )}

        {completedAssignments.length > 0 ? (
          <div>
            <h2 className="mb-4 font-display text-lg font-bold text-foreground">Completed</h2>
            <div className="space-y-3">
              {completedAssignments.map((assignment) => (
                <div key={assignment.id} className="rounded-xl border border-secondary/20 bg-secondary/10 p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex gap-2">
                      {assignment.gameIds.map((gameId) => {
                        const game = getGameById(gameId);
                        return (
                          <span key={gameId} className="rounded-full bg-secondary/20 px-2 py-1 text-xs text-foreground">
                            {game?.emoji} {game?.name}
                          </span>
                        );
                      })}
                    </div>
                    <span className="text-xs text-muted-foreground">Completed</span>
                  </div>
                  {childPersonalization ? <p className="mt-3 text-sm italic text-muted-foreground">{childPersonalization}</p> : null}
                </div>
              ))}
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}
