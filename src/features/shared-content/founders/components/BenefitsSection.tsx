import { Card, CardContent } from "@/components/ui/card";
import { benefits } from "../data/benefits";
export function BenefitsSection() {
  return (
    <section className="py-20 bg-card -mx-6" data-testid="section-benefits">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-6">
            Beneficios Exclusivos
          </h2>
          <p className="text-xl max-w-3xl mx-auto text-muted-foreground">
            8 beneficios únicos que solo los miembros fundadores disfrutarán
          </p>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {benefits.map((benefit, index) => (
            <Card
              key={index}
              className="group transition-all duration-200 hover:scale-105 border bg-background"
              data-testid={`card-benefit-${index + 1}`}
            >
              <CardContent className="p-6">
                <div className="mb-4">
                  <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                    <benefit.icon className="h-6 w-6 text-primary" />
                  </div>
                </div>
                <h3 className="text-lg font-semibold mb-3">
                  {benefit.title}
                </h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {benefit.description}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}
