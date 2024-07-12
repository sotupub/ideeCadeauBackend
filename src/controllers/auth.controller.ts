import { Request, Response } from "express";
import { AppDataSource } from "../config/data-source";
import { User } from "../models/user.entity";
import { encrypt } from "../helpers/helpers";
import { ERole } from "../models/enums/ERole";

export class AuthController {
    
    static async signup(req: Request, res: Response) {
        const { firstname,lastname, email, password, role } = req.body;
        if (!firstname || !email || !password ) {
            return res.status(400).json({ message: "All fields are required" });
        }
        const userRepository = AppDataSource.getRepository(User);
        
        const emailRegex = /^\S+@\S+\.\S+$/;
        if (!emailRegex.test(email)) {
            return res.status(400).json({ message: "Invalid email format" });
        }

        const existingEmail = await userRepository.findOneBy({ email });
        if (existingEmail) {
            return res.status(400).json({ message: "Email already exists" });
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
        user.role = role;
    
        await userRepository.save(user);
    
        return res
          .status(200)
          .json({ message: "User created successfully", user });
    }   

  static async login(req: Request, res: Response) {
    try {
      const { email, password } = req.body;
      if (!email || !password) {
        return res
          .status(500)
          .json({ message: "email and password required" });
      }

      const userRepository = AppDataSource.getRepository(User);
      const user = await userRepository.findOne({ where: { email } });
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      const isPasswordValid = encrypt.comparepassword(user.password, password);
      if (!isPasswordValid) {
        return res.status(404).json({ message: "Invalid password" });
      }
      
      const token = encrypt.generateToken({ id: user.id });

      return res.status(200).json({ message: "Login successful", user, token });
    } catch (error) {
      console.error(error);
      return res.status(500).json({ message: "Internal server error" });
    }
  }
}