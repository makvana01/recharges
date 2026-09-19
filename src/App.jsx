import { useState } from 'react'
import HomePage from './pages/HomePage'
import PlansPage from './pages/PlansPage'
import PaymentPage from './pages/PaymentPage'

function App() {
  const [page, setPage] = useState('home')
  const [mobile, setMobile] = useState('')
  const [operator, setOperator] = useState('jio')
  const [selectedPlan, setSelectedPlan] = useState(null)

  const navigateToPlans = (mob, op) => {
    setMobile(mob)
    setOperator(op)
    setPage('plans')
  }

  const navigateToPayment = (plan) => {
    setSelectedPlan(plan)
    setPage('payment')
  }

  const navigateHome = () => {
    setPage('home')
  }

  const navigateBack = () => {
    if (page === 'payment') setPage('plans')
    else setPage('home')
  }

  return (
    <>
      {page === 'home' && (
        <HomePage
          onNavigateToPlans={navigateToPlans}
          defaultOperator={operator}
        />
      )}
      {page === 'plans' && (
        <PlansPage
          mobile={mobile}
          operator={operator}
          onSelectPlan={navigateToPayment}
          onGoHome={navigateHome}
        />
      )}
      {page === 'payment' && (
        <PaymentPage
          mobile={mobile}
          operator={operator}
          plan={selectedPlan}
          onGoHome={navigateHome}
          onGoBack={navigateBack}
        />
      )}
    </>
  )
}

export default App
