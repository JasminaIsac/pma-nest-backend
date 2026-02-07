import { Injectable } from '@nestjs/common';
import * as crypto from 'crypto';

@Injectable()
export class EncryptionService {
  private algorithm = 'aes-256-cbc';
  private encryptionKey = process.env.ENCRYPTION_KEY || 'default-encryption-key-32-chars-long!';

  /**
   * Encrypts a message using AES-256-CBC
   * @param plaintext - The message to encrypt
   * @returns Encrypted message in format: iv:encryptedData (base64 encoded)
   */
  encrypt(plaintext: string): string {
    // Generate random IV (Initialization Vector)
    const iv = crypto.randomBytes(16);
    
    // Ensure key is exactly 32 bytes
    const key = Buffer.from(this.encryptionKey.substring(0, 32).padEnd(32, '0'));
    
    // Create cipher
    const cipher = crypto.createCipheriv(this.algorithm, key, iv);
    
    // Encrypt the message
    let encrypted = cipher.update(plaintext, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    
    // Return IV and encrypted data combined (IV:encryptedData in base64)
    const combined = iv.toString('hex') + ':' + encrypted;
    return Buffer.from(combined).toString('base64');
  }

  /**
   * Decrypts an encrypted message
   * @param ciphertext - The encrypted message in format: iv:encryptedData (base64 encoded)
   * @returns Decrypted message
   */
  // encryption.service.ts

  decrypt(ciphertext: string): string {
    if (!ciphertext) return '';
    
    try {
      // 1. Încercăm să decodăm din base64
      const combined = Buffer.from(ciphertext, 'base64').toString('utf8');
      
      // 2. Verificăm dacă are structura așteptată iv:encrypted
      if (!combined.includes(':')) {
        return ciphertext; // Nu pare a fi un mesaj criptat, returnăm textul brut
      }

      const parts = combined.split(':');
      if (parts.length !== 2) return ciphertext;

      const iv = Buffer.from(parts[0], 'hex');
      const encrypted = parts[1];
      
      const key = Buffer.from(this.encryptionKey.substring(0, 32).padEnd(32, '0'));
      const decipher = crypto.createDecipheriv(this.algorithm, key, iv);
      
      let decrypted = decipher.update(encrypted, 'hex', 'utf8');
      decrypted += decipher.final('utf8');
      
      return decrypted;
    } catch (error) {
      // În loc să aruncăm eroare, logăm problema și returnăm textul original
      console.warn('⚠️ Decryption failed for a message. Returning raw data: ', error);
      return ciphertext; 
    }
  }
}
