import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { HelmetProvider } from 'react-helmet-async'
import './i18n'
import './index.css'
import App from './App'
import ChatPage from './pages/ChatPage'
import AdminPage from './pages/AdminPage'
import ServicesMarketplacePage from './pages/ServicesMarketplacePage'
import ServiceDetailPage from './pages/ServiceDetailPage'
import RequestServicePage from './pages/RequestServicePage'
import CustomerDashboardPage from './pages/CustomerDashboardPage'
import QuotationDetailPage from './pages/QuotationDetailPage'
import NdviAnalyticsPage from './pages/NdviAnalyticsPage'
import SatelliteIntelligencePage from './pages/SatelliteIntelligencePage'
import FarmMonitoringPage from './pages/FarmMonitoringPage'
import FarmMonitoringDetailPage from './pages/FarmMonitoringDetailPage'
import FarmReportsPage from './pages/FarmReportsPage'
import ConsultancyPage from './pages/ConsultancyPage'
import PlatformLoginPage from './pages/PlatformLoginPage'
import OperationsDashboardPage from './pages/OperationsDashboardPage'
import FarmRegistryPage from './pages/FarmRegistryPage'
import FarmRegistryDetailPage from './pages/FarmRegistryDetailPage'
import FieldOperationsPage from './pages/FieldOperationsPage'
import OperationDetailPage from './pages/OperationDetailPage'
import PestManagementPage from './pages/PestManagementPage'
import PestDetectionDetailPage from './pages/PestDetectionDetailPage'
import IrrigationManagementPage from './pages/IrrigationManagementPage'
import AssetManagementPage from './pages/AssetManagementPage'
import AssetDetailPage from './pages/AssetDetailPage'
import WorkforcePage from './pages/WorkforcePage'
import ReportingCenterPage from './pages/ReportingCenterPage'
import UserManagementPage from './pages/UserManagementPage'
import TrapsManagementPage from './pages/TrapsManagementPage'
import RecyclingStationsPage from './pages/RecyclingStationsPage'
import RegionsManagementPage from './pages/RegionsManagementPage'
import FarmOperatorsPage from './pages/FarmOperatorsPage'
import NotificationsCenterPage from './pages/NotificationsCenterPage'
import AuditLogPage from './pages/AuditLogPage'
import EnterpriseSearchPage from './pages/EnterpriseSearchPage'
import ProtectedRoute from './components/platform/ProtectedRoute'
import { PlatformAuthProvider } from './contexts/PlatformAuthContext'
import { initTheme } from './lib/theme'

initTheme()

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <HelmetProvider>
      <BrowserRouter>
        <PlatformAuthProvider>
          <Routes>
            <Route path="/" element={<App />} />
            <Route path="/chat" element={<ChatPage />} />
            <Route path="/admin" element={<AdminPage />} />
            <Route path="/services" element={<ServicesMarketplacePage />} />
            <Route path="/services/:slug" element={<ServiceDetailPage />} />
            <Route path="/request-service" element={<RequestServicePage />} />
            <Route path="/dashboard" element={<CustomerDashboardPage />} />
            <Route path="/quotations/:quoteId" element={<QuotationDetailPage />} />
            <Route path="/ndvi-analytics" element={<NdviAnalyticsPage />} />
            <Route path="/satellite-intelligence" element={<SatelliteIntelligencePage />} />
            <Route path="/farm-monitoring" element={<FarmMonitoringPage />} />
            <Route path="/farm-monitoring/:farmId" element={<FarmMonitoringDetailPage />} />
            <Route path="/farm-reports" element={<FarmReportsPage />} />
            <Route path="/consultancy" element={<ConsultancyPage />} />
            <Route path="/platform/login" element={<PlatformLoginPage />} />
            <Route path="/platform/dashboard" element={<ProtectedRoute><OperationsDashboardPage /></ProtectedRoute>} />
            <Route path="/platform/farms" element={<ProtectedRoute><FarmRegistryPage /></ProtectedRoute>} />
            <Route path="/platform/farms/:farmCode" element={<ProtectedRoute><FarmRegistryDetailPage /></ProtectedRoute>} />
            <Route path="/platform/operations" element={<ProtectedRoute><FieldOperationsPage /></ProtectedRoute>} />
            <Route path="/platform/operations/:operationId" element={<ProtectedRoute><OperationDetailPage /></ProtectedRoute>} />
            <Route path="/platform/pests" element={<ProtectedRoute><PestManagementPage /></ProtectedRoute>} />
            <Route path="/platform/pests/:detectionId" element={<ProtectedRoute><PestDetectionDetailPage /></ProtectedRoute>} />
            <Route path="/platform/irrigation" element={<ProtectedRoute><IrrigationManagementPage /></ProtectedRoute>} />
            <Route path="/platform/assets" element={<ProtectedRoute><AssetManagementPage /></ProtectedRoute>} />
            <Route path="/platform/assets/:assetCode" element={<ProtectedRoute><AssetDetailPage /></ProtectedRoute>} />
            <Route path="/platform/workforce" element={<ProtectedRoute><WorkforcePage /></ProtectedRoute>} />
            <Route path="/platform/reports" element={<ProtectedRoute><ReportingCenterPage /></ProtectedRoute>} />
            <Route path="/platform/users" element={<ProtectedRoute><UserManagementPage /></ProtectedRoute>} />
            <Route path="/platform/traps" element={<ProtectedRoute><TrapsManagementPage /></ProtectedRoute>} />
            <Route path="/platform/recycling" element={<ProtectedRoute><RecyclingStationsPage /></ProtectedRoute>} />
            <Route path="/platform/regions" element={<ProtectedRoute><RegionsManagementPage /></ProtectedRoute>} />
            <Route path="/platform/operators" element={<ProtectedRoute><FarmOperatorsPage /></ProtectedRoute>} />
            <Route path="/platform/notifications" element={<ProtectedRoute><NotificationsCenterPage /></ProtectedRoute>} />
            <Route path="/platform/audit" element={<ProtectedRoute><AuditLogPage /></ProtectedRoute>} />
            <Route path="/platform/search" element={<ProtectedRoute><EnterpriseSearchPage /></ProtectedRoute>} />
          </Routes>
        </PlatformAuthProvider>
      </BrowserRouter>
    </HelmetProvider>
  </React.StrictMode>,
)
