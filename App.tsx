import React, { Suspense, lazy, useEffect, useState } from 'react';
import { BrowserRouter, Link, NavLink, Navigate, Route, Routes, useLocation, useNavigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './services/auth';
import { subscribeUnreadCount } from './services/dataService';
import { reopenConsent } from './services/consent';
import { UserRole } from './types';
import { ToastProvider } from './components/ui/Toast';
import { Icon } from './components/ui/Icon';
import { Avatar, LoadingBlock } from './components/ui/Bits';
import { ConsentBanner, VerifyEmailBanner } from './components/Banners';

const LandingHome = lazy(() => import('./components/LandingHome'));
const ForSeekers = lazy(() => import('./components/ForSeekers'));
const ForManagers = lazy(() => import('./components/ForManagers'));
const Wizard = lazy(() => import('./components/Wizard'));
const SearchResults = lazy(() => import('./components/SearchResults'));
const MyInquiries = lazy(() => import('./components/MyInquiries'));
const Dashboard = lazy(() => import('./components/Dashboard'));
const Forum = lazy(() => import('./components/Forum'));
const Login = lazy(() => import('./components/Login'));
const Messaging = lazy(() => import('./components/Messaging'));
const Network = lazy(() => import('./components/Network'));
const Profile = lazy(() => import('./components/Profile'));
const Ratgeber = lazy(() => import('./components/Ratgeber'));
const Kreditrechner = lazy(() => import('./components/Kreditrechner'));
const ChatBot = lazy(() => import('./components/ChatBot'));
const AboutPage = lazy(() => import('./components/StaticPages').then(m => ({ default: m.AboutPage })));
const BlogPage = lazy(() => import('./components/StaticPages').then(m => ({ default: m.BlogPage })));
const ContactPage = lazy(() => import('./components/StaticPages').then(m => ({ default: m.ContactPage })));
const LegalPage = lazy(() => import('./components/LegalPages'));

const useUnreadCount = () => {
  const { user } = useAuth();
  const [count, setCount] = useState(0);
  useEffect(() => {
    if (!user) {
      setCount(0);
      return;
    }
    return subscribeUnreadCount(user.id, setCount);
  }, [user?.id]);
  return count;
};

const Logo = ({ light = false }: { light?: boolean }) => (
  <Link to="/" className="flex items-center gap-2.5" aria-label="HausMatch – zur Startseite">
    <span className="w-[34px] h-[34px] bg-brand-600 rounded-[9px] flex items-center justify-center text-white font-display font-extrabold text-[17px]" aria-hidden="true">H</span>
    <span className={`font-display text-[22px] font-bold tracking-tight ${light ? 'text-white' : 'text-ink'}`}>HausMatch</span>
  </Link>
);

const Navbar = () => {
  const { user, logout: signOut } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const unread = useUnreadCount();
  // Erst zur Startseite, dann abmelden – so merkt sich der Login keine Seite des vorherigen Nutzers.
  const logout = async () => {
    navigate('/');
    await signOut();
  };
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    setMobileOpen(false);
  }, [location.pathname]);

  const links: { to: string; label: string; badge?: number }[] = [
    ...(user?.role === 'manager'
      ? [{ to: '/dashboard', label: 'Lead-Center' }]
      : [{ to: '/wizard', label: 'Verwaltung finden' }]),
    ...(user?.role === 'seeker' ? [{ to: '/anfragen', label: 'Meine Anfragen' }] : []),
    { to: '/network', label: 'Netzwerk' },
    { to: '/forum', label: 'Forum' },
    { to: '/ratgeber', label: 'Ratgeber' },
    { to: '/kreditrechner', label: 'Rechner' },
    ...(user ? [{ to: '/messages', label: 'Postfach', badge: unread }] : []),
  ];

  const linkClass = ({ isActive }: { isActive: boolean }) =>
    `relative px-3 py-2 rounded-lg text-[15px] transition-colors ${isActive ? 'text-white bg-white/10' : 'text-navy-soft hover:text-white hover:bg-white/10'}`;

  const Badge = ({ n }: { n?: number }) =>
    n ? (
      <span className="ml-1.5 inline-flex items-center justify-center min-w-5 h-5 px-1.5 rounded-full bg-white text-navy text-xs font-semibold" aria-label={`${n} ungelesen`}>
        {n > 99 ? '99+' : n}
      </span>
    ) : null;

  return (
    <header className="fixed top-0 inset-x-0 z-50 bg-navy text-white border-b border-white/10 h-16">
      <a href="#inhalt" className="sr-only focus:not-sr-only focus:absolute focus:top-3 focus:left-3 btn btn-white btn-sm z-10">Zum Inhalt springen</a>
      <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-full flex items-center justify-between gap-4" aria-label="Hauptnavigation">
        <Logo light />

        <div className="hidden lg:flex items-center gap-1">
          {links.map(l => (
            <NavLink key={l.to} to={l.to} className={linkClass}>
              {l.label}
              <Badge n={l.badge} />
            </NavLink>
          ))}
        </div>

        <div className="hidden lg:flex items-center gap-2">
          {!user ? (
            <>
              <Link to="/login" className="btn btn-sm text-white hover:bg-white/10">Anmelden</Link>
              <Link to="/register" className="btn btn-white btn-sm">Registrieren</Link>
            </>
          ) : (
            <>
              <Link to="/profile" className="flex items-center gap-2.5 rounded-lg px-2 py-1 hover:bg-white/10 transition-colors">
                <Avatar name={user.name} src={user.avatar} size="sm" />
                <span className="text-left leading-tight">
                  <span className="block text-sm font-semibold text-white max-w-36 truncate">{user.name}</span>
                  <span className="block text-xs text-navy-soft">{user.role === 'manager' ? 'Hausverwaltung' : 'Eigentümer'}</span>
                </span>
              </Link>
              <button onClick={logout} className="btn btn-sm !px-2 text-navy-soft hover:text-white hover:bg-white/10" aria-label="Abmelden" title="Abmelden">
                <Icon name="logout" />
              </button>
            </>
          )}
        </div>

        <button
          className="lg:hidden btn btn-sm !px-2 relative text-white hover:bg-white/10"
          onClick={() => setMobileOpen(o => !o)}
          aria-label={mobileOpen ? 'Menü schließen' : 'Menü öffnen'}
          aria-expanded={mobileOpen}
          aria-controls="mobile-menu"
        >
          <Icon name={mobileOpen ? 'x' : 'menu'} className="w-6 h-6" />
          {!mobileOpen && unread > 0 && <span className="absolute top-1 right-1 w-2.5 h-2.5 rounded-full bg-white border-2 border-navy" />}
        </button>
      </nav>

      {mobileOpen && (
        <div id="mobile-menu" className="lg:hidden bg-navy border-b border-white/10 shadow-lg px-4 py-3 space-y-1 max-h-[calc(100dvh-4rem)] overflow-y-auto animate-fade-in">
          {links.map(l => (
            <NavLink key={l.to} to={l.to} className={p => `${linkClass(p)} flex items-center justify-between !py-3 text-base`}>
              {l.label}
              <Badge n={l.badge} />
            </NavLink>
          ))}
          <div className="pt-3 mt-2 border-t border-white/15 flex flex-col gap-2">
            {!user ? (
              <>
                <Link to="/login" className="btn text-white border border-white/30 hover:bg-white/10">Anmelden</Link>
                <Link to="/register" className="btn btn-white">Kostenlos registrieren</Link>
              </>
            ) : (
              <>
                <Link to="/profile" className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-white/10">
                  <Avatar name={user.name} src={user.avatar} size="sm" />
                  <span className="text-sm font-semibold text-white truncate">{user.name} · Profil</span>
                </Link>
                <button onClick={logout} className="btn text-white border border-white/30 hover:bg-white/10">Abmelden</button>
              </>
            )}
          </div>
        </div>
      )}
    </header>
  );
};

