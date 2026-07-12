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
import { initTheme } from './lib/theme'

initTheme()

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <HelmetProvider>
      <BrowserRouter>
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
        </Routes>
      </BrowserRouter>
    </HelmetProvider>
  </React.StrictMode>,
)
