import { MainLayout } from "@/components/layout/MainLayout";
import { Dashboard } from "@/components/dashboard/Dashboard";
import { SEOHead } from "@/components/seo/SEOHead";

const Index = () => {
  return (
    <>
      <SEOHead
        title="Dashboard"
        description="Painel de controle La Casa Dark CORE. Gerencie seus créditos, veja métricas e acesse todas as ferramentas."
        noindex={true}
      />
      <MainLayout>
        <Dashboard />
      </MainLayout>
    </>
  );
};

export default Index;
