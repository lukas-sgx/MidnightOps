import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "change_me";

type JwtPayload = {
  userId: number;
  email: string;
};

function verifyToken(token: string): JwtPayload | null {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as JwtPayload;
    return decoded;
  } catch (err) {
    console.error("Token verification failed:", err);
    return null;
  }
} 

export function authenticateToken(
  token: string
): JwtPayload | null {
  return verifyToken(token);
}

export function generateToken(payload: JwtPayload): string {
  return jwt.sign(payload, JWT_SECRET, {
    expiresIn: "1d",
  });
}