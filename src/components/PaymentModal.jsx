import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, CreditCard, Lock, CheckCircle2, Sparkles } from 'lucide-react'
import { loadStripe } from '@stripe/stripe-js'
import { Elements, CardElement, useStripe, useElements } from '@stripe/react-stripe-js'
import { createPaymentIntent } from '../lib/api'
import { generatePDF } from '../lib/pdfGenerator'

const stripePromise = import.meta.env.VITE_STRIPE_PK
  ? loadStripe(import.meta.env.VITE_STRIPE_PK)
  : null

const CARD_STYLE = {
  style: {
    base: {
      color: '#f8fafc',
      fontFamily: 'Inter, system-ui, sans-serif',
      fontSmoothing: 'antialiased',
      fontSize: '15px',
      '::placeholder': { color: 'rgba(148, 163, 184, 0.5)' },
    },
    invalid: { color: '#f87171', iconColor: '#f87171' },
  },
}

function CheckoutForm({ onSuccess, onClose }) {
  const stripe = useStripe()
  const elements = useElements()
  const [status, setStatus] = useState('idle')
  const [error, setError] = useState('')
  const [clientSecret, setClientSecret] = useState('')

  useEffect(() => {
    createPaymentIntent()
      .then(setClientSecret)
      .catch(() => setError('Failed to initialize payment. Please try again.'))
  }, [])

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!stripe || !elements || !clientSecret) return

    setStatus('processing')
    setError('')

    const { error: stripeError, paymentIntent } = await stripe.confirmCardPayment(clientSecret, {
      payment_method: { card: elements.getElement(CardElement) }
    })

    if (stripeError) {
      setError(stripeError.message)
      setStatus('idle')
    } else if (paymentIntent.status === 'succeeded') {
      setStatus('success')
      setTimeout(onSuccess, 1500)
    }
  }

  if (status === 'success') {
    return (
      <div className="text-center py-8">
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', stiffness: 300, damping: 20 }}
          className="w-16 h-16 rounded-full bg-emerald-500 flex items-center justify-center mx-auto mb-4"
        >
          <CheckCircle2 className="w-8 h-8 text-white" />
        </motion.div>
        <h3 className="text-xl font-bold mb-2">Payment Successful!</h3>
        <p className="text-white/50 text-sm">Generating your PDF...</p>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div>
        <label className="block text-sm font-medium text-white/60 mb-2">Card Details</label>
        <div className="input-glass">
          <CardElement options={CARD_STYLE} />
        </div>
        {error && <p className="text-red-400 text-xs mt-2">{error}</p>}
      </div>

      <div className="flex items-center gap-2 text-xs text-white/30 glass rounded-lg px-3 py-2">
        <Lock className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
        <span>Secured by Stripe. Your card info never touches our servers.</span>
      </div>

      <button
        type="submit"
        disabled={!stripe || status === 'processing' || !clientSecret}
        className="btn-primary w-full flex items-center justify-center gap-2 py-4 disabled:opacity-60 disabled:cursor-not-allowed"
      >
        {status === 'processing' ? (
          <>
            <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
              className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full" />
            Processing...
          </>
        ) : (
          <><CreditCard className="w-4 h-4" /> Pay $9.00 & Download</>
        )}
      </button>
    </form>
  )
}

export default function PaymentModal({ isOpen, onClose, onSuccess }) {
  const handleDirectDownload = async () => {
    onClose()
    await generatePDF('resume-preview', 'my-resume.pdf')
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          />

          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            className="relative glass-card p-6 w-full max-w-md"
            style={{ background: 'rgba(13, 13, 20, 0.95)', border: '1px solid rgba(124,58,237,0.3)' }}
          >
            <button onClick={onClose} className="absolute top-4 right-4 text-white/30 hover:text-white transition-colors">
              <X className="w-5 h-5" />
            </button>

            <div className="mb-6">
              <div className="flex items-center gap-2 mb-1">
                <Sparkles className="w-5 h-5 text-violet-400" />
                <h2 className="text-xl font-bold">Download Your Resume</h2>
              </div>
              <p className="text-white/40 text-sm">One-time payment. Yours forever.</p>
            </div>

            {/* Price */}
            <div className="glass rounded-xl p-4 mb-6 flex items-center justify-between" style={{ borderColor: 'rgba(124,58,237,0.2)' }}>
              <div>
                <p className="font-semibold">AI Resume PDF</p>
                <p className="text-xs text-white/40">Professional • ATS Optimized • No watermarks</p>
              </div>
              <span className="text-2xl font-black gradient-text">$9</span>
            </div>

            {stripePromise ? (
              <Elements stripe={stripePromise}>
                <CheckoutForm onSuccess={async () => {
                  onClose()
                  await generatePDF('resume-preview', 'my-resume.pdf')
                }} onClose={onClose} />
              </Elements>
            ) : (
              <div className="space-y-4">
                <div className="glass rounded-lg p-4 border-amber-500/20 text-amber-300 text-sm" style={{ borderColor: 'rgba(251,191,36,0.2)', background: 'rgba(251,191,36,0.05)' }}>
                  ⚠️ Stripe not configured. Add VITE_STRIPE_PK to .env to enable payments.
                </div>
                <button onClick={handleDirectDownload} className="btn-primary w-full flex items-center justify-center gap-2 py-4">
                  Download PDF (Demo Mode)
                </button>
              </div>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}
