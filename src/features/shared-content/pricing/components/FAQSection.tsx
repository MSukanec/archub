import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { pricingFAQs } from "../data/faqs";

export function FAQSection() {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  return (
    <div className="mt-20 max-w-3xl mx-auto">
      <h2 className="text-3xl font-bold text-center mb-10 text-[var(--text-default)]">
        Preguntas Frecuentes
      </h2>
      
      <div className="space-y-3">
        {pricingFAQs.map((faq, idx) => (
          <div 
            key={idx}
            className="border border-[var(--border-default)] rounded-lg overflow-hidden"
          >
            <button
              onClick={() => setOpenIndex(openIndex === idx ? null : idx)}
              className="w-full px-6 py-4 flex items-center justify-between text-left hover:bg-[var(--bg-muted)] transition-colors"
              data-testid={`faq-toggle-${idx}`}
            >
              <span className="text-sm font-medium text-[var(--text-default)]">
                {faq.q}
              </span>
              <ChevronDown 
                className={cn(
                  "h-4 w-4 text-[var(--text-muted)] transition-transform",
                  openIndex === idx && "rotate-180"
                )}
              />
            </button>
            {openIndex === idx && (
              <div className="px-6 pb-4 text-sm text-[var(--text-muted)] leading-relaxed">
                {typeof faq.a === 'function' ? faq.a() : faq.a}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
