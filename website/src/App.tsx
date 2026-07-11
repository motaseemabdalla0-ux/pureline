import Navbar from './components/Navbar'
import Footer from './components/Footer'
import Seo from './components/ui/Seo'
import Hero from './components/sections/Hero'
import About from './components/sections/About'
import Services from './components/sections/Services'
import Stats from './components/sections/Stats'
import WhyChooseUs from './components/sections/WhyChooseUs'
import SatelliteIntelligence from './components/sections/SatelliteIntelligence'
import NDVIAnalytics from './components/sections/NDVIAnalytics'
import LiveNDVIMonitoring from './components/sections/LiveNDVIMonitoring'
import SatelliteDashboard from './components/sections/SatelliteDashboard'
import FarmIntelligence from './components/sections/FarmIntelligence'
import Projects from './components/sections/Projects'
import Technology from './components/sections/Technology'
import Platform from './components/sections/Platform'
import Contact from './components/sections/Contact'

export default function App() {
  return (
    <>
      <Seo />
      <Navbar />
      <main>
        <Hero />
        <About />
        <Services />
        <Stats />
        <WhyChooseUs />
        <SatelliteIntelligence />
        <NDVIAnalytics />
        <LiveNDVIMonitoring />
        <SatelliteDashboard />
        <FarmIntelligence />
        <Projects />
        <Technology />
        <Platform />
        <Contact />
      </main>
      <Footer />
    </>
  )
}
