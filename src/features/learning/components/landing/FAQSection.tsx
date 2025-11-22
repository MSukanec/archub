import { useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import type { CourseFaq } from '@shared/schema';

interface FAQSectionProps {
  faqs: CourseFaq[];
}

export function FAQSection({ faqs }: FAQSectionProps) {
  const [openFaq, setOpenFaq] = useState<string | null>(null);

  if (faqs.length === 0) return null;

  return (
    <section className="py-16 sm:py-20 bg-muted/30">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-3xl sm:text-4xl font-bold tracking-tight mb-4">
            Preguntas Frecuentes
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Resolvemos tus dudas sobre el curso
          </p>
        </div>

        <div className="max-w-3xl mx-auto space-y-4">
          {faqs.map((faq) => {
            const isOpen = openFaq === faq.id;
            return (
              <Collapsible
                key={faq.id}
                open={isOpen}
                onOpenChange={() => setOpenFaq(isOpen ? null : faq.id)}
              >
                <div className="bg-background rounded-lg border shadow-sm">
                  <CollapsibleTrigger asChild>
                    <Button
                      variant="ghost"
                      className="w-full px-6 py-5 h-auto flex items-center justify-between hover:bg-muted/50"
                    >
                      <h3 className="text-left font-semibold text-base flex-1">
                        {faq.question}
                      </h3>
                      {isOpen ? (
                        <ChevronUp className="w-5 h-5 text-muted-foreground flex-shrink-0 ml-4" />
                      ) : (
                        <ChevronDown className="w-5 h-5 text-muted-foreground flex-shrink-0 ml-4" />
                      )}
                    </Button>
                  </CollapsibleTrigger>

                  <CollapsibleContent>
                    <div className="px-6 pb-5 pt-2 border-t">
                      <p className="text-muted-foreground leading-relaxed">
                        {faq.answer}
                      </p>
                    </div>
                  </CollapsibleContent>
                </div>
              </Collapsible>
            );
          })}
        </div>
      </div>
    </section>
  );
}
