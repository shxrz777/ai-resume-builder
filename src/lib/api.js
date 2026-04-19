import axios from 'axios'

const api = axios.create({ baseURL: '/api' })

export async function generateResume(formData) {
  const { data } = await api.post('/generate-resume', { formData })
  return data.resume
}

export async function createPaymentIntent() {
  const { data } = await api.post('/create-payment-intent')
  return data.clientSecret
}
