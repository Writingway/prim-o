import { Routes, Route, Navigate } from 'react-router-dom';

// TODO Sprint 1 : importer les pages
// import LoginPage from './pages/LoginPage.jsx';
// import EmployerDashboard from './pages/employer/Dashboard.jsx';
// import EmployeeDashboard from './pages/employee/Dashboard.jsx';

function App() {
  return (
    <Routes>
      {/* Placeholder — à remplacer Sprint 1 */}
      <Route path="/" element={<div style={{ padding: 24 }}>🚀 Prim'O — en construction</div>} />

      {/* Employeur */}
      {/* <Route path="/employer/*" element={<EmployerDashboard />} /> */}

      {/* Employé */}
      {/* <Route path="/employee/*" element={<EmployeeDashboard />} /> */}

      <Route path="*" element={<Navigate to="/" />} />
    </Routes>
  );
}

export default App;
