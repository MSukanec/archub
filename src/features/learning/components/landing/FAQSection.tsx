import { useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import type { CourseFaq } from '@shared/schema';
import { SectionHeader } from './SectionHeader';

interface FAQSectionProps {
  faqs: CourseFaq[];
  title?: string;
  subtitle?: string;
  description?: string;
}

export function FAQSection({ 
  faqs,
  title = "PREGUNTAS FRECUENTES",
  subtitle = "DUDAS COMUNES",
  description = "Resolvemos tus dudas sobre el curso"
}: FAQSectionProps) {
  const [openFaq, setOpenFaq] = useState<string | null>(null);

  if (faqs.length === 0) return null;

  return (
    <section className="py-16 sm:py-20">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-0">
          <div className="lg:col-span-3 space-y-12">
            <SectionHeader
              title={title}
              subtitle={subtitle}
              description={description}
            />

            <div className="space-y-4">
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
          
          {/* Empty Space - 1/4 of width for sticky to pass over */}
          <div className="hidden lg:block" />
        </div>
      </div>
    </section>
  );
}
