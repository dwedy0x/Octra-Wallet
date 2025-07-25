import { Wallet } from '../types/wallet';
import { generateMnemonic, validateMnemonic, generateWalletFromMnemonic, bufferToBase64, bufferToHex, createOctraAddress } from './crypto';
import * as nacl from 'tweetnacl';

export async function generateWallet(): Promise<Wallet> {
  let attempts = 0;
  const maxAttempts = 50;
  
  while (attempts < maxAttempts) {
    try {
      const mnemonic = generateMnemonic();
      const walletData = await generateWalletFromMnemonic(mnemonic);
      
      // Verify the address is exactly 47 characters
      if (walletData.address.length === 47) {
        return {
          address: walletData.address,
          privateKey: walletData.privateKey,
          mnemonic: walletData.mnemonic,
          publicKey: walletData.publicKey
        };
      }
      
      console.warn(`Generated address with invalid length: ${walletData.address.length}, retrying...`);
      attempts++;
    } catch (error) {
      console.error('Error generating wallet:', error);
      attempts++;
    }
  }
  
  throw new Error('Failed to generate valid wallet after maximum attempts');
}

export async function importWalletFromPrivateKey(privateKey: string): Promise<Wallet> {
  let cleanKey = privateKey.trim();
  
  // Handle only base64 format
  let keyBuffer: Buffer;
  
  // Base64 format only
  try {
    keyBuffer = Buffer.from(cleanKey, 'base64');
    if (keyBuffer.length !== 32) {
      throw new Error('Invalid private key length. Must be 32 bytes in base64 format.');
    }
  } catch (error) {
    throw new Error('Invalid private key format. Must be valid base64.');
  }
  
  // Verify the private key by creating a keypair
  try {
    const keyPair = nacl.sign.keyPair.fromSeed(keyBuffer);
    const publicKey = Buffer.from(keyPair.publicKey);
    const address = await createOctraAddress(publicKey);
    
    return {
      address,
      privateKey: bufferToBase64(keyBuffer),
      publicKey: bufferToHex(publicKey)
    };
  } catch (error) {
    throw new Error('Failed to create wallet from private key');
  }
}

export async function importWalletFromMnemonic(mnemonic: string): Promise<Wallet> {
  const words = mnemonic.trim().split(/\s+/);
  
  if (words.length !== 12 && words.length !== 24) {
    throw new Error('Invalid mnemonic length. Must be 12 or 24 words.');
  }
  
  if (!validateMnemonic(mnemonic)) {
    throw new Error('Invalid mnemonic phrase');
  }
  
  const walletData = await generateWalletFromMnemonic(mnemonic);
  
  return {
    address: walletData.address,
    privateKey: walletData.privateKey,
    mnemonic: walletData.mnemonic,
    publicKey: walletData.publicKey
  };
}

export function getWalletBalance(address: string): Promise<number> {
  // This would connect to the actual blockchain
  // For now, return a mock balance
  return Promise.resolve(Math.random() * 100);
}