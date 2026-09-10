import AssistantChat from '../components/AssistantChat';
import { PageHeader } from '../components/UI';
import { t } from '../lib/i18n';

export default function Assistant() {
  return (
    <>
      <PageHeader
        title={t('Assistant')}
        subtitle={t('Posez vos questions, dictez ou photographiez une liste de produits : il répond avec vos vrais chiffres')}
      />
      <div className="card flex h-[calc(100vh-240px)] min-h-[520px] flex-col">
        <AssistantChat />
      </div>
    </>
  );
}
