import axios from 'axios';

export const api = axios.create({
  baseURL: process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:8080/api',
  timeout: 1500,
  headers: { 'Content-Type': 'application/json' },
});