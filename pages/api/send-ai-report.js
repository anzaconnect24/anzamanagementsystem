import nodemailer from 'nodemailer';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { toEmail, pdfBase64, entrepreneurName, businessName } = req.body;
  if (!toEmail || !pdfBase64) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  try {
    // Configure transporter (use environment variables for security)
    const transporter = nodemailer.createTransport({
      service: 'gmail', // or your SMTP provider
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    // Email content
    const mailOptions = {
      from: `Anza Management <${process.env.EMAIL_USER}>`,
      to: toEmail,
      subject: 'Your AI Analysis Report',
      html: `
        <div style="font-family: 'Inter', Arial, sans-serif;">
          <h2 style="color: #2563eb;">AI Analysis Report Ready</h2>
          <p>Dear ${entrepreneurName || 'Entrepreneur'},</p>
          <p>Your latest AI analysis report for <b>${businessName || 'your business'}</b> is ready. Please find the attached PDF report for your review.</p>
          <p>If you have any questions, feel free to contact your administrator.</p>
          <br/>
          <p style="color: #6b7280; font-size: 0.95em;">Best regards,<br/>Anza Management Team</p>
        </div>
      `,
      attachments: [
        {
          filename: 'AI_Analysis_Report.pdf',
          content: Buffer.from(pdfBase64, 'base64'),
          contentType: 'application/pdf',
        },
      ],
    };

    await transporter.sendMail(mailOptions);
    return res.status(200).json({ success: true });
  } catch (error) {
    console.error('Email send error:', error);
    return res.status(500).json({ error: 'Failed to send email' });
  }
} 