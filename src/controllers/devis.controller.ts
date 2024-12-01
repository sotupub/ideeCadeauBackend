import { Request, Response } from 'express';
import { AppDataSource } from '../config/data-source';
import { Devis } from '../models/devis.entity';
import axios from 'axios';


export class DevisController {
    static async createDevis(req: Request, res: Response): Promise<Response> {
        const { name, email, phonenumber, message, recaptchaToken, company } = req.body;

        if (!name || !email || !phonenumber || !message ) {
            return res.status(400).json({ message: "All fields are required" });
        }

        try {

           /* // Vérifiez le captcha avec le service reCAPTCHA de Google
            const captchaResponse = await axios.post(`https://www.google.com/recaptcha/api/siteverify`, null, {
                params: {
                    secret: process.env.RECAPTCHA_SECRET_KEY,
                    response: recaptchaToken
                }
            });

            console.log('Captcha response:', captchaResponse.data);

            if (!captchaResponse.data.success) {
                return res.status(400).json({ message: "Captcha validation failed", errorCodes: captchaResponse.data['error-codes'] });
            }*/

            const devisRepository = AppDataSource.getRepository(Devis);

            const devis = new Devis();
            devis.name = name;
            devis.email = email;
            devis.phonenumber = phonenumber;
            devis.message = message;
            devis.company = company;

            await devisRepository.save(devis);

            return res.status(201).json(devis);
        } catch (error) {
            console.error('Error creating devis:', error);
            return res.status(500).json({ message: "Internal server error" });
        }
    }

    static async getAllDevis(req: Request, res: Response): Promise<Response> {
        const devisRepository = AppDataSource.getRepository(Devis);
    
        try {
          const deviss = await devisRepository.find();
          return res.status(200).json(deviss);
        } catch (error) {
          console.error('Error fetching devis:', error);
          return res.status(500).json({ message: "Internal server error" });
        }
    }

    static async getDevisById(req: Request, res: Response): Promise<Response> {
        const { id } = req.params;
        const devisRepository = AppDataSource.getRepository(Devis);
    
        try {
          const devis = await devisRepository.findOne({ where: { id } });
    
          if (!devis) {
            return res.status(404).json({ message: "Devis not found" });
          }
    
          return res.status(200).json(devis);
        } catch (error) {
          console.error('Error fetching devis by ID:', error);
          return res.status(500).json({ message: "Internal server error" });
        }
    }

    static async deleteMultipleDeviss(req: Request, res: Response): Promise<Response> {
        const { ids } = req.body;
    
        if (!Array.isArray(ids) || ids.length === 0) {
          return res.status(400).json({ message: "No devis IDs provided" });
        }
    
        const devisRepository = AppDataSource.getRepository(Devis);
    
        try {
          const deviss = await devisRepository.findByIds(ids);
    
          if (deviss.length === 0) {
            return res.status(404).json({ message: "No deviss found with the provided IDs" });
          }
    
          await devisRepository.remove(deviss);
    
          return res.status(200).json({ message: "Deviss deleted successfully", ids });
        } catch (error) {
          console.error('Error deleting deviss:', error);
          return res.status(500).json({ message: "Internal server error" });
        }
    }    

    static async updateDevisReadStatus(req: Request, res: Response): Promise<Response> {
        const { id, read } = req.body;

        if (typeof read !== 'boolean') {
            return res.status(400).json({ message: "Invalid read status" });
        }

        const devisRepository = AppDataSource.getRepository(Devis);

        try {
            const devis = await devisRepository.findOne({ where: { id } });

            if (!devis) {
                return res.status(404).json({ message: "Devis not found" });
            }

            devis.read = read;

            await devisRepository.save(devis);

            return res.status(200).json(devis);
        } catch (error) {
            console.error('Error updating devis read status:', error);
            return res.status(500).json({ message: "Internal server error" });
        }
    }


}