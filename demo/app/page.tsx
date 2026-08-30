import Link from "next/link";
import { BrandLogo } from "@/components/ui";

export default function Page() {
  const demos = [
    { href: "/demo1", label: "Demo 1", title: "The patient app",
      body: "The original 27-screen patient journey — booking, intake, exam, results, purchase.",
      tag: "Patient only" },
    { href: "/demo2", label: "Demo 2", title: "The four-persona app",
      body: "Patient, CMA, audiologist and operator on one synchronized record. Guided story or enter as one persona.",
      tag: "All four roles" },
  ];
  return (
    <main className="grid min-h-[100dvh] place-items-center bg-brand-bg px-6 py-10">
      <div className="w-full max-w-3xl">
        <div className="mb-9 flex justify-center"><BrandLogo /></div>
        <h1 className="text-center text-[32px] font-extrabold leading-tight tracking-[-.03em] text-brand-navy">
          Two demos
        </h1>
        <div className="mt-8 grid gap-4 sm:grid-cols-2">
          {demos.map(d => (
            <Link key={d.href} href={d.href}
              className="rounded-[24px] border border-[#e4eef0] bg-white p-6 shadow-card transition hover:border-brand-teal">
              <span className="text-[10px] font-extrabold uppercase tracking-[.2em] text-brand-teal">{d.label}</span>
              <h2 className="mt-2 text-xl font-extrabold text-brand-navy">{d.title}</h2>
              <p className="mt-3 text-sm leading-6 text-slate-500">{d.body}</p>
              <span className="mt-4 inline-block rounded-full bg-[#f0f6f6] px-3 py-1 text-[11px] font-bold text-slate-500">
                {d.tag}
              </span>
            </Link>
          ))}
        </div>
        <p className="mt-9 text-center text-[11px] leading-5 text-slate-400">
          Everything in both demos is fictional — names, images, readings and figures.
        </p>
      </div>
    </main>
  );
}
