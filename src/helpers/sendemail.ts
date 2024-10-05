import nodemailer from 'nodemailer';

class EmailService {
   static async sendEmail(email: string, subject: string, text: string): Promise<void> {
	const transporter = nodemailer.createTransport({
	  service: 'Gmail',
	  auth: {
		user: process.env.SMTP_USER,
		pass: process.env.SMTP_PASS,
	  },
	});

	const mailOptions = {
	  from: process.env.SMTP_USER,
	  to: email,
	  subject: subject,
	  text: text,
	};

	await transporter.sendMail(mailOptions);
  }
}

export default EmailService;