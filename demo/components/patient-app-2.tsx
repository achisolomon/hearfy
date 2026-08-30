"use client";
import { useMemo } from "react";
import { motion } from "framer-motion";
import { ScreenId, order } from "./screens/registry";
import { BottomNav } from "./screens/shared";
import { useStory } from "./shell/story-context";
import { Welcome, SignIn, HomeScreen } from "./screens/patient/welcome";
import { IntakeFor, IntakeNeeds, IntakeMedical, IntakeCoverage, IntakePlan } from "./screens/patient/intake";
import { BookDate, BookTime, Payment, Confirmed } from "./screens/patient/booking";
import { Assigned, Driving, Arrived } from "./screens/patient/dispatch";
import { Consent, Setup, Otoscopy, Testing, Live } from "./screens/patient/exam";
import { Review, Results, Recommendation } from "./screens/patient/results";
import { Compare, Checkout, Order } from "./screens/patient/commerce";
import { Support } from "./screens/patient/support";

/**
 * Demo 2's patient view. Same screens as Demo 1, different state source: the
 * shared beat pointer instead of local useState, and no navigator aside — the
 * shell replaces it. Demo 1's patient-app.tsx stays frozen.
 */
export function PatientApp2() {
  const { screen, goToScreen } = useStory();
  const current = screen as ScreenId;

  // Free navigation inside the role moves the shared pointer.
  const go = (s: ScreenId) => goToScreen(s);
  const back = () => {
    const i = order.indexOf(current);
    goToScreen(order[Math.max(0, i - 1)]);
  };

  const screens = useMemo(() => ({
    welcome: <Welcome go={go}/>,
    signin: <SignIn go={go} back={back}/>,
    home: <HomeScreen go={go}/>,
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
    driving: <Driving go={go} back={back}/>,
    arrived: <Arrived go={go} back={back}/>,
    consent: <Consent go={go} back={back}/>,
    setup: <Setup go={go} back={back}/>,
    otoscopy: <Otoscopy go={go} back={back}/>,
    testing: <Testing go={go} back={back}/>,
    live: <Live go={go} back={back}/>,
    review: <Review go={go} back={back}/>,
    results: <Results go={go} back={back}/>,
    recommendation: <Recommendation go={go} back={back}/>,
    compare: <Compare go={go} back={back}/>,
    checkout: <Checkout go={go} back={back}/>,
    order: <Order go={go} back={back}/>,
    support: <Support go={go} back={back}/>,
  } as Record<ScreenId, React.ReactNode>), [current]);

  return (
    <main>
      <motion.div key={current} initial={{ opacity: 0, x: 14 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: .2 }}>
        {screens[current]}
      </motion.div>
      <BottomNav current={current} go={go}/>
    </main>
  );
}
