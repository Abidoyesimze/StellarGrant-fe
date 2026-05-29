import axios from 'axios'

const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'

export const api = axios.create({
  baseURL: apiUrl,
  timeout: 10_000,
  headers: { 'Content-Type': 'application/json' },
})
