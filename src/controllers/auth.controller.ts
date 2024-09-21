import { Request, Response } from "express";
import { AppDataSource } from "../config/data-source";
import { User } from "../models/user.entity";
import { encrypt } from "../helpers/helpers";
import { ERole } from "../models/enums/ERole";
import * as dotenv from "dotenv";
import EmailService from "../helpers/sendemail";

dotenv.config({ path: 'config.env' });

export class AuthController {

  static async signup(req: Request, res: Response) {
    const { firstname, lastname, email, password, role, phonenumber, address, city, zipCode, country } = req.body;

    if (!firstname || !lastname || !password || !phonenumber || !country || !address || !city) {
      return res.status(400).json({ message: "All fields are required" });
    }
    const userRepository = AppDataSource.getRepository(User);

    if (email) {
      const emailRegex = /^\S+@\S+\.\S+$/;
      if (!emailRegex.test(email)) {
        return res.status(400).json({ message: "Invalid email format" });
      }

      const existingEmail = await userRepository.findOneBy({ email });
      if (existingEmail) {
        return res.status(400).json({ message: "Email already exists" });
      }
    }


    const existingPhone = await userRepository.findOneBy({ phonenumber });
    if (existingPhone) {
      return res.status(400).json({ message: "Phonenumber already exists" });
    }

    if (password.length < 8) {
      return res.status(400).json({ message: "Password must be at least 8 characters long" });
    }

    if (!Object.values(ERole).includes(role)) {
      return res.status(400).json({ message: "Invalid role" });
    }

    const encryptedPassword = await encrypt.encryptpass(password);
    const user = new User();
    user.firstname = firstname;
    user.lastname = lastname;
    user.email = email;
    user.password = encryptedPassword;
    user.phonenumber = phonenumber
    user.role = role;
    user.address = address;
    user.city = city;
    user.zipCode = zipCode;
    user.country = country;

    await userRepository.save(user);

    return res
      .status(200)
      .json({ message: "User created successfully" });
  }

    static async login(req: Request, res: Response) {
    try {
      const { identifier, password } = req.body;
      if (!identifier || !password) {
        return res
          .status(500)
          .json({ message: "Identifier and password required" });
      }
  
      const userRepository = AppDataSource.getRepository(User);
      const user = await userRepository.findOne({
        where: [
          { email: identifier },
          { phonenumber: identifier }
        ]
      });
  
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
  
      const isPasswordValid = await encrypt.comparepassword(user.password, password);
      if (!isPasswordValid) {
        return res.status(404).json({ message: "Invalid password" });
      }
  
      const token = encrypt.generateToken({ id: user.id, role: user.role });
  
      return res.status(200).json({ message: "Login successful", token });
    } catch (error) {
      console.error(error);
      return res.status(500).json({ message: "Internal server error" });
    }
  }

  static async sendPasswordResetCode(req: Request, res: Response): Promise<Response> {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ message: "Email is required" });
    }

    const userRepository = AppDataSource.getRepository(User);

    try {
      const user = await userRepository.findOne({ where: { email } });

      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      const resetCode = Math.floor(100000 + Math.random() * 900000).toString();

      if (resetCode.length !== 6) {
        return res.status(500).json({ message: "Error generating reset code" });
      }

      const hashedResetCode = await encrypt.hashResetCode(resetCode);

      const resetCodeExpiration = new Date(Date.now() + 3600000); // 1 hour

      user.resetCode = hashedResetCode;
      user.resetCodeExpiration = resetCodeExpiration;

      await userRepository.save(user);

      await EmailService.sendEmail(email, resetCode);

      return res.status(200).json({ message: "Password reset code sent successfully" });
    } catch (error) {
      return res.status(500).json({ message: "Error sending password reset code", error });
    }
  }

  static async verifyResetCode(req: Request, res: Response): Promise<Response> {
    const { email, resetCode } = req.body;

    if (!email || !resetCode) {
      return res.status(400).json({ message: "Email and reset code are required" });
    }

    if (resetCode.length !== 6) {
      return res.status(400).json({ message: "Invalid reset code" });
    }

    const userRepository = AppDataSource.getRepository(User);

    try {
      const user = await userRepository.findOne({ where: { email } });

      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      // Check if reset code matches and is not expired
      const isCodeValid = encrypt.compareResetCode(user.resetCode, resetCode);
      if (!isCodeValid || new Date() > user.resetCodeExpiration) {
        return res.status(400).json({ message: "Invalid or expired reset code" });
      }

      return res.status(200).json({ message: "Reset code verified successfully" });
    } catch (error) {
      return res.status(500).json({ message: "Error verifying reset code", error });
    }
  }

  static async resetPassword(req: Request, res: Response): Promise<Response> {
    const { email, newPassword, resetCode } = req.body;

    if (!email || !newPassword || !resetCode) {
      return res.status(400).json({ message: "Email, new password and reset code are required" });
    }

    if (newPassword.length < 8) {
      return res.status(400).json({ message: "Password must be at least 8 characters long" });
    }

    if (resetCode.length !== 6) {
      return res.status(400).json({ message: "Invalid reset code" });
    }

    const userRepository = AppDataSource.getRepository(User);

    try {
      const user = await userRepository.findOne({ where: { email } });

      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      // Check if reset code matches and is not expired
      const isCodeValid = encrypt.compareResetCode(user.resetCode, resetCode);
      if (!isCodeValid || new Date() > user.resetCodeExpiration) {
        return res.status(400).json({ message: "Invalid or expired reset code" });
      }

      const hashedPassword = await encrypt.encryptpass(newPassword);

      user.password = hashedPassword;
      user.resetCode = null as any;
      user.resetCodeExpiration = null as any;

      await userRepository.save(user);

      return res.status(200).json({ message: "Password reset successfully" });
    } catch (error) {
      return res.status(500).json({ message: "Error resetting password", error });
    }
  }
}