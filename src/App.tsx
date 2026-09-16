import { Routes, Route } from 'react-router'
import SiteShell from './components/SiteShell'
import Home from './pages/Home'
import TaxCalculator from './pages/tools/TaxCalculator'
import MortgageCalculator from './pages/tools/MortgageCalculator'
import UnitConverter from './pages/tools/UnitConverter'
import JsonTool from './pages/tools/JsonTool'
import PasswordGenerator from './pages/tools/PasswordGenerator'
import BmiCalculator from './pages/tools/BmiCalculator'
import DateCalculator from './pages/tools/DateCalculator'
import PrepaymentCalculator from './pages/tools/PrepaymentCalculator'
import SocialInsuranceCalculator from './pages/tools/SocialInsuranceCalculator'

export default function App() {
  return (
    <Routes>
      <Route element={<SiteShell />}>
        <Route path="/" element={<Home />} />
        <Route path="/tools/tax" element={<TaxCalculator />} />
        <Route path="/tools/mortgage" element={<MortgageCalculator />} />
        <Route path="/tools/converter" element={<UnitConverter />} />
        <Route path="/tools/json" element={<JsonTool />} />
        <Route path="/tools/password" element={<PasswordGenerator />} />
        <Route path="/tools/bmi" element={<BmiCalculator />} />
        <Route path="/tools/dates" element={<DateCalculator />} />
        <Route path="/tools/prepayment" element={<PrepaymentCalculator />} />
        <Route path="/tools/social-insurance" element={<SocialInsuranceCalculator />} />
      </Route>
    </Routes>
  )
}
