/**
 * Minimal typings for the Google Identity Services client script
 * (`https://accounts.google.com/gsi/client`). Only the surface this app
 * actually uses is declared — see https://developers.google.com/identity/gsi/web.
 */
export {};

declare global {
  interface Window {
    google?: {
      accounts: {
        id: {
          initialize(config: GoogleIdConfiguration): void;
          renderButton(parent: HTMLElement, options: GoogleButtonOptions): void;
          prompt(momentListener?: (notification: GooglePromptMomentNotification) => void): void;
          disableAutoSelect(): void;
        };
      };
    };
  }

  interface GoogleIdConfiguration {
    client_id: string;
    callback: (response: GoogleCredentialResponse) => void;
    auto_select?: boolean;
    cancel_on_tap_outside?: boolean;
  }

  interface GoogleCredentialResponse {
    /** The Google ID token (JWT) — this is the only value the app forwards to the backend. */
    credential: string;
    select_by?: string;
  }

  interface GoogleButtonOptions {
    type?: 'standard' | 'icon';
    theme?: 'outline' | 'filled_blue' | 'filled_black';
    size?: 'large' | 'medium' | 'small';
    text?: 'signin_with' | 'signup_with' | 'continue_with' | 'signin';
    shape?: 'rectangular' | 'pill' | 'circle' | 'square';
    logo_alignment?: 'left' | 'center';
    width?: number | string;
  }

  interface GooglePromptMomentNotification {
    isNotDisplayed(): boolean;
    isSkippedMoment(): boolean;
    isDismissedMoment(): boolean;
    getNotDisplayedReason(): string;
    getSkippedReason(): string;
    getDismissedReason(): string;
  }
}
