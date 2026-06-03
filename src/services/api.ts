import axios from 'axios'

const defaultApiUrl = import.meta.env.PROD
  ? 'https://codegen-backend-z9nu.onrender.com'
  : 'http://localhost:8080'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL ?? defaultApiUrl,
  headers: { 'Content-Type': 'application/json' }
})

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

api.interceptors.response.use(
  (res) => res,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token')
      localStorage.removeItem('user')
      window.location.href = `${import.meta.env.BASE_URL}login`
    }
    return Promise.reject(error)
  }
)

export default api
