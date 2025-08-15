import { useState } from "react";
import { Layout } from '@/components/layout/desktop/Layout';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Package } from "lucide-react";
import { SubcontractList } from "./SubcontractList";
import { SubcontractPayments } from "./SubcontractPayments";

export default function ConstructionSubcontracts() {
  const [activeTab, setActiveTab] = useState("lista");

  const headerProps = {
    icon: Package,
    title: "Subcontratos"
  };

  return (
    <Layout headerProps={headerProps}>
      <div className="h-full flex flex-col">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col">
          <TabsList className="grid w-full grid-cols-2 mb-6">
            <TabsTrigger value="lista">Lista</TabsTrigger>
            <TabsTrigger value="pagos">Pagos</TabsTrigger>
          </TabsList>
          
          <TabsContent value="lista" className="flex-1 mt-0">
            <SubcontractList />
          </TabsContent>
          
          <TabsContent value="pagos" className="flex-1 mt-0">
            <SubcontractPayments />
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
}