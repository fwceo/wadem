import { initializeApp, getApps, getApp, type FirebaseApp } from 'firebase/app';
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInWithPhoneNumber,
  RecaptchaVerifier,
  updateProfile,
  type Auth,
  type UserCredential,
  type ConfirmationResult,
} from 'firebase/auth';

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

let _app: FirebaseApp | null = null;
let _auth: Auth | null = null;

function getFirebaseApp(): FirebaseApp {
  if (_app) return _app;
  _app = getApps().length ? getApp() : initializeApp(firebaseConfig);
  return _app;
}

function getFirebaseAuth(): Auth {
  if (_auth) return _auth;
  _auth = getAuth(getFirebaseApp());
  return _auth;
}

export async function signUpWithEmail(email: string, password: string, name?: string): Promise<UserCredential> {
  const result = await createUserWithEmailAndPassword(getFirebaseAuth(), email, password);
  if (name && result.user) {
    await updateProfile(result.user, { displayName: name });
  }
  return result;
}

export async function signInWithEmail(email: string, password: string): Promise<UserCredential> {
  return signInWithEmailAndPassword(getFirebaseAuth(), email, password);
}

export async function signInWithGoogle() {
  const provider = new GoogleAuthProvider();
  return signInWithPopup(getFirebaseAuth(), provider);
}

// Test phone number — only exposed in development builds
const TEST_PHONE = process.env.NODE_ENV === 'development' ? '+9647501234567' : '';
const TEST_OTP = process.env.NODE_ENV === 'development' ? '123456' : '';

export function setupRecaptcha(elementId: string): RecaptchaVerifier {
  const auth = getFirebaseAuth();
  return new RecaptchaVerifier(auth, elementId, {
    size: 'invisible',
    callback: () => {},
  });
}

export async function sendPhoneOTP(phone: string, recaptchaVerifier: RecaptchaVerifier): Promise<ConfirmationResult> {
  const auth = getFirebaseAuth();
  // For test number, skip real OTP in development
  if (phone === TEST_PHONE && process.env.NODE_ENV === 'development') {
    // Firebase test numbers are configured in the Firebase Console
    // This just sends the OTP normally — the test number auto-verifies with TEST_OTP
  }
  return signInWithPhoneNumber(auth, phone, recaptchaVerifier);
}

export { type UserCredential, type ConfirmationResult, TEST_PHONE, TEST_OTP };
