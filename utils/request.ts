/**
 * Default request timeout in seconds
 */
export const DEFAULT_REQUEST_TIMEOUT_SECS = 60;

/**
 * HTTP method types
 */
export type HttpMethod = "GET" | "POST" | "PUT" | "DELETE" | "PATCH";

/**
 * HTTP request configuration
 */
export interface HttpRequestConfig {
  method: HttpMethod;
  headers?: Record<string, string>;
  data?: any;
  params?: Record<string, any>;
}

/**
 * Makes an HTTP request
 * @param url - Request URL
 * @param requestConfig - HTTP request configuration
 * @returns Promise<T>
 */
export async function request<T>(
  url: string,
  requestConfig: HttpRequestConfig
): Promise<T> {
  try {
    // Prepare fetch configuration
    const fetchConfig: RequestInit = {
      method: requestConfig.method,
      headers: {
        "Content-Type": "application/json",
        ...requestConfig.headers,
      },
    };

    // Debug: Log request details
    console.log("🌐 HTTP Request URL:", url);
    console.log("📋 HTTP Method:", requestConfig.method);
    console.log("📤 HTTP Headers:", fetchConfig.headers);

    // Add body for methods that support it
    if (
      requestConfig.data &&
      ["POST", "PUT", "PATCH"].includes(requestConfig.method)
    ) {
      fetchConfig.body = JSON.stringify(requestConfig.data);
      console.log("📦 HTTP Body:", fetchConfig.body);
    }

    // Add query parameters to URL if provided
    let requestUrl = url;
    if (requestConfig.params) {
      const searchParams = new URLSearchParams();
      Object.entries(requestConfig.params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          searchParams.append(key, String(value));
        }
      });
      requestUrl = `${url}?${searchParams.toString()}`;
      console.log("🔗 Final URL with params:", requestUrl);
    }

    // Make the request with timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(
      () => controller.abort(),
      DEFAULT_REQUEST_TIMEOUT_SECS * 1000
    );

    fetchConfig.signal = controller.signal;

    const response = await fetch(requestUrl, fetchConfig);
    clearTimeout(timeoutId);

    console.log("📥 HTTP Response status:", response.status);
    console.log(
      "📥 HTTP Response headers:",
      Object.fromEntries(response.headers.entries())
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error("❌ HTTP Error response body:", errorText);
      throw new Error(
        `HTTP request failed with status: ${response.status} - ${response.statusText}. Body: ${errorText}`
      );
    }

    const data = await response.json();
    console.log("✅ HTTP Response data:", data);
    return data as T;
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`HTTP request failed: ${error.message}`);
    }
    throw new Error("HTTP request failed with unknown error");
  }
}
