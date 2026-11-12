import "./globals.css";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import VoiceWidget from "../components/VoiceWidget";
import LogoutModal from "../components/LogoutModal";
import { AuthProvider } from "../context/AuthContext";
import { LanguageProvider } from "../context/LanguageContext";
import { ChallanProvider } from "../context/ChallanContext";

export const metadata = {
  title: "AI Traffic Voice Assistant | Civic e-Challan Portal",
  description: "Multilingual AI-Powered Traffic Voice Assistant and e-Challan Citizen Portal for checking fines, traffic rules, and instant settlements.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className="flex flex-col min-h-screen bg-mainBg text-mainText antialiased">
        <AuthProvider>
          <LanguageProvider>
            <ChallanProvider>
              <Navbar />
              <main className="flex-grow">{children}</main>
              <Footer />
              <VoiceWidget />
              <LogoutModal />
            </ChallanProvider>
          </LanguageProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
