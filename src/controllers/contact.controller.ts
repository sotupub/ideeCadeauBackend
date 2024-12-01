import { Request, Response } from 'express';
import { AppDataSource } from '../config/data-source';
import { Contact } from '../models/contact.entity';
import axios from 'axios';


export class ContactController {
    static async createContact(req: Request, res: Response): Promise<Response> {
        const { name, email, phonenumber, message, recaptchaToken } = req.body;

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

            const contactRepository = AppDataSource.getRepository(Contact);

            const contact = new Contact();
            contact.name = name;
            contact.email = email;
            contact.phonenumber = phonenumber;
            contact.message = message;

            await contactRepository.save(contact);

            return res.status(201).json(contact);
        } catch (error) {
            console.error('Error creating contact:', error);
            return res.status(500).json({ message: "Internal server error" });
        }
    }

    static async getAllContacts(req: Request, res: Response): Promise<Response> {
        const contactRepository = AppDataSource.getRepository(Contact);
    
        try {
          const contacts = await contactRepository.find();
          return res.status(200).json(contacts);
        } catch (error) {
          console.error('Error fetching contacts:', error);
          return res.status(500).json({ message: "Internal server error" });
        }
    }

    static async getContactById(req: Request, res: Response): Promise<Response> {
        const { id } = req.params;
        const contactRepository = AppDataSource.getRepository(Contact);
    
        try {
          const contact = await contactRepository.findOne({ where: { id } });
    
          if (!contact) {
            return res.status(404).json({ message: "Contact not found" });
          }
    
          return res.status(200).json(contact);
        } catch (error) {
          console.error('Error fetching contact by ID:', error);
          return res.status(500).json({ message: "Internal server error" });
        }
    }

    static async deleteMultipleContacts(req: Request, res: Response): Promise<Response> {
        const { ids } = req.body;
    
        if (!Array.isArray(ids) || ids.length === 0) {
          return res.status(400).json({ message: "No contact IDs provided" });
        }
    
        const contactRepository = AppDataSource.getRepository(Contact);
    
        try {
          const contacts = await contactRepository.findByIds(ids);
    
          if (contacts.length === 0) {
            return res.status(404).json({ message: "No contacts found with the provided IDs" });
          }
    
          await contactRepository.remove(contacts);
    
          return res.status(200).json({ message: "Contacts deleted successfully", ids });
        } catch (error) {
          console.error('Error deleting contacts:', error);
          return res.status(500).json({ message: "Internal server error" });
        }
    }    

    static async updateContactReadStatus(req: Request, res: Response): Promise<Response> {
        const { id, read } = req.body;

        if (typeof read !== 'boolean') {
            return res.status(400).json({ message: "Invalid read status" });
        }

        const contactRepository = AppDataSource.getRepository(Contact);

        try {
            const contact = await contactRepository.findOne({ where: { id } });

            if (!contact) {
                return res.status(404).json({ message: "Contact not found" });
            }

            contact.read = read;

            await contactRepository.save(contact);

            return res.status(200).json(contact);
        } catch (error) {
            console.error('Error updating contact read status:', error);
            return res.status(500).json({ message: "Internal server error" });
        }
    }


}