import { NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';
import { sendEmail } from '../../../lib/sendEmail';

export async function POST(request) {
  try {
    const { email } = await request.json();

    // Validate email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json({ error: 'Invalid email address' }, { status: 400 });
    }

    // Store email in JSON file
    const filePath = path.join(process.cwd(), 'data', 'notify_emails.json');
    let emails = [];
    try {
      const fileData = await fs.readFile(filePath, 'utf-8');
      emails = JSON.parse(fileData);
    } catch (err) {
      // File doesn't exist yet
    }
    emails.push({ email, timestamp: new Date().toISOString() });
    await fs.mkdir(path.dirname(filePath), { recursive: true });
    await fs.writeFile(filePath, JSON.stringify(emails, null, 2));

    // Send confirmation email to user
    await sendEmail({
      to: email,
      subject: 'Thank You for Signing Up!',
      html: `
        <h1>Welcome to Iris Education!</h1>
        <p>Dear User,</p>
        <p>Thank you for signing up for updates from Iris Education & Training. We'll notify you when our platform launches.</p>
        <p>Best regards,<br>Iris Education Team</p>
      `,
    });

    // Send notification email to admin
    await sendEmail({
      to: process.env.ADMIN_EMAIL,
      subject: 'New Notify Me Submission',
      html: `
        <h1>New Notify Me Submission</h1>
        <p>A new user has signed up for updates:</p>
        <p><strong>Email:</strong> ${email}</p>
        <p>Please follow up as needed.</p>
        <p>Best regards,<br>Iris Education System</p>
      `,
    });

    return NextResponse.json({ message: 'Email submitted successfully' });
  } catch (error) {
    console.error('Error processing email:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}