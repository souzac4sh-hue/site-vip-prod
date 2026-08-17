import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { InitialSecurityGate } from './components/InitialSecurityGate';
import { HomePage } from './pages/HomePage';
import { WhatsAppLandingPage } from './pages/WhatsAppLandingPage';
import { LiveRoomPage } from './pages/LiveRoomPage';
import { PaymentSuccessPage } from './pages/PaymentSuccessPage';
import { PaymentFailedPage } from './pages/PaymentFailedPage';
import { TermsPage } from './pages/TermsPage';
import { PrivacyPage } from './pages/PrivacyPage';
import { AdminPage } from './pages/AdminPage';

export const App: React.FC = () => {
  return (
    <BrowserRouter>
      <InitialSecurityGate>
        <Routes>
          {/* Produto A: Transmissão Privada */}
          <Route path="/" element={<HomePage />} />

          {/* Produto B: Acesso VIP ao WhatsApp */}
          <Route path="/whatsapp" element={<WhatsAppLandingPage />} />

          {/* Protected Live Room */}
          <Route path="/live" element={<LiveRoomPage />} />

          {/* Payment Confirmation & Error States */}
          <Route path="/payment/success" element={<PaymentSuccessPage />} />
          <Route path="/payment/failed" element={<PaymentFailedPage />} />

          {/* Legal & Compliance */}
          <Route path="/termos" element={<TermsPage />} />
          <Route path="/privacidade" element={<PrivacyPage />} />

          {/* Protected Admin Panel */}
          <Route path="/admin" element={<AdminPage />} />

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </InitialSecurityGate>
    </BrowserRouter>
  );
};
