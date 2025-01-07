import '../styles/global.css';
import { UserProvider } from '../context/UserContext'; // Import the UserProvider

export const metadata = {
  title: 'InstaBuddy',
  description: 'Your personalized social media insights dashboard',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        {/* Wrap the entire app in the UserProvider */}
        <UserProvider>
          {children}
        </UserProvider>
      </body>
    </html>
  );
}
