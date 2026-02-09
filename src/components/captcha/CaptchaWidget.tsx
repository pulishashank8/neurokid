"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { getCaptchaConfig } from "@/lib/captcha-client";

interface CaptchaWidgetProps {
  onVerify: (token: string | null) => void;
  onError?: (error: string) => void;
  onExpire?: () => void;
  theme?: "light" | "dark";
  size?: "normal" | "compact";
  tabindex?: number;
}

// Global type declarations for CAPTCHA providers
declare global {
  interface Window {
    hcaptcha?: {
      render: (
        container: string | HTMLElement,
        options: {
          sitekey: string;
          theme?: string;
          size?: string;
          tabindex?: number;
          callback?: (token: string) => void;
          "error-callback"?: () => void;
          "expired-callback"?: () => void;
        }
      ) => string;
      reset: (widgetId?: string) => void;
      remove: (widgetId?: string) => void;
    };
    grecaptcha?: {
      ready: (callback: () => void) => void;
      render: (
        container: string | HTMLElement,
        options: {
          sitekey: string;
          theme?: string;
          size?: string;
          tabindex?: number;
          callback?: (token: string) => void;
          "error-callback"?: () => void;
          "expired-callback"?: () => void;
        }
      ) => string;
      reset: (widgetId?: string) => void;
      execute: (siteKey?: string, options?: { action: string }) => Promise<string>;
    };
    onloadHCaptchaCallback?: () => void;
    onloadReCaptchaCallback?: () => void;
  }
}

export function CaptchaWidget({
  onVerify,
  onError,
  onExpire,
  theme = "light",
  size: propSize,
  tabindex = 0,
}: CaptchaWidgetProps) {
  // Auto-detect mobile for responsive sizing
  const [isMobile, setIsMobile] = useState(false);
  
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 640); // sm breakpoint
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);
  
  // Use compact size on mobile
  const size = propSize || (isMobile ? "compact" : "normal");
  const containerRef = useRef<HTMLDivElement>(null);
  const widgetIdRef = useRef<string | null>(null);
  const [config, setConfig] = useState<{ enabled: boolean; provider: string; siteKey: string | null } | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  // Fetch CAPTCHA configuration
  useEffect(() => {
    const fetchConfig = async () => {
      try {
        const captchaConfig = await getCaptchaConfig();
        setConfig(captchaConfig);
      } catch (error) {
        console.error("Failed to load CAPTCHA config:", error);
        setLoadError("Failed to load CAPTCHA configuration");
        onError?.("Failed to load CAPTCHA configuration");
      } finally {
        setIsLoading(false);
      }
    };
    fetchConfig();
  }, [onError]);

  // Load CAPTCHA script
  useEffect(() => {
    if (!config?.enabled || !config.siteKey) return;

    const scriptId = `captcha-script-${config.provider}`;
    
    // Check if script already exists
    if (document.getElementById(scriptId)) {
      initializeCaptcha();
      return;
    }

    const script = document.createElement("script");
    script.id = scriptId;
    script.async = true;
    script.defer = true;

    if (config.provider === "hcaptcha") {
      script.src = "https://js.hcaptcha.com/1/api.js?render=explicit&onload=onloadHCaptchaCallback";
      window.onloadHCaptchaCallback = () => {
        initializeCaptcha();
      };
    } else {
      // reCAPTCHA
      script.src = "https://www.google.com/recaptcha/api.js?render=explicit&onload=onloadReCaptchaCallback";
      window.onloadReCaptchaCallback = () => {
        initializeCaptcha();
      };
    }

    script.onerror = () => {
      setLoadError(`Failed to load ${config.provider} script`);
      onError?.(`Failed to load ${config.provider} script`);
    };

    document.head.appendChild(script);

    return () => {
      // Cleanup widget on unmount
      if (widgetIdRef.current) {
        if (config.provider === "hcaptcha" && window.hcaptcha) {
          window.hcaptcha.remove(widgetIdRef.current);
        } else if (config.provider === "recaptcha" && window.grecaptcha) {
          window.grecaptcha.reset(widgetIdRef.current);
        }
      }
    };
  }, [config?.enabled, config?.siteKey, config?.provider]);

  const initializeCaptcha = useCallback(() => {
    if (!containerRef.current || !config?.siteKey) return;

    try {
      const options = {
        sitekey: config.siteKey,
        theme,
        size,
        tabindex,
        callback: (token: string) => {
          onVerify(token);
        },
        "error-callback": () => {
          setLoadError("CAPTCHA verification error");
          onError?.("CAPTCHA verification error");
          onVerify(null);
        },
        "expired-callback": () => {
          onVerify(null);
          onExpire?.();
        },
      };

      if (config.provider === "hcaptcha" && window.hcaptcha) {
        widgetIdRef.current = window.hcaptcha.render(containerRef.current, options);
      } else if (config.provider === "recaptcha" && window.grecaptcha) {
        widgetIdRef.current = window.grecaptcha.render(containerRef.current, options);
      }
    } catch (error) {
      console.error("Failed to initialize CAPTCHA:", error);
      setLoadError("Failed to initialize CAPTCHA");
      onError?.("Failed to initialize CAPTCHA");
    }
  }, [config, theme, size, tabindex, onVerify, onError, onExpire]);

  // Reset function exposed via ref-like pattern
  const reset = useCallback(() => {
    if (!widgetIdRef.current || !config?.provider) return;

    if (config.provider === "hcaptcha" && window.hcaptcha) {
      window.hcaptcha.reset(widgetIdRef.current);
    } else if (config.provider === "recaptcha" && window.grecaptcha) {
      window.grecaptcha.reset(widgetIdRef.current);
    }
    onVerify(null);
  }, [config?.provider, onVerify]);

  // Expose reset function globally for testing
  useEffect(() => {
    (CaptchaWidget as unknown as { reset: () => void }).reset = reset;
  }, [reset]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-4 border border-gray-200 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-800">
        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-emerald-500"></div>
        <span className="ml-2 text-sm text-gray-600 dark:text-gray-400">Loading verification...</span>
      </div>
    );
  }

  // If CAPTCHA is not configured, show a warning in development
  if (!config?.enabled) {
    if (process.env.NODE_ENV === "development") {
      return (
        <div className="p-3 border border-amber-200 dark:border-amber-800 rounded-lg bg-amber-50 dark:bg-amber-900/20">
          <p className="text-xs text-amber-700 dark:text-amber-400">
            ⚠️ CAPTCHA not configured. Set CAPTCHA_PROVIDER, CAPTCHA_SECRET_KEY, and NEXT_PUBLIC_CAPTCHA_SITE_KEY in your .env file.
          </p>
        </div>
      );
    }
    // In production without config, don't render anything (will fail on server)
    return null;
  }

  if (loadError) {
    return (
      <div className="p-3 border border-rose-200 dark:border-rose-800 rounded-lg bg-rose-50 dark:bg-rose-900/20">
        <p className="text-xs text-rose-700 dark:text-rose-400">
          ⚠️ {loadError}. Please refresh the page and try again.
        </p>
      </div>
    );
  }

  return (
    <div className="captcha-widget w-full">
      <div 
        ref={containerRef} 
        className="captcha-container flex justify-center sm:justify-start overflow-x-auto" 
        data-testid="captcha-container" 
      />
      <p className="mt-2 text-xs text-gray-500 dark:text-gray-400 text-center sm:text-left">
        This site is protected by {config.provider === "hcaptcha" ? "hCaptcha" : "reCAPTCHA"} and its 
        <a 
          href={config.provider === "hcaptcha" 
            ? "https://www.hcaptcha.com/privacy" 
            : "https://policies.google.com/privacy"
          } 
          target="_blank" 
          rel="noopener noreferrer"
          className="text-emerald-600 dark:text-emerald-400 hover:underline mx-1"
        >
          Privacy Policy
        </a>
        and
        <a 
          href={config.provider === "hcaptcha" 
            ? "https://www.hcaptcha.com/terms" 
            : "https://policies.google.com/terms"
          } 
          target="_blank" 
          rel="noopener noreferrer"
          className="text-emerald-600 dark:text-emerald-400 hover:underline mx-1"
        >
          Terms of Service
        </a>
        apply.
      </p>
    </div>
  );
}

// Static reset method for programmatic resets
CaptchaWidget.reset = () => {
  // This will be overridden by the component instance
};

export default CaptchaWidget;
