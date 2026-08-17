import { useState, useEffect } from 'react'
import { useSelector } from 'react-redux'
import Login from './pages/Login'
import MainLayout from './layouts/MainLayout'
import Dashboard from './pages/Dashboard'
import Products from './pages/Products'
import POS from './pages/POS'
import SalesHistory from './pages/SalesHistory'
import Restock from './pages/Restock'
import Users from './pages/Users'
import Settings from './pages/Settings'
import StockOverview from './pages/StockOverview'
import Analytics from './pages/Analytics'
import LicenseScreen from './pages/LicenseScreen'
import SetupWizard from './pages/SetupWizard'

function App() {
  const { isAuthenticated } = useSelector((state) => state.auth)
  const [currentPage, setCurrentPage] = useState('dashboard')
  const [appStage, setAppStage] = useState('checking') // 'checking' | 'license' | 'setup' | 'auth'
  const [licenseError, setLicenseError] = useState('')

  window.resetPage = () => setCurrentPage('dashboard')

  useEffect(() => {
    async function checkSetup() {
      const result = await window.api.getSettings()
      const businessName = result.data?.business_name
      setAppStage(businessName ? 'auth' : 'setup')
    }

    async function checkLicense() {
      const stored = await window.api.checkStoredLicense()

      if (!stored.success) {
        setAppStage('license')
        return
      }

      const verify = await window.api.verifyLicenseOnline({
        license_key: stored.data.license_key,
      })

      if (verify.success) {
        await checkSetup()
        return
      }

      if (verify.offline) {
        await checkSetup()
        return
      } else {
        setLicenseError(
          verify.message || 'Your license is invalid or has expired.'
        )
      }

      setAppStage('license')
    }

    checkLicense()
  }, [])

  if (appStage === 'checking') {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-900">
        <div className="text-gray-400 text-lg">Loading…</div>
      </div>
    )
  }

  if (appStage === 'license') {
    return (
      <LicenseScreen
        initialError={licenseError}
        onActivated={async () => {
          const result = await window.api.getSettings()
          const businessName = result.data?.business_name
          setAppStage(businessName ? 'auth' : 'setup')
        }}
      />
    )
  }

  if (appStage === 'setup') {
    return <SetupWizard onComplete={() => setAppStage('auth')} />
  }

  // appStage === 'auth'
  if (!isAuthenticated) {
    return <Login />
  }

  const renderPage = () => {
    switch (currentPage) {
      case 'dashboard':
        return <Dashboard />
      case 'products':
        return <Products />
      case 'pos':
        return <POS />
      case 'sales':
        return <SalesHistory />
      case 'restock':
        return <Restock />
      case 'users':
        return <Users />
      case 'settings':
        return <Settings />
      case 'stock':
        return <StockOverview />
      case 'analytics':
        return <Analytics />
      default:
        return (
          <div className="flex items-center justify-center h-64">
            <p className="text-gray-400 text-lg">
              🚧 {currentPage} page coming soon...
            </p>
          </div>
        )
    }
  }

  return (
    <MainLayout currentPage={currentPage} setCurrentPage={setCurrentPage}>
      {renderPage()}
    </MainLayout>
  )
}

export default App
