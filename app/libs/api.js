import axios from 'axios';

/**
 * HTTP client wrapper for making requests using axios.
 * Supports GET, POST, PUT, and PATCH methods with documentation.
 */
class HttpClient {
  /**
   * Initializes the HTTP client with optional configuration.
   * @param {import('axios').CreateAxiosDefaults} [config={}] - Optional axios configuration (e.g., baseURL, headers, timeout).
   */
  constructor(config = {}) {
    this.client = axios.create(config);
  }

  /**
   * Sends a GET request to the specified URL.
   * @param {string} url - The endpoint URL.
   * @param {Object} [config] - Optional axios configuration (e.g., headers, params).
   * @returns {Promise} A promise that resolves with the response data.
   */
  async get(url, config = {}) {
    try {
      const response = await this.client.get(url, config);
      return response.data;
    } catch (error) {
      throw new Error(`GET request failed: ${error.message}`);
    }
  }

  /**
   * Sends a POST request to the specified URL.
   * @param {string} url - The endpoint URL.
   * @param {Object} data - The payload to send in the request body.
   * @param {Object} [config] - Optional axios configuration (e.g., headers).
   * @returns {Promise} A promise that resolves with the response data.
   */
  async post(url, data, config = {}) {
    try {
      const response = await this.client.post(url, data, config);
      return response.data;
    } catch (error) {
      throw new Error(`POST request failed: ${error.message}`);
    }
  }

  /**
   * Sends a PUT request to the specified URL.
   * @param {string} url - The endpoint URL.
   * @param {Object} data - The payload to send in the request body.
   * @param {Object} [config] - Optional axios configuration (e.g., headers).
   * @returns {Promise} A promise that resolves with the response data.
   */
  async put(url, data, config = {}) {
    try {
      const response = await this.client.put(url, data, config);
      return response.data;
    } catch (error) {
      throw new Error(`PUT request failed: ${error.message}`);
    }
  }

  /**
   * Sends a PATCH request to the specified URL.
   * @param {string} url - The endpoint URL.
   * @param {Object} data - The payload to send in the request body.
   * @param {Object} [config] - Optional axios configuration (e.g., headers).
   * @returns {Promise} A promise that resolves with the response data.
   */
  async patch(url, data, config = {}) {
    try {
      const response = await this.client.patch(url, data, config);
      return response.data;
    } catch (error) {
      throw new Error(`PATCH request failed: ${error.message}`);
    }
  }

  /**
   * Sends a DELETE request to the specified URL.
   * @param {string} url - The endpoint URL.
   * @param {Object} [config] - Optional axios configuration (e.g., headers).
   * @returns {Promise} A promise that resolves with the response data.
   */
  async delete(url, config = {}) {
    try {
      const response = await this.client.delete(url, config);
      return response.data;
    } catch (error) {
      throw new Error(`DELETE request failed: ${error.message}`);
    }
  }
}

const client = new HttpClient({
  baseURL: import.meta.env.VITE_BACKEND_URL,
});
export default client;
