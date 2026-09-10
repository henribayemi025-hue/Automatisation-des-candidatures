import AssistantChat from '../components/AssistantChat';
import { PageHeader } from '../components/UI';

export default function Assistant() {
  return (
    <>
      <PageHeader
        title="Assistant"
        subtitle="Posez vos questions, dictez ou photographiez une liste de produits : il répond avec vos vrais chiffres"
      />
      <div className="card flex h-[calc(100vh-240px)] min-h-[520px] flex-col">
        <AssistantChat />
      </div>
    </>
  );
}
