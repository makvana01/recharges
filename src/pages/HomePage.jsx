import { useState, useEffect, useRef } from 'react'
import { SvgDefs, Icon } from '../components/Icons'
import phonepeSvg from '../assets/img/phonepe.svg'
import jioImg from '../assets/img/jio.jpg'
import airtelImg from '../assets/img/airtel.jpg'
import viImg from '../assets/img/vi.jpg'
import bsnlImg from '../assets/img/bsnl.jpg'
import bannerImg from '../assets/img/indexmain.png'

const operators = [
  { id: 'jio', name: 'Jio', img: jioImg },
  { id: 'airtel', name: 'Airtel', img: airtelImg },
  { id: 'vi', name: 'Vi', img: viImg },
  { id: 'bsnl', name: 'BSNL', img: bsnlImg },
]

export default function HomePage({ onNavigateToPlans, defaultOperator = 'jio' }) {
  const [selectedOp, setSelectedOp] = useState(defaultOperator)
  const [mobile, setMobile] = useState('')
  const [message, setMessage] = useState({ text: '', type: '' })
  const [showLoader, setShowLoader] = useState(false)
  const [loaderState, setLoaderState] = useState('loading') // loading | success
  const [loaderText, setLoaderText] = useState('Please wait')
  const [loaderSubText, setLoaderSubText] = useState('Loading available recharge plans…')
  const [progress, setProgress] = useState(0)
  const [timer, setTimer] = useState('')
  const endTimeRef = useRef(Date.now() + 10 * 60 * 1000)

  // Timer countdown
  useEffect(() => {
    const tick = () => {
      const dist = endTimeRef.current - Date.now()
      if (dist <= 0) {
        setTimer('EXPIRED')
        return
      }
      const m = Math.floor(dist / 60000)
      const s = Math.floor((dist % 60000) / 1000)
      setTimer(`${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`)
    }
    tick()
    const iv = setInterval(tick, 1000)
    return () => clearInterval(iv)
  }, [])

  const formatMobile = (val) => {
    const digits = val.replace(/\D/g, '').slice(0, 10)
    if (digits.length > 5) {
      return digits.slice(0, 5) + ' ' + digits.slice(5)
    }
    return digits
  }

  const handleMobileChange = (e) => {
    const formatted = formatMobile(e.target.value)
    setMobile(formatted)
    setMessage({ text: '', type: '' })
  }

  const handleRecharge = () => {
    const digits = mobile.replace(/\D/g, '')
    if (digits.length !== 10) {
      setMessage({ text: 'Please enter a valid 10-digit mobile number', type: 'error' })
      return
    }
    if (!/^[6-9]/.test(digits)) {
      setMessage({ text: 'Mobile number must start with 6, 7, 8, or 9', type: 'error' })
      return
    }

    setMessage({ text: '', type: '' })
    setShowLoader(true)
    setLoaderState('loading')
    setLoaderText('Please wait')
    setLoaderSubText('Loading available recharge plans…')
    setProgress(0)

    // Animate progress
    let p = 0
    const pInterval = setInterval(() => {
      p += Math.random() * 15 + 5
      if (p > 90) p = 90
      setProgress(p)
    }, 300)

    setTimeout(() => {
      clearInterval(pInterval)
      setProgress(100)
      setLoaderState('success')
      setLoaderText('Plans loaded!')
      setLoaderSubText('Redirecting to plans…')

      setTimeout(() => {
        setShowLoader(false)
        onNavigateToPlans(digits, selectedOp)
      }, 800)
    }, 2000)
  }

  const selectOperator = (opId) => {
    setSelectedOp(opId)
    if (navigator.vibrate) navigator.vibrate(12)
  }

  return (
    <>
      <SvgDefs />
      <div className="app">
        <header className="header">
          <div className="header-left">
            <div className="brand-mark">
              <img src={phonepeSvg} className="brand-logo" alt="Mobile Recharge" />
            </div>
            <div className="brand-text">
              <div className="brand-title">Mobile Recharge</div>
              <div className="brand-subtitle">Fast • Secure • Simple</div>
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

        <main className="content">
          <section className="offer-bar">
            <div className="offer-left">
              <div className="offer-icon">
                <Icon name="icon-clock" size={15} />
              </div>
              <div className="offer-title">Special Offer Ends In</div>
            </div>
            <div className="timer-value">{timer}</div>
          </section>

          <section className="banner-wrap">
            <div className="banner-card">
              <img src={bannerImg} alt="Recharge offer" />
            </div>
          </section>

          <section className="recharge-card">
            <div className="card-heading">
              <div className="heading-icon">
                <Icon name="icon-phone" size={20} />
              </div>
              <div className="heading-copy">
                <div className="heading-title">Recharge your mobile</div>
                <div className="heading-subtitle">Select operator and enter number</div>
              </div>
              <div className="secure-badge">
                <Icon name="icon-shield" size={13} />
                SECURE
              </div>
            </div>

            <div className="field-label">Network provider</div>
            <div className="operator-grid">
              {operators.map((op) => (
                <button
                  key={op.id}
                  className={`operator-option${selectedOp === op.id ? ' selected' : ''}`}
                  type="button"
                  onClick={() => selectOperator(op.id)}
                  aria-label={`Select ${op.name}`}
                  aria-pressed={selectedOp === op.id}
                >
                  <span className="operator-check">
                    <Icon name="icon-check" size={10} />
                  </span>
                  <span className="operator-logo-wrap">
                    <img src={op.img} alt={op.name} />
                  </span>
                  <span className="operator-name">{op.name}</span>
                </button>
              ))}
            </div>

            <div className="field-label">Mobile number</div>
            <div className="mobile-field">
              <div className="mobile-input-shell">
                <span className="country-prefix">+91</span>
                <input
                  type="tel"
                  placeholder="00000 00000"
                  inputMode="numeric"
                  autoComplete="tel-national"
                  maxLength={11}
                  value={mobile}
                  onChange={handleMobileChange}
                />
                <span className="contact-icon">
                  <Icon name="icon-contact" size={20} />
                </span>
              </div>
              {message.text && (
                <div className={`input-message ${message.type}`} role="alert">
                  {message.text}
                </div>
              )}
            </div>

            <button className="recharge-button" type="button" onClick={handleRecharge}>
              <span>Recharge Now</span>
              <Icon name="icon-arrow" size={20} />
            </button>

            <div className="trust-row">
              <div className="trust-item">
                <Icon name="icon-lock" size={14} />
                Protected
              </div>
              <div className="trust-item">
                <Icon name="icon-sparkle" size={14} />
                Instant plans
              </div>
              <div className="trust-item">
                <Icon name="icon-shield" size={14} />
                Verified
              </div>
            </div>
          </section>
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
            <span style={{ width: `${progress}%` }}></span>
          </div>
        </div>
      </div>
    </>
  )
}
