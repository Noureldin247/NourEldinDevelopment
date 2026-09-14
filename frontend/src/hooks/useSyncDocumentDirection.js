import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { RTL_LANGUAGES } from '../i18n';

export function useSyncDocumentDirection() {
  const { i18n } = useTranslation();

  useEffect(() => {
    function applyDirection(language) {
      const dir = RTL_LANGUAGES.includes(language) ? 'rtl' : 'ltr';
      document.documentElement.dir = dir;
      document.documentElement.lang = language;
    }

    applyDirection(i18n.language);
    i18n.on('languageChanged', applyDirection);
    return () => i18n.off('languageChanged', applyDirection);
  }, [i18n]);
}