const Footer = () => {
  const cols: { title: string; links: { to: string; label: string }[] }[] = [
    {
      title: 'Plattform',
      links: [
        { to: '/wizard', label: 'Verwaltung finden' },
        { to: '/managers', label: 'Für Hausverwaltungen' },
        { to: '/network', label: 'Netzwerk' },
        { to: '/forum', label: 'Forum' },
      ],
    },
    {
      title: 'Wissen',
      links: [
        { to: '/ratgeber', label: 'Ratgeber' },
        { to: '/kreditrechner', label: 'Kreditrechner' },
        { to: '/blog', label: 'Branchen-News' },
      ],
    },
    {
      title: 'Unternehmen',
      links: [
        { to: '/about', label: 'Über uns' },
        { to: '/contact', label: 'Kontakt' },
        { to: '/legal/impressum', label: 'Impressum' },
        { to: '/legal/privacy', label: 'Datenschutz' },
        { to: '/legal/agb', label: 'AGB' },
      ],
    },
  ];
  return (
    <footer className="bg-white border-t border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 grid grid-cols-2 md:grid-cols-4 gap-8">
        <div className="col-span-2 md:col-span-1">
          <Logo />
          <p className="mt-3 text-sm text-slate-500 leading-relaxed max-w-xs">
            Die Plattform, auf der Immobilieneigentümer und Hausverwaltungen zueinander finden.
          </p>
          <address className="mt-4 not-italic text-sm text-slate-600 space-y-1">
            <p>B&amp;W Immobilien Management UG<br />Goethestraße 42, 45964 Gladbeck</p>
            <p><a href="tel:+4915129468127" className="hover:text-brand-700">+49 151 29468127</a></p>
            <p><a href="mailto:info@bundwimmobilien.de" className="text-brand-700 underline underline-offset-2">info@bundwimmobilien.de</a></p>
          </address>
        </div>
        {cols.map(col => (
          <nav key={col.title} aria-label={col.title}>
            <h2 className="text-sm font-semibold text-slate-900 mb-3">{col.title}</h2>
            <ul className="space-y-2 text-sm">
              {col.links.map(l => (
                <li key={l.to}>
                  <Link to={l.to} className="text-slate-600 hover:text-brand-700">{l.label}</Link>
                </li>
              ))}
            </ul>
          </nav>
        ))}
      </div>
      <div className="border-t border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex flex-col sm:flex-row justify-between gap-2 text-sm text-slate-500">
          <span>© {new Date().getFullYear()} B&amp;W Immobilien Management UG (haftungsbeschränkt)</span>
          <button onClick={reopenConsent} className="text-left sm:text-right hover:text-brand-700 underline underline-offset-2">Cookie-Einstellungen</button>
        </div>
      </div>
    </footer>
  );
};

const ProtectedRoute = ({ children, allowedRoles }: React.PropsWithChildren<{ allowedRoles?: UserRole[] }>) => {
  const { user, loading } = useAuth();
  const location = useLocation();
  if (loading) return <LoadingBlock />;
  if (!user) return <Navigate to="/login" replace state={{ from: location.pathname + location.search }} />;
  if (allowedRoles && !allowedRoles.includes(user.role)) return <Navigate to="/" replace />;
  return <>{children}</>;
};

const ScrollToTop = () => {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);
  return null;
};

const TITLES: [RegExp, string][] = [
  [/^\/$/, 'Hausverwaltung finden – kostenlos und anonym | HausMatch'],
  [/^\/(wizard|hausverwaltung-finden)/, 'Hausverwaltung finden – Objekt beschreiben'],
  [/^\/search-results/, 'Passende Hausverwaltungen'],
  [/^\/anfragen/, 'Meine Anfragen'],
  [/^\/dashboard/, 'Lead-Center'],
  [/^\/messages/, 'Postfach'],
  [/^\/network/, 'Netzwerk'],
  [/^\/forum/, 'Forum'],
  [/^\/profile/, 'Profil'],
  [/^\/ratgeber/, 'Immobilien-Ratgeber'],
  [/^\/kreditrechner/, 'Kreditrechner für Immobilien'],
  [/^\/managers/, 'Für Hausverwaltungen'],
  [/^\/seekers/, 'Für Eigentümer'],
  [/^\/blog/, 'Branchen-News'],
  [/^\/about/, 'Über uns'],
  [/^\/contact/, 'Kontakt'],
  [/^\/legal\/impressum/, 'Impressum'],
  [/^\/legal\/privacy/, 'Datenschutzerklärung'],
  [/^\/legal\/agb/, 'AGB'],
  [/^\/login/, 'Anmelden'],
  [/^\/register/, 'Registrieren'],
];

/** Bereiche, die die volle Höhe nutzen – dort gibt es weder Footer noch Chat-Assistent. */
const APP_VIEWS = ['/messages', '/dashboard'];

const Shell = () => {
  const { pathname } = useLocation();
  const isAppView = APP_VIEWS.some(p => pathname.startsWith(p));
  useEffect(() => {
    const title = TITLES.find(([re]) => re.test(pathname))?.[1];
    document.title = !title || pathname === '/' ? title || 'HausMatch' : `${title} – HausMatch`;
  }, [pathname]);
  return (
    <div className={`${isAppView ? 'h-dvh' : 'min-h-dvh'} pt-16 flex flex-col`}>
      <Navbar />
      <VerifyEmailBanner />
      <main id="inhalt" className={`flex-1 flex flex-col ${isAppView ? 'min-h-0' : ''}`}>
        <Suspense fallback={<LoadingBlock />}>
          <Routes>
            <Route path="/" element={<LandingHome />} />
            <Route path="/seekers" element={<ForSeekers />} />
            <Route path="/managers" element={<ForManagers />} />
            <Route path="/ratgeber" element={<Ratgeber />} />
            <Route path="/kreditrechner" element={<Kreditrechner />} />
            <Route path="/about" element={<AboutPage />} />
            <Route path="/blog" element={<BlogPage />} />
            <Route path="/contact" element={<ContactPage />} />
            <Route path="/legal/impressum" element={<LegalPage type="impressum" />} />
            <Route path="/legal/privacy" element={<LegalPage type="privacy" />} />
            <Route path="/legal/agb" element={<LegalPage type="agb" />} />

            <Route path="/login" element={<Login key="login" />} />
            <Route path="/register" element={<Login key="register" initialView="role_select" />} />
            <Route path="/wizard" element={<Wizard />} />
            <Route path="/hausverwaltung-finden" element={<Wizard />} />
            <Route path="/search-results" element={<SearchResults />} />
            <Route path="/network" element={<Network />} />
            <Route path="/forum" element={<Forum />} />
            <Route path="/forum/:threadId" element={<Forum />} />
            <Route path="/profile/:uid" element={<Profile />} />

            <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
            <Route path="/anfragen" element={<ProtectedRoute><MyInquiries /></ProtectedRoute>} />
            <Route path="/messages" element={<ProtectedRoute><Messaging /></ProtectedRoute>} />
            <Route path="/dashboard" element={<ProtectedRoute allowedRoles={['manager']}><Dashboard /></ProtectedRoute>} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Suspense>
      </main>
      {!isAppView && <Footer />}
      {!isAppView && (
        <Suspense fallback={null}>
          <ChatBot />
        </Suspense>
      )}
      <ConsentBanner />
    </div>
  );
};

const App = () => (
  <AuthProvider>
    <ToastProvider>
      <BrowserRouter>
        <ScrollToTop />
        <Shell />
      </BrowserRouter>
    </ToastProvider>
  </AuthProvider>
);

export default App;
