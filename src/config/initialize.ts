import { getRepository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { User } from '../models/user.entity';
import { AppDataSource } from './data-source';
import { Equal } from 'typeorm';
import { ERole } from '../models/enums/ERole';
import { encrypt } from '../helpers/helpers';

export const test = async () => {
  try {
    console.log("entered");
    
    const userRepository = AppDataSource.getRepository(User);
    
    const existingAdmin = await userRepository.count({ where: { role: ERole.ADMIN } });
    console.log(existingAdmin);
    
    // Check if there are less than 1 admin, create the default ones
    if (existingAdmin < 1) {
      const encryptedPassword = await encrypt.encryptpass("admin123");
        const user = new User();
        user.firstname = "admin";
        user.lastname = "ADMIN";
        user.email = "admin@gmail.com";
        user.password = encryptedPassword;
        user.phonenumber = 12345678
        user.role = ERole.ADMIN;
    
        await userRepository.save(user);
        console.log("created");
        
    }
    
  } catch (error) {
    console.error('Error creating default admin:', error);
  }
};