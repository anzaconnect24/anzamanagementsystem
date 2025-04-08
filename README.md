# Anza Connect

Anza Connect is a platform designed to bridge the gap between entrepreneurs and investors, creating opportunities for collaboration, mentorship, and funding. The system provides personalized dashboards for **entrepreneurs**, **investors**, **mentors**, and **reviewers**, offering tailored functionalities to streamline interactions and enhance productivity.

---

## Features

### For Entrepreneurs
- **Registration**: Create detailed profiles showcasing business ideas, goals, and funding needs.
- **Dashboard**: Track funding progress, manage mentorship sessions, and interact with investors.
- **Pitch Submission**: Submit business proposals for review.
- **Notifications**: Stay updated on feedback, investor interest, and upcoming mentorship sessions.

### For Investors
- **Search and Filter**: Discover entrepreneurs based on industry, stage, or funding requirements.
- **Dashboard**: View submitted pitches, track investments, and communicate with entrepreneurs.
- **Review and Feedback**: Evaluate proposals and provide constructive feedback.
- **Portfolio Management**: Monitor funded projects and their performance.

### For Mentors
- **Connect with Entrepreneurs**: Schedule mentorship sessions and track progress.
- **Dashboard**: Manage assigned entrepreneurs and view session history.
- **Resource Sharing**: Provide educational resources to entrepreneurs.

### For Reviewers
- **Proposal Assessment**: Review and evaluate business proposals.
- **Dashboard**: Track assigned proposals, submit reviews, and recommend next steps.

---

## Tech Stack

- **Frontend**: [Next.js](https://nextjs.org/) for building a fast, SEO-friendly user interface.
- **Backend**: Node.js with APIs for managing data and logic.
- **Database**: MySQL for data persistence.
- **Styling**: Tailwind CSS for a responsive and modern design.
- **Authentication**: Secure login and role-based access using JWT.
- **Deployment**: Hosted on [Vercel](https://vercel.com/) and VPS for backend services.

---

## Installation and Setup

### Prerequisites
Ensure you have the following installed:
- Node.js (v16 or higher)
- npm or yarn

### Steps

1. **Clone the Repository**
   ```bash
   git clone https://github.com/yourusername/anza-connect.git
   ```

2. **Navigate to the Project Directory**
   ```bash
   cd anza-connect
   ```

3. **Install Dependencies**
   ```bash
   npm install
   ```

4. **Set Up Environment Variables**
   Create a `.env.local` file in the root directory and add the following:
   ```env
   DATABASE_URL=mysql://user:password@host:port/database
   JWT_SECRET=your_jwt_secret
   NEXT_PUBLIC_API_URL=http://localhost:3000/api
   ```

5. **Run the Development Server**
   ```bash
   npm run dev
   ```
   The app will be available at [http://localhost:3000](http://localhost:3000).

---

## Folder Structure

```
anza-connect/
├── public/          # Static assets
├── src/
│   ├── components/  # Reusable React components
│   ├── pages/       # Next.js pages
│   ├── styles/      # Tailwind CSS configuration
│   ├── utils/       # Helper functions
│   └── hooks/       # Custom React hooks
├── .env.local       # Environment variables
├── package.json     # Dependencies and scripts
└── README.md        # Project documentation
```

---

## Scripts

- **`npm run dev`**: Starts the development server.
- **`npm run build`**: Builds the application for production.
- **`npm start`**: Runs the built application.
- **`npm run lint`**: Lints the code for errors and style issues.

---

## Contribution

We welcome contributions to Anza Connect! To contribute:
1. Fork the repository.
2. Create a new branch for your feature or bug fix.
3. Commit your changes and push the branch.
4. Open a pull request.

---

## License

This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for details.

---

## Contact

For any inquiries or support, please reach out to **support@anzaconnect.co.tz**.

