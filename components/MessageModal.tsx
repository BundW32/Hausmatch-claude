import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../services/auth';
import { sendMessage } from '../services/dataService';
import { Modal } from './ui/Modal';
import { Notice } from './ui/Bits';
import { Spinner } from './ui/Icon';
import { errorText, useToast } from './ui/Toast';

interface Props {
  recipient: { id: string; name: string };
  subject: string;
  inquiryId?: string;
  template?: string;
  onClose: () => void;
  onSent?: () => void;
}

/** Erste Nachricht an ein Mitglied – landet im Postfach beider Seiten. */
const MessageModal: React.FC<Props> = ({ recipient, subject, inquiryId, template, onClose, onSent }) => {
  const { user } = useAuth();
  const toast = useToast();
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');

  const send = async () => {
    if (!user || !text.trim()) return;
    setSending(true);
    setError('');
    try {
      await sendMessage({
        senderId: user.id,
        senderName: user.name,
        receiverId: recipient.id,
        receiverName: recipient.name,
        subject,
        content: text,
        inquiryId,
      });
      toast('Nachricht gesendet.', 'success');
      onSent?.();
      onClose();
    } catch (err) {
      setError(errorText(err, 'Die Nachricht konnte nicht gesendet werden.'));
    } finally {
      setSending(false);
    }
  };

  if (!user) {
    return (
      <Modal title="Bitte anmelden" onClose={onClose} footer={<Link to="/login" className="btn btn-primary">Zum Login</Link>}>
        <p className="text-slate-600">Um Nachrichten zu schreiben, melden Sie sich bitte an oder registrieren Sie sich kostenlos.</p>
      </Modal>
    );
  }

  return (
    <Modal
      title={`Nachricht an ${recipient.name}`}
      onClose={onClose}
      size="lg"
      footer={
        <>
          <button className="btn btn-secondary" onClick={onClose}>Abbrechen</button>
          <button className="btn btn-primary" onClick={send} disabled={sending || !text.trim() || !user.emailVerified}>
            {sending && <Spinner className="w-4 h-4" />}
            Nachricht senden
          </button>
        </>
      }
    >
      {!user.emailVerified && (
        <Notice kind="warn" className="mb-4">Bitte bestätigen Sie zuerst Ihre E-Mail-Adresse – erst dann können Sie Nachrichten senden.</Notice>
      )}
      {error && <Notice kind="error" className="mb-4">{error}</Notice>}
      <label htmlFor="msg-text" className="label">Ihre Nachricht</label>
      <textarea
        id="msg-text"
        data-autofocus
        className="input min-h-40 resize-y"
        maxLength={4000}
        value={text}
        onChange={e => setText(e.target.value)}
        placeholder="Schreiben Sie Ihre Nachricht …"
      />
      <div className="mt-2 flex items-center justify-between gap-3">
        <p className="text-sm text-slate-500">Die Nachricht erscheint im Postfach des Empfängers.</p>
        {template && (
          <button type="button" className="btn btn-soft btn-sm" onClick={() => setText(template)}>Vorlage einfügen</button>
        )}
      </div>
    </Modal>
  );
};

export default MessageModal;
