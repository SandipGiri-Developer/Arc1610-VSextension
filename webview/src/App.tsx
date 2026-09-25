/**
 * App — Root application component.
 * Wraps the AppShell with the necessary context providers.
 */

import React from 'react';
import { MessengerProvider } from './context/MessengerContext';
import { AppStateProvider } from './context/AppStateContext';
import { AppShell } from './components/layout/AppShell';

export default function App() {
  return (
    <MessengerProvider>
      <AppStateProvider>
        <AppShell />
      </AppStateProvider>
    </MessengerProvider>
  );
}
