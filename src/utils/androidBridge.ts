/**
 * Android Native & WebView Bridge Helper
 * Provides hardware back button listeners, haptic feedback,
 * direct Android WhatsApp intents, and native share sheet integration.
 */

export interface AndroidShareOptions {
  title: string;
  text: string;
  url?: string;
}

export class AndroidBridge {
  /**
   * Detects whether the app is running on an Android OS device or Android WebView
   */
  static isAndroidDevice(): boolean {
    if (typeof navigator === 'undefined') return false;
    const ua = navigator.userAgent || navigator.vendor || '';
    return /android/i.test(ua);
  }

  /**
   * Detects whether the app is running in standalone PWA / WebAPK mode on Android
   */
  static isStandaloneAndroidPwa(): boolean {
    if (typeof window === 'undefined') return false;
    const isStandalone =
      window.matchMedia('(display-mode: standalone)').matches ||
      // @ts-expect-error - navigator.standalone is iOS/Safari or older WebViews
      Boolean(navigator.standalone);
    return isStandalone && this.isAndroidDevice();
  }

  /**
   * Triggers Android tactile haptic vibration (supported on Chrome Android & Android WebViews)
   */
  static vibrate(pattern: number | number[] = 35): void {
    try {
      if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
        navigator.vibrate(pattern);
      }
    } catch {
      // Ignore if device permissions or hardware does not support vibration
    }
  }

  /**
   * Launches WhatsApp directly on Android using the native android URI scheme
   * Falls back to https://wa.me/ on other browsers or when native scheme fails
   */
  static openWhatsApp(phoneNumber: string, message: string): void {
    const cleanedDigits = phoneNumber.replace(/\D/g, '');
    const intlPhone = cleanedDigits.length === 10 ? `91${cleanedDigits}` : cleanedDigits;
    const encodedText = encodeURIComponent(message);

    // On Android, the direct whatsapp:// URI immediately wakes the WhatsApp Android app
    if (this.isAndroidDevice()) {
      const nativeScheme = `whatsapp://send?phone=${intlPhone}&text=${encodedText}`;
      const fallbackUrl = `https://wa.me/${intlPhone}?text=${encodedText}`;

      try {
        const start = Date.now();
        const iframe = document.createElement('iframe');
        iframe.style.display = 'none';
        iframe.src = nativeScheme;
        document.body.appendChild(iframe);

        setTimeout(() => {
          document.body.removeChild(iframe);
          // If native app did not intercept within 600ms, fallback to web URL
          if (Date.now() - start < 1500) {
            window.open(fallbackUrl, '_blank', 'noopener,noreferrer');
          }
        }, 600);
        return;
      } catch {
        window.open(fallbackUrl, '_blank', 'noopener,noreferrer');
        return;
      }
    }

    // Default web URL
    window.open(`https://wa.me/${intlPhone}?text=${encodedText}`, '_blank', 'noopener,noreferrer');
  }

  /**
   * Native Android Share Sheet (shares text, links, or files with WhatsApp, Gmail, etc.)
   */
  static async share(options: AndroidShareOptions): Promise<boolean> {
    this.vibrate(25);
    if (typeof navigator !== 'undefined' && navigator.share) {
      try {
        await navigator.share(options);
        return true;
      } catch {
        // User cancelled share or aborted
        return false;
      }
    }

    // Fallback: copy to clipboard
    try {
      await navigator.clipboard.writeText(`${options.title}\n\n${options.text}`);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Copies text to Android clipboard
   */
  static async copyToClipboard(text: string): Promise<boolean> {
    this.vibrate(20);
    try {
      if (typeof navigator !== 'undefined' && navigator.clipboard) {
        await navigator.clipboard.writeText(text);
        return true;
      }
      return false;
    } catch {
      return false;
    }
  }

  /**
   * Registers a callback for Android hardware / gesture back button
   */
  static onHardwareBack(callback: () => boolean | void): () => void {
    if (typeof window === 'undefined') return () => {};

    // Push dummy history state so Android back button can be intercepted
    window.history.pushState({ androidNav: true }, '');

    const handlePopState = (event: PopStateEvent) => {
      const handled = callback();
      if (handled) {
        // If the custom back action was handled (e.g. closed a modal), keep state in app
        window.history.pushState({ androidNav: true }, '');
        event.preventDefault?.();
      }
    };

    window.addEventListener('popstate', handlePopState);
    return () => {
      window.removeEventListener('popstate', handlePopState);
    };
  }
}
