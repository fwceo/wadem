// Shared in-memory OTP store
// In production, replace with Redis or a database for multi-instance support
const otpStore = new Map<string, { code: string; expiresAt: number; attempts: number }>();

export default otpStore;
