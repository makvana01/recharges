import { useState, useEffect, useRef } from 'react'
import { SvgDefs, Icon } from '../components/Icons'
import phonepeSvg from '../assets/img/phonepe.svg'
import jioImg from '../assets/img/jio.jpg'
import airtelImg from '../assets/img/airtel.jpg'
import viImg from '../assets/img/vi.jpg'
import bsnlImg from '../assets/img/bsnl.jpg'
import fiveGSvg from '../assets/img/5g.svg'

const operatorImages = { jio: jioImg, airtel: airtelImg, vi: viImg, bsnl: bsnlImg }
const operatorNames = { jio: 'Jio', airtel: 'Airtel', vi: 'Vi', bsnl: 'BSNL' }

const plansData = {
  jio: [
    { id: 1, price: 499, oldPrice: 3999, validity: '365 Days', data: '3GB/day', voice: 'Unlimited', sms: '100/day', has5g: true },
    { id: 2, price: 449, oldPrice: 2495, validity: '365 Days', data: '2.5GB/day', voice: 'Unlimited', sms: '100/day', has5g: true },
    { id: 3, price: 399, oldPrice: 1999, validity: '180 Days', data: '2GB/day', voice: 'Unlimited', sms: '100/day', has5g: true },
    { id: 4, price: 299, oldPrice: 1499, validity: '84 Days', data: '2GB/day', voice: 'Unlimited', sms: '100/day', has5g: true },
    { id: 5, price: 239, oldPrice: 999, validity: '30 Days', data: '1.5GB/day', voice: 'Unlimited', sms: '100/day', has5g: false },
    { id: 6, price: 199, oldPrice: 799, validity: '28 Days', data: '1.5GB/day', voice: 'Unlimited', sms: '100/day', has5g: false },
  ],
  airtel: [
    { id: 1, price: 509, oldPrice: 3999, validity: '365 Days', data: '3GB/day', voice: 'Unlimited', sms: '100/day', has5g: true },
    { id: 2, price: 459, oldPrice: 2495, validity: '365 Days', data: '2.5GB/day', voice: 'Unlimited', sms: '100/day', has5g: true },
    { id: 3, price: 409, oldPrice: 1999, validity: '180 Days', data: '2GB/day', voice: 'Unlimited', sms: '100/day', has5g: true },
    { id: 4, price: 309, oldPrice: 1499, validity: '84 Days', data: '2GB/day', voice: 'Unlimited', sms: '100/day', has5g: true },
    { id: 5, price: 249, oldPrice: 999, validity: '30 Days', data: '1.5GB/day', voice: 'Unlimited', sms: '100/day', has5g: false },
    { id: 6, price: 209, oldPrice: 799, validity: '28 Days', data: '1.5GB/day', voice: 'Unlimited', sms: '100/day', has5g: false },
  ],
  vi: [
    { id: 1, price: 479, oldPrice: 3999, validity: '365 Days', data: '3GB/day', voice: 'Unlimited', sms: '100/day', has5g: true },
    { id: 2, price: 439, oldPrice: 2495, validity: '365 Days', data: '2.5GB/day', voice: 'Unlimited', sms: '100/day', has5g: true },
    { id: 3, price: 389, oldPrice: 1999, validity: '180 Days', data: '2GB/day', voice: 'Unlimited', sms: '100/day', has5g: true },
    { id: 4, price: 289, oldPrice: 1499, validity: '84 Days', data: '2GB/day', voice: 'Unlimited', sms: '100/day', has5g: true },
    { id: 5, price: 229, oldPrice: 999, validity: '30 Days', data: '1.5GB/day', voice: 'Unlimited', sms: '100/day', has5g: false },
    { id: 6, price: 189, oldPrice: 799, validity: '28 Days', data: '1.5GB/day', voice: 'Unlimited', sms: '100/day', has5g: false },
  ],
  bsnl: [
    { id: 1, price: 447, oldPrice: 3999, validity: '365 Days', data: '3GB/day', voice: 'Unlimited', sms: '100/day', has5g: false },
    { id: 2, price: 397, oldPrice: 2495, validity: '365 Days', data: '2.5GB/day', voice: 'Unlimited', sms: '100/day', has5g: false },
    { id: 3, price: 349, oldPrice: 1999, validity: '180 Days', data: '2GB/day', voice: 'Unlimited', sms: '100/day', has5g: false },
    { id: 4, price: 269, oldPrice: 1499, validity: '84 Days', data: '2GB/day', voice: 'Unlimited', sms: '100/day', has5g: false },
    { id: 5, price: 219, oldPrice: 999, validity: '30 Days', data: '1.5GB/day', voice: 'Unlimited', sms: '100/day', has5g: false },
    { id: 6, price: 179, oldPrice: 799, validity: '28 Days', data: '1.5GB/day', voice: 'Unlimited', sms: '100/day', has5g: false },
  ],
}

