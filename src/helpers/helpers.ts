import * as jwt from "jsonwebtoken";
import * as bcrypt from "bcrypt";
import * as dotenv from "dotenv";

dotenv.config({ path: 'config.env' });
const { JWT_SECRET = "" } = process.env;

type payload = {
    id: string;
    role: string;
};

export class encrypt {
  static async encryptpass(password: string) {
    return bcrypt.hashSync(password, 12);
  }

  static comparepassword(hashPassword: string, password: string) {
    return bcrypt.compareSync(password, hashPassword);
  }

  static generateToken(payload: payload) {
    return jwt.sign(payload, JWT_SECRET, { expiresIn: "30d" });
  }

  static async hashResetCode(resetCode: string) {
    return bcrypt.hashSync(resetCode, 12);
  }

  static compareResetCode(hashResetCode: string, resetCode: string) {
    return bcrypt.compareSync(resetCode, hashResetCode);
  }

  static verifyToken(token: string) {
    try {
      return jwt.verify(token, JWT_SECRET);
    } catch (error) {
      return null; 
    }
  }
}