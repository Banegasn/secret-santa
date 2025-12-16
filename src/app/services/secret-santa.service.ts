import { Injectable } from '@angular/core';

export interface Participant {
  name: string;
  assignedTo: string;
  token: string;
}

@Injectable({
  providedIn: 'root'
})
export class SecretSantaService {
  private readonly SECRET_KEY = 'secret-santa-2024-key'; // In production, use environment variable

  /**
   * Shuffles array using Fisher-Yates algorithm
   */
  private shuffleArray<T>(array: T[]): T[] {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  }

  /**
   * Assigns Secret Santa pairs ensuring no one gets themselves
   */
  assignSecretSantas(names: string[]): Participant[] {
    if (names.length < 2) {
      throw new Error('Need at least 2 participants');
    }

    // Remove duplicates and empty names
    const uniqueNames = [...new Set(names.filter(name => name.trim().length > 0))];
    
    if (uniqueNames.length < 2) {
      throw new Error('Need at least 2 unique participants');
    }

    let participants: Participant[] = [];
    let attempts = 0;
    const maxAttempts = 100;

    // Try to create valid assignments
    while (attempts < maxAttempts) {
      const shuffled = this.shuffleArray(uniqueNames);
      participants = uniqueNames.map((name, index) => ({
        name,
        assignedTo: shuffled[index],
        token: ''
      }));

      // Check if assignment is valid (no one gets themselves)
      const isValid = participants.every(p => p.name !== p.assignedTo);
      
      if (isValid) {
        break;
      }
      
      attempts++;
    }

    // If still invalid after attempts, manually fix
    if (participants.some(p => p.name === p.assignedTo)) {
      // Last resort: rotate assignments
      const rotated = [...uniqueNames];
      rotated.push(rotated.shift()!);
      participants = uniqueNames.map((name, index) => ({
        name,
        assignedTo: rotated[index],
        token: ''
      }));
    }

    // Generate tokens for each participant
    return participants.map(p => ({
      ...p,
      token: this.encodeToken(p.name, p.assignedTo)
    }));
  }

  /**
   * Encodes participant data into a URL-safe token (compact format)
   */
  private encodeToken(name: string, assignedTo: string): string {
    // Use a compact format: encode both names with a delimiter
    // This is shorter than JSON encoding
    const data = `${name}|${assignedTo}`;
    // Base64URL encoding (URL-safe, no padding)
    const encoded = btoa(unescape(encodeURIComponent(data)))
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=/g, '');
    return encoded;
  }

  /**
   * Decodes token to get assigned person
   */
  decodeToken(token: string): { name: string; assignedTo: string } | null {
    try {
      // Restore base64 padding if needed
      let base64 = token.replace(/-/g, '+').replace(/_/g, '/');
      while (base64.length % 4) {
        base64 += '=';
      }
      
      const decoded = decodeURIComponent(escape(atob(base64)));
      // Split by delimiter
      const [name, assignedTo] = decoded.split('|');
      
      if (!name || !assignedTo) {
        return null;
      }
      
      return { name, assignedTo };
    } catch (error) {
      console.error('Failed to decode token:', error);
      return null;
    }
  }

  /**
   * Generates full URL for a participant
   */
  generateUrl(token: string, baseUrl: string = window.location.origin): string {
    return `${baseUrl}/reveal/${token}`;
  }
}

