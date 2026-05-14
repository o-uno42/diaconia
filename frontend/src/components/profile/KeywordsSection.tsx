import { useState } from 'react';
import Badge from '../ui/Badge';
import { useAppContext } from '../../store/AppContext';
import { t } from '../../i18n/translations';

interface KeywordsSectionProps {
  keywords: string[];
  editable?: boolean;
  onChange?: (keywords: string[]) => void;
}

export default function KeywordsSection({ keywords, editable, onChange }: KeywordsSectionProps) {
  const { state } = useAppContext();
  const lang = state.language;
  const [newKeyword, setNewKeyword] = useState('');

  const addKeyword = () => {
    if (!newKeyword.trim() || !onChange) return;
    onChange([...keywords, newKeyword.trim()]);
    setNewKeyword('');
  };

  const removeKeyword = (index: number) => {
    if (!onChange) return;
    onChange(keywords.filter((_, i) => i !== index));
  };

  return (
    <div>
      <div className="flex flex-wrap gap-2">
        {keywords.map((kw, i) => (
          <Badge key={i} color="amber">
            {kw}
            {editable && (
              <button onClick={() => removeKeyword(i)} className="ml-1.5 text-amber-400 hover:text-amber-200">×</button>
            )}
          </Badge>
        ))}
        {keywords.length === 0 && <p className="text-stone-800/30 text-sm">{t('keywords_empty', lang)}</p>}
      </div>
      {editable && (
        <div className="flex gap-2 mt-3">
          <input
            type="text"
            value={newKeyword}
            onChange={(e) => setNewKeyword(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addKeyword())}
            className="input-field flex-1"
            placeholder={t('keywords_new_placeholder', lang)}
          />
          <button onClick={addKeyword} className="btn-secondary text-sm">+</button>
        </div>
      )}
    </div>
  );
}
