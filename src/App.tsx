import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { RoleProvider } from './context/RoleContext';
import { AppLayout } from './components/AppLayout';
import { Overview } from './pages/Overview';
import { PatientDirectory } from './pages/PatientDirectory';
import { PatientHistory } from './pages/PatientHistory';
import { DocumentRepository } from './pages/DocumentRepository';
import { EvidenceSearch } from './pages/EvidenceSearch';
import { ReviewQueue } from './pages/ReviewQueue';
import { ActivityLog } from './pages/ActivityLog';
import { Settings } from './pages/Settings';

function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center py-24 text-center">
      <p className="text-4xl font-bold text-slate-300">404</p>
      <p className="mt-2 text-slate-500">Page not found</p>
    </div>
  );
}

export default function App() {
  return (
    <RoleProvider>
      <BrowserRouter>
        <Routes>
          <Route element={<AppLayout />}>
            <Route index element={<Overview />} />
            <Route path="patients" element={<PatientDirectory />} />
            <Route path="patients/:patientId" element={<PatientHistory />} />
            <Route path="documents" element={<DocumentRepository />} />
            <Route path="evidence" element={<EvidenceSearch />} />
            <Route path="reviews" element={<ReviewQueue />} />
            <Route path="activity" element={<ActivityLog />} />
            <Route path="settings" element={<Settings />} />
            <Route path="*" element={<NotFound />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </RoleProvider>
  );
}
