import { Link } from 'wouter';
import { useTranslation } from 'react-i18next';
import { SasutyLogo } from '@/components/SasutyLogo';

export default function NotFound() {
  const { t } = useTranslation();

  return (
    <div className="flex flex-col items-center justify-center min-h-[100dvh] w-full p-4">
      <div className="mb-8">
        <SasutyLogo />
      </div>
      <h1 className="text-8xl font-bold text-muted/30 select-none">404</h1>
      <h2 className="text-2xl font-bold mt-4 mb-2">{t('notFound.title')}</h2>
      <p className="text-muted-foreground text-center max-w-md mb-8">
        {t('notFound.description')}
      </p>
      <Link 
        href="/" 
        className="bg-primary hover:bg-primary/90 text-primary-foreground font-bold rounded-full px-8 py-3 transition-colors"
      >
        {t('notFound.goHome')}
      </Link>
    </div>
  );
}