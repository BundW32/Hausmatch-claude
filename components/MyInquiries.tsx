import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../services/auth';
import { deleteInquiry, getMyInquiries, setInquiryStatus } from '../services/dataService';
import { Inquiry } from '../types';
import { EmptyState, formatDate, LoadingBlock, Notice, PageHeader } from './ui/Bits';
import { Icon } from './ui/Icon';
import { Modal } from './ui/Modal';
import { errorText, useToast } from './ui/Toast';

const MyInquiries = () => {
  const { user } = useAuth();
  const toast = useToast();
  const [items, setItems] = useState<Inquiry[] | null>(null);
  const [error, setError] = useState('');
  const [toDelete, setToDelete] = useState<Inquiry | null>(null);

  useEffect(() => {
    if (!user) return;
    getMyInquiries(user.id)
      .then(setItems)
      .catch(err => setError(errorText(err, 'Ihre Anfragen konnten nicht geladen werden.')));
  }, [user?.id]);

  const toggle = async (inq: Inquiry) => {
    const status = inq.status === 'offen' ? 'geschlossen' : 'offen';
    try {
      await setInquiryStatus(inq.id, status);
      setItems(list => (list || []).map(i => (i.id === inq.id ? { ...i, status } : i)));
      toast(status === 'geschlossen' ? 'Anfrage geschlossen – Verwalter sehen sie nicht mehr.' : 'Anfrage wieder geöffnet.', 'success');
    } catch (err) {
      toast(errorText(err), 'error');
    }
  };

  const remove = async () => {
    if (!toDelete) return;
    try {
      await deleteInquiry(toDelete.id);
      setItems(list => (list || []).filter(i => i.id !== toDelete.id));
      toast('Anfrage gelöscht.', 'success');
    } catch (err) {
      toast(errorText(err), 'error');
    } finally {
      setToDelete(null);
    }
  };

  return (
    <>
    <PageHeader eyebrow="Eigentümer" title="Meine Anfragen" width="max-w-4xl" actions={<Link to="/wizard" className="btn btn-white"><Icon name="plus" className="w-4 h-4" /> Neue Anfrage</Link>}>
      Antworten von Verwaltungen erhalten Sie im <Link to="/messages">Postfach</Link>.
    </PageHeader>
    <div className="page max-w-4xl">

      {error && <Notice kind="error">{error}</Notice>}
      {!error && items === null && <LoadingBlock />}

      {items && items.length === 0 && (
        <div className="card">
          <EmptyState icon="building" title="Noch keine Anfrage gestellt" action={<Link to="/wizard" className="btn btn-primary">Objekt beschreiben</Link>}>
            Beschreiben Sie Ihr Objekt in wenigen Schritten – passende Hausverwaltungen können sich dann bei Ihnen melden.
          </EmptyState>
        </div>
      )}

      {items && items.length > 0 && (
        <ul className="space-y-4">
          {items.map(inq => (
            <li key={inq.id} className="card p-5 sm:p-6">
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                <h2 className="text-lg font-bold text-slate-900">{inq.propertyType} in {inq.city}</h2>
                <span className={`badge ${inq.status === 'offen' ? 'badge-green' : ''}`}>{inq.status === 'offen' ? 'Aktiv' : 'Geschlossen'}</span>
              </div>
              <p className="mt-1 text-sm text-slate-500">{inq.units} Einheiten · gestellt am {formatDate(inq.createdAt)}</p>
              <p className="mt-3 text-sm text-slate-700 line-clamp-3 whitespace-pre-wrap break-words">{inq.description}</p>
              <div className="mt-4 flex flex-col sm:flex-row gap-2">
                <Link to={`/search-results?inquiry=${inq.id}`} className="btn btn-primary btn-sm">Passende Verwaltungen</Link>
                <button className="btn btn-secondary btn-sm" onClick={() => toggle(inq)}>{inq.status === 'offen' ? 'Anfrage schließen' : 'Wieder öffnen'}</button>
                <button className="btn btn-danger btn-sm" onClick={() => setToDelete(inq)}><Icon name="trash" className="w-4 h-4" /> Löschen</button>
              </div>
            </li>
          ))}
        </ul>
      )}

      {toDelete && (
        <Modal
          title="Anfrage löschen?"
          onClose={() => setToDelete(null)}
          footer={
            <>
              <button className="btn btn-secondary" onClick={() => setToDelete(null)}>Abbrechen</button>
              <button className="btn btn-danger" onClick={remove}>Endgültig löschen</button>
            </>
          }
        >
          <p className="text-slate-600">Die Anfrage „{toDelete.propertyType} in {toDelete.city}“ wird dauerhaft entfernt. Bereits geführte Nachrichten bleiben im Postfach.</p>
        </Modal>
      )}
    </div>
    </>
  );
};

export default MyInquiries;
