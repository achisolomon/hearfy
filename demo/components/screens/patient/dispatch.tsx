"use client";
import { Star } from "lucide-react";
import { Card,PageHeader,PrimaryButton,SecondaryButton,StatusPill } from "../../ui";
import { cma } from "@/lib/mock-data";
import { ScreenId } from "../registry";
import { Shell, Avatar, RouteMap, AudiologistStatusLine } from "../shared";

export function Assigned({go,back}:{go:(s:ScreenId)=>void;back:()=>void}){return <Shell><PageHeader title="Maya is assigned" subtitle="Your care team is ready for your visit." onBack={back} eyebrow="Visit status"/><RouteMap/><Card className="mt-4 p-4 text-brand-navy"><div className="flex flex-wrap items-center gap-3"><Avatar/><div className="min-w-0 flex-1"><b>{cma.name}</b><p className="text-xs text-slate-500">Certified Medical Assistant</p><p className="mt-1 flex items-center gap-1 text-xs"><Star size={13} fill="currentColor"/> 4.9 · 128 visits</p></div><StatusPill tone="green">Confirmed</StatusPill></div><div className="mt-4 grid grid-cols-2 gap-2"><SecondaryButton>Message</SecondaryButton><SecondaryButton>Call</SecondaryButton></div></Card><div className="mt-4"><PrimaryButton onClick={()=>go("driving")}>Simulate visit day</PrimaryButton></div></Shell>}
// `observing` is opt-in and defaults to false: Demo 1's frozen patient-app.tsx
// never passes it, so it keeps rendering exactly today's button. Demo 2 sets
// it true because the owner's rule is that the patient's phone offers no
// control for an act someone else performs — here, Maya arriving. The
// subtitle already says "We'll notify you when she arrives", so no extra
// status line is added; the button is simply dropped.
export function Driving({go,back,observing=false}:{go:(s:ScreenId)=>void;back:()=>void;observing?:boolean}){return <Shell><PageHeader title="Maya is on the way" subtitle="We’ll notify you when she arrives." onBack={back} eyebrow="Live tracking"/><RouteMap moving/><Card className="mt-4 p-5 text-brand-navy"><span className="text-xs font-bold uppercase tracking-widest text-teal-ink">Estimated arrival</span><div className="mt-1 flex items-end justify-between"><b className="text-4xl">12 <span className="text-lg">min</span></b><span className="text-xs text-slate-500">8.4 miles away</span></div></Card>{!observing&&<div className="mt-4"><PrimaryButton onClick={()=>go("arrived")}>Maya has arrived</PrimaryButton></div>}</Shell>}
// Same opt-in shape as Driving. Starting the visit is Maya's act, not Alex's;
// under `observing` the button is replaced with a status line naming who
// acts next, matching AudiologistStrip's visual language elsewhere in this flow.
export function Arrived({go,back,observing=false}:{go:(s:ScreenId)=>void;back:()=>void;observing?:boolean}){return <Shell><PageHeader title="Maya has arrived" subtitle="She’ll let you know when it’s time to begin." onBack={back} eyebrow="At your home"/><div className="rounded-[28px] bg-gradient-to-br from-[#16426c] to-[#0c2340] p-7 text-center text-white"><Avatar large/><h2 className="mt-4 text-2xl font-extrabold">Welcome Maya</h2><p className="mt-2 text-sm text-white/65">Please confirm the visitor photo and name before opening the door.</p></div><Card className="mt-4 p-5 text-brand-navy"><div className="flex justify-between"><span className="text-sm text-slate-500">Visit ID</span><b>HM-0521-1092</b></div><div className="mt-3 flex justify-between"><span className="text-sm text-slate-500">Kit ID</span><b>KIT-MIA-014</b></div></Card>{observing?<AudiologistStatusLine className="mt-4">Maya will start the visit when you’re ready.</AudiologistStatusLine>:<div className="mt-4"><PrimaryButton onClick={()=>go("consent")}>Start the visit</PrimaryButton></div>}</Shell>}
