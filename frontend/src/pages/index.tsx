// Placeholder pages - will be fully implemented after dependencies are installed

export { default as RegisterPage } from './RegisterPage';
export { default as ReportsPage } from './ReportsPage';
export { default as ReportDetailPage } from './ReportDetailPage';
export { default as SubmitReportPage } from './SubmitReportPage';
export { default as AdminPage } from './AdminPage';
export { default as ProfilePage } from './ProfilePage';

// Simple placeholder component
const PlaceholderPage = ({ title }: { title: string }) => (
  <div className="min-h-screen bg-secondary-50 py-8">
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <h1 className="text-3xl font-bold text-secondary-900 mb-8">{title}</h1>
      <p>This page will be implemented after installing dependencies.</p>
    </div>
  </div>
);

export default PlaceholderPage;
