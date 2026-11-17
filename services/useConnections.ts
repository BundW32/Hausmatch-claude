import { useEffect, useMemo, useState } from 'react';
import { acceptConnection, removeConnection, requestConnection, subscribeConnections } from './dataService';
import { Connection } from '../types';

export type ConnectionState = 'none' | 'outgoing' | 'incoming' | 'accepted';

/** Vernetzungen des angemeldeten Nutzers: Anfrage senden → Gegenseite nimmt an. */
export const useConnections = (uid: string | undefined) => {
  const [connections, setConnections] = useState<Connection[]>([]);

  useEffect(() => {
    if (!uid) {
      setConnections([]);
      return;
    }
    return subscribeConnections(uid, setConnections);
  }, [uid]);

  const stateByUser = useMemo(() => {
    const map: Record<string, ConnectionState> = {};
    if (!uid) return map;
    connections.forEach(c => {
      const other = c.users.find(u => u !== uid);
      if (!other) return;
      map[other] = c.status === 'accepted' ? 'accepted' : c.requesterId === uid ? 'outgoing' : 'incoming';
    });
    return map;
  }, [connections, uid]);

  const stateOf = (otherUid: string): ConnectionState => stateByUser[otherUid] || 'none';

  /** Führt die zum aktuellen Stand passende Aktion aus. */
  const toggle = async (otherUid: string) => {
    if (!uid) return;
    const state = stateOf(otherUid);
    if (state === 'none') await requestConnection(uid, otherUid);
    else if (state === 'incoming') await acceptConnection(uid, otherUid);
    else await removeConnection(uid, otherUid);
  };

  const incoming = Object.entries(stateByUser).filter(([, s]) => s === 'incoming').map(([id]) => id);

  return { stateOf, toggle, incoming };
};

export const connectionLabel: Record<ConnectionState, string> = {
  none: 'Vernetzen',
  outgoing: 'Angefragt – zurückziehen',
  incoming: 'Anfrage annehmen',
  accepted: 'Vernetzt – trennen',
};
