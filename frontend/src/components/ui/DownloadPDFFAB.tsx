import { t } from '../../i18n/translations';
import { formatWeekRange } from '../../hooks/useTasks';
import type { Language } from '@shared/types';

interface DownloadPDFFABProps {
  weekOffset: number;
  lang: Language;
  onClick?: () => void;
}

export default function DownloadPDFFAB({ weekOffset, lang, onClick }: DownloadPDFFABProps) {
  return (
    <button
      type="button"
      onClick={onClick ?? (() => {})}
      className="fixed bottom-6 right-6 z-30 flex items-center gap-2 px-6 py-3.5 rounded-full bg-indigo-600 text-white font-bold shadow-[0_10px_25px_rgba(79,70,229,0.4)] animate-pulse-cta hover:animate-none hover:bg-indigo-700 active:scale-95 transition-colors"
    >
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
      </svg>
      {t('wa_download_pdf', lang)} ({formatWeekRange(weekOffset, lang)})
    </button>
  );
}
