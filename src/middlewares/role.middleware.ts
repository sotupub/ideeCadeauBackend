import { NextFunction, Request, Response } from "express";
import { AppDataSource } from "../config/data-source";
import { User } from "../models/user.entity";

export const authorization = (roles: string[]) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    const userRepo = AppDataSource.getRepository(User);
    
    const user = await userRepo.findOne({
      where: { id: (req as any)["currentUser"].id },
    });
    
    console.log(user);
    
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    if (!roles.includes(user.role)) {
      return res.status(403).json({ message: "Forbidden" });
    }

    next();
  };
};
