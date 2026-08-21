'use client';

import { useEffect } from 'react';
import { SessionProvider, useSession } from 'next-auth/react';
import { initMixpanel, identifyMixpanelUser } from '@/lib/mixpanel';

function MixpanelTracking() {
  const { data: session } = useSession();

  useEffect(() => {
    initMixpanel();
  }, []);

  useEffect(() => {
    if (session?.user?.id) {
      identifyMixpanelUser(session.user.id, session.user.email, session.user.name);
    }
  }, [session?.user?.id, session?.user?.email, session?.user?.name]);

  return null;
}

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <MixpanelTracking />
      {children}
    </SessionProvider>
  );
}
