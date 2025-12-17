import { InjectionToken } from '@angular/core';

// Token for injecting hl query parameter (can be used on both client and server)
export const SSR_HL_PARAM = new InjectionToken<string | undefined>('SSR_HL_PARAM');

