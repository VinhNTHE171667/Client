/**
 * Centralized API endpoint configuration
 * 
 * This file defines all API endpoints used in the application.
 * Update ports here to avoid conflicts between services.
 */

/**
 * Chatbot API Service
 * - Port: 8000
 * - Service: FastAPI chatbot (do_an_fa25_api container)
 * - Endpoints: /chat, /chat/session/{sessionId}
 */
export const CHATBOT_API_BASE_URL = import.meta.env.VITE_CHAT_API_URL || "http://localhost:8000";
export const CHATBOT_API_ENDPOINT = `${CHATBOT_API_BASE_URL}/chat`;

/**
 * Recommendation API Service
 * - Port: 8001
 * - Service: Flask recommendation service (spa_recommender container)
 * - Endpoints: /api/recommendation/customer/{id}, /api/recommendation/cart, /api/recommendation/top-services
 */
export const RECOMMENDATION_API_BASE_URL = import.meta.env.VITE_RECOMMENDATION_API_URL || "http://localhost:8001";
export const RECOMMENDATION_API_ENDPOINTS = {
  customer: (customerId: string) => `${RECOMMENDATION_API_BASE_URL}/api/recommendation/customer/${customerId}`,
  cart: `${RECOMMENDATION_API_BASE_URL}/api/recommendation/cart`,
  topServices: `${RECOMMENDATION_API_BASE_URL}/api/recommendation/top-services`,
  train: `${RECOMMENDATION_API_BASE_URL}/api/recommendation/train`,
  status: `${RECOMMENDATION_API_BASE_URL}/api/recommendation/status`,
  evaluate: `${RECOMMENDATION_API_BASE_URL}/api/recommendation/evaluate`,
} as const;

/**
 * Main Backend API Service
 * - Port: 4000 (assumed, update if different)
 * - Service: Main application backend
 */
export const BACKEND_API_BASE_URL = import.meta.env.VITE_BACKEND_API_URL || "http://localhost:4000";
