import type { Metadata } from "next";
import { RULES } from "@/lib/site-content";
import {
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
} from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";

export const metadata: Metadata = {
  title: "Rules",
  description: "Server rules — read before joining.",
};

export default function RulesPage() {
  const totalRules = RULES.reduce((sum, cat) => sum + cat.items.length, 0);

  return (
    <div className="mx-auto max-w-3xl px-4 sm:px-6 py-12">
      {/* Header */}
      <div className="mb-10 space-y-3">
        <div className="flex items-baseline gap-3">
          <h1 className="minecraft-title text-xl sm:text-2xl text-[#e8e8e8]">
            Server Rules
          </h1>
          <span className="font-mono text-xs text-[#555] border border-[#2a2a2a] px-2 py-0.5">
            {totalRules} rules
          </span>
        </div>
        <p className="text-sm font-mono text-[#666] leading-relaxed">
          Breaking these rules may result in a kick, temp-ban, or permanent ban
          depending on severity. When in doubt, ask a staff member.
        </p>
      </div>

      {/* Accordion sections */}
      <Accordion className="flex flex-col gap-3">
        {RULES.map((cat, catIdx) => (
          <AccordionItem
            key={cat.category}
            value={cat.category}
            className="border border-[#1e1e1e] bg-[#0f0f0f] not-last:border-b-0 not-last:border-b-[#0f0f0f]"
          >
            <AccordionTrigger className="px-5 py-4 hover:no-underline hover:bg-[#141414] transition-colors">
              <div className="flex items-center gap-3">
                <span className="font-mono text-[10px] text-[#444]">
                  {String(catIdx + 1).padStart(2, "0")}
                </span>
                <span className="font-mono text-sm font-bold text-[#e8e8e8] uppercase tracking-wider">
                  {cat.category}
                </span>
                <span className="font-mono text-[10px] text-[#555] border border-[#2a2a2a] px-1.5 py-0.5">
                  {cat.items.length}
                </span>
              </div>
            </AccordionTrigger>
            <AccordionContent className="px-5">
              <ul className="space-y-3 pt-2 pb-4">
                {cat.items.map((rule, i) => (
                  <li key={i} className="flex items-start gap-3">
                    <span className="mt-1 size-1.5 rounded-full bg-[#4ade80] shrink-0" />
                    <p className="text-sm font-mono text-[#888] leading-relaxed">
                      {rule}
                    </p>
                  </li>
                ))}
              </ul>
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>

      {/* Footer note */}
      <p className="mt-8 text-xs font-mono text-[#444] border-t border-[#1a1a1a] pt-6">
        Rules are subject to change. Continued play on the server constitutes
        acceptance of the current ruleset.
      </p>
    </div>
  );
}