export default function PlansPage({ mobile, operator, onSelectPlan, onGoHome }) {
  const [timer, setTimer] = useState('')
  const [showLoader, setShowLoader] = useState(false)
  const [loaderState, setLoaderState] = useState('loading')
  const [loaderText, setLoaderText] = useState('Please wait')
  const [loaderSubText, setLoaderSubText] = useState('Preparing your recharge…')
  const endTimeRef = useRef(Date.now() + 10 * 60 * 1000)

  const plans = plansData[operator] || plansData.jio
  const opName = operatorNames[operator] || 'Jio'
  const opImg = operatorImages[operator] || jioImg
  const formattedMobile = mobile ? `+91 ${mobile.slice(0, 5)} ${mobile.slice(5)}` : '+91 98765 43210'

  useEffect(() => {
    const tick = () => {
      const dist = endTimeRef.current - Date.now()
      if (dist <= 0) { setTimer('EXPIRED'); return }
      const m = Math.floor(dist / 60000)
      const s = Math.floor((dist % 60000) / 1000)
      setTimer(`${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`)
    }
    tick()
    const iv = setInterval(tick, 1000)
    return () => clearInterval(iv)
  }, [])

  const handleSelectPlan = (plan) => {
    setShowLoader(true)
    setLoaderState('loading')
    setLoaderText('Please wait')
    setLoaderSubText('Preparing your recharge…')

    setTimeout(() => {
      setLoaderState('success')
      setLoaderText('Ready!')
      setLoaderSubText('Redirecting to payment…')

      setTimeout(() => {
        setShowLoader(false)
        onSelectPlan({
          ...plan,
          operator,
          operatorName: opName,
          mobile,
          formattedMobile,
        })
      }, 600)
    }, 1500)
  }

  return (
    <>
      <SvgDefs />
      <div className="app">
        <header className="header">
          <div className="header-left">
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: 0, textDecoration: 'none', color: 'inherit', cursor: 'pointer' }} onClick={onGoHome}>
              <div className="brand-mark">
                <img src={phonepeSvg} className="brand-logo" alt="Mobile Recharge" />
              </div>
              <div className="brand-text">
                <div className="brand-title">Recharge Plans</div>
                <div className="brand-subtitle">Fast • Secure • Simple</div>
              </div>
            </div>
          </div>
          <div className="header-actions">
            <button className="header-button" type="button">
              <Icon name="icon-help" />
            </button>
            <button className="header-button" type="button">
              <span className="notification-dot"></span>
              <Icon name="icon-bell" />
            </button>
          </div>
        </header>

        <section className="subscriber-card">
          <div className="subscriber-left">
            <div className="provider-logo-shell">
              <img className="provider-logo" src={opImg} alt={opName} />
            </div>
            <div className="subscriber-copy">
              <div className="subscriber-label">Selected number</div>
              <div className="mobile-display">{opName} &bull; {formattedMobile}</div>
            </div>
          </div>
          <button className="change-link" onClick={onGoHome}>Change</button>
        </section>

        <section className="offer-timer">
          <div className="timer-icon">
            <Icon name="icon-clock" size={14} />
          </div>
          <div className="timer-text">Special Offer Ends In</div>
          <div className="timer-value">{timer}</div>
        </section>

        <section className="plans-heading-card">
          <div className="plans-heading-left">
            <div className="plans-heading-icon">
              <Icon name="icon-plans" size={20} />
            </div>
            <div className="plans-heading-copy">
              <div className="plans-heading-title">Best plans for you</div>
              <div className="plans-heading-subtitle">Select a plan to continue</div>
            </div>
          </div>
          <div className="special-pill">
            <Icon name="icon-sparkle" size={12} />
            SPECIAL
          </div>
        </section>

        <main>
          {plans.map((plan, index) => (
            <article
              className="plan-card"
              key={plan.id}
              style={{ animationDelay: `${index * 0.055}s` }}
            >
              <div className="plan-top-row">
                <div className="new-badge">
                  <Icon name="icon-sparkle" size={11} />
                  NEW
                </div>
                <div className="network-badge">{opName} PLAN</div>
              </div>

              <div className="price-row">
                <div className="price-left">
                  <div className="plan-price">₹{plan.price}</div>
                  <div className="plan-old-price">₹{plan.oldPrice}</div>
                </div>
                {plan.has5g && <img src={fiveGSvg} className="five-g-logo" alt="5G" />}
              </div>

              <div className="plan-grid">
                <div className="plan-feature">
                  <div className="feature-icon"><Icon name="icon-calendar" size={15} /></div>
                  <div className="feature-label">Validity</div>
                  <div className="feature-value">{plan.validity}</div>
                </div>
                <div className="plan-feature">
                  <div className="feature-icon"><Icon name="icon-data" size={15} /></div>
                  <div className="feature-label">Data</div>
                  <div className="feature-value">{plan.data}</div>
                </div>
                <div className="plan-feature">
                  <div className="feature-icon"><Icon name="icon-call" size={15} /></div>
                  <div className="feature-label">Voice</div>
                  <div className="feature-value">{plan.voice}</div>
                </div>
                <div className="plan-feature">
                  <div className="feature-icon"><Icon name="icon-message" size={15} /></div>
                  <div className="feature-label">SMS</div>
                  <div className="feature-value">{plan.sms}</div>
                </div>
              </div>

              <button
                type="button"
                className="recharge-plan-button"
                onClick={() => handleSelectPlan(plan)}
              >
                <span>Recharge for ₹{plan.price}</span>
                <Icon name="icon-arrow" size={18} />
              </button>
            </article>
          ))}
        </main>
      </div>

      {/* Loader Overlay */}
      <div className={`loader-overlay${showLoader ? ' show' : ''}`}>
        <div className="loader-card">
          {loaderState === 'loading' && (
            <div className="loading-animation">
              <span className="spinner-ring"></span>
              <span className="spinner-core">
                <Icon name="icon-bolt" size={22} />
              </span>
            </div>
          )}
          {loaderState === 'success' && (
            <div className="success-animation show">
              <Icon name="icon-check" size={32} />
            </div>
          )}
          <div className="loader-title" style={loaderState === 'success' ? { color: '#16a34a' } : {}}>
            {loaderText}
          </div>
          <div className="loader-subtitle">{loaderSubText}</div>
          <div className="loader-progress">
            <span style={{ width: loaderState === 'success' ? '100%' : '60%' }}></span>
          </div>
        </div>
      </div>
    </>
  )
}
