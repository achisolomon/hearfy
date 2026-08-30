"use client";
import { Card } from "../../ui";
import { pipeline } from "@/lib/mock-data";

export function Pipeline() {
  const max = Math.max(...pipeline.map(p => p.count));
  return (
    <Card className="p-5">
      <b className="text-sm">Pipeline — every patient, every stage</b>
      <div className="mt-4 grid grid-cols-3 gap-3 sm:grid-cols-5 lg:grid-cols-9">
        {pipeline.map(p => (
          <div key={p.stage} className="text-center">
            <div className="flex h-24 items-end justify-center">
              <div className="w-7 rounded-t-lg bg-brand-teal"
                   style={{ height: `${Math.max(8, (p.count / max) * 100)}%` }} />
            </div>
            <b className="mt-2 block text-sm">{p.count}</b>
            <span className="block text-[10px] leading-tight text-slate-400">{p.stage}. {p.name}</span>
          </div>
        ))}
      </div>
    </Card>
  );
}
