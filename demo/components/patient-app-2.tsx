"use client";
import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { ScreenId, order } from "./screens/registry";
import { BottomNav } from "./screens/shared";
import { beatForScreen, beatIndexById, type AnyScreenId } from "@/lib/story";
import { useStory } from "./shell/story-context";
import { Welcome, SignIn, HomeScreen } from "./screens/patient/welcome";
import { IntakeFor, IntakeNeeds, IntakeMedical, IntakeCoverage, IntakePlan } from "./screens/patient/intake";
import { BookDate, BookTime, Payment, Confirmed } from "./screens/patient/booking";
import { Assigned, Driving, Arrived } from "./screens/patient/dispatch";
import { Consent, Setup, Otoscopy, Tympanometry, Testing, Live } from "./screens/patient/exam";
import { Review, Results, Recommendation } from "./screens/patient/results";
import { Compare, Checkout, Signing, Order } from "./screens/patient/commerce";
import { Support } from "./screens/patient/support";

/** Whether the guided script has a beat that shows this patient screen. */
function onScript(s: ScreenId) {
  return beatForScreen("patient", s) !== -1;
}

/**
 * The patient's view. State comes from the shared beat pointer rather than
 * local useState, and there is no navigator aside — the shell replaces it.
 */
export function PatientApp2() {
  const { screen, beat, goToScreen, advanceInRole } = useStory();
  /**
   * The guided script narrates four of stage 2's nine screens, so the other
   * five — the rest of intake, and both booking steps — have no beat of their
   * own. The shared pointer cannot address them, so the patient app remembers
   * an off-script detour itself and hands control back the moment the viewer
   * rejoins the script.
   */
  const [detour, setDetour] = useState<{ screen: ScreenId; from: AnyScreenId } | null>(null);
  // The shell can move the story itself (Next, the timeline, a role switch).
  // That always wins: a detour only holds while the pointer sits where it was.
  const active = detour && detour.from === screen ? detour.screen : null;
  const current = (active ?? screen) as ScreenId;

  /**
   * A button on Alex's phone is Alex acting on his own device, so it moves
   * time but never hands the view to someone else.
   *
   * This used to call the shell's `next()` for a forward step, which adopts
   * the landing beat's lead role: tapping "Simulate visit day" put the viewer
   * on Maya's tablet mid-tap (owner, 2026-09-01). Handoffs belong to the
   * chrome — the top Next, the timeline and the role tabs still tell the
   * cross-persona story.
   *
   * Both modes behave identically now; there is no reason a click inside a
   * device should mean different things depending on how the demo was entered.
   */
  const go = (s: ScreenId) => {
    // A screen the script never narrates can only be shown as a detour.
    if (!onScript(s)) return setDetour({ screen: s, from: screen });
    setDetour(null);
    // A forward step to the next screen in registry order walks this role's
    // own beats, so a stretch where only other personas act is crossed in one
    // press instead of stranding the viewer on an unchanged screen.
    const isNextStep = order.indexOf(s) === order.indexOf(current) + 1;
    if (isNextStep) advanceInRole();
    else goToScreen(s);
  };

  const back = () => {
    const i = order.indexOf(current);
    const target = order[Math.max(0, i - 1)];
    if (!onScript(target)) return setDetour({ screen: target, from: screen });
    setDetour(null);
    goToScreen(target);
  };

  const screens = useMemo(() => ({
    welcome: <Welcome go={go}/>,
    signin: <SignIn go={go} back={back}/>,
    // The visit is only booked once the story has passed the confirmation beat.
    home: <HomeScreen go={go} booked={beat >= beatIndexById("confirmed")}/>,
    "intake-for": <IntakeFor go={go} back={back}/>,
    "intake-needs": <IntakeNeeds go={go} back={back}/>,
    "intake-medical": <IntakeMedical go={go} back={back}/>,
    "intake-coverage": <IntakeCoverage go={go} back={back}/>,
    "intake-plan": <IntakePlan go={go} back={back}/>,
    "book-date": <BookDate go={go} back={back}/>,
    "book-time": <BookTime go={go} back={back}/>,
    payment: <Payment go={go} back={back}/>,
    confirmed: <Confirmed go={go} back={back}/>,
    assigned: <Assigned go={go} back={back}/>,
    // These seven screens cover a clinical act someone else performs (Maya,
    // then Dr. Reed) — the patient is present and watching, not operating, so
    // the patient's screen carries no button for it: each shows a status
    // line instead, and the chrome's Next carries the story forward. Consent
    // is the one exception, deliberately: consent is the patient's own act.
    driving: <Driving go={go} back={back}/>,
    arrived: <Arrived go={go} back={back}/>,
    consent: <Consent go={go} back={back}/>,
    setup: <Setup go={go} back={back}/>,
    otoscopy: <Otoscopy go={go} back={back}/>,
    tympanometry: <Tympanometry go={go} back={back}/>,
    testing: <Testing go={go} back={back}/>,
    live: <Live go={go} back={back}/>,
    review: <Review go={go} back={back}/>,
    results: <Results go={go} back={back}/>,
    recommendation: <Recommendation go={go} back={back}/>,
    compare: <Compare go={go} back={back}/>,
    checkout: <Checkout go={go} back={back}/>,
    signing: <Signing go={go} back={back}/>,
    order: <Order go={go} back={back}/>,
    support: <Support go={go} back={back}/>,
    // `go` closes over the beat, so the cached elements must be rebuilt when
    // it moves — not only when the screen id changes.
  } as Record<ScreenId, React.ReactNode>), [current, beat, screen]);

  return (
    <main>
      <motion.div key={current} initial={{ opacity: 0, x: 14 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: .2 }}>
        {screens[current]}
      </motion.div>
      <BottomNav current={current} go={go}/>
    </main>
  );
}
