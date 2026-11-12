import "./globals.css";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import VoiceWidget from "../components/VoiceWidget";
import LogoutModal from "../components/LogoutModal";
import { AuthProvider } from "../context/AuthContext";
import { LanguageProvider } from "../context/LanguageContext";
import { ChallanProvider } from "../context/ChallanContext";

export const metadata = {
  metadataBase: new URL("https://traffic-voice-assistant.vercel.app"),
  title: {
    default: "AI Traffic Voice Assistant — Ask. Understand. Follow.",
    template: "%s | AI Traffic Voice Assistant",
  },
  description:
    "AI Traffic Voice Assistant — Ask. Understand. Follow. Multilingual AI-powered traffic voice assistant and civic e-Challan portal for fine inquiries, traffic law guidance, and instant settlements.",
  keywords: [
    "AI Traffic Voice Assistant",
    "Ask Understand Follow",
    "e-Challan",
    "Traffic Assistant",
    "Voice AI",
    "Pakistan Traffic Laws",
    "Urdu Traffic Assistant",
    "Pashto Traffic Assistant",
    "Challan Verification",
  ],
  authors: [{ name: "Muhammad Yaseen" }],
  creator: "AI Traffic Voice Assistant Team",
  publisher: "AI Traffic Voice Assistant",
  robots: {
    index: true,
    follow: true,
  },
  icons: {
    icon: [
      { url: "/brand/shield-logo.svg", type: "image/svg+xml" },
    ],
    shortcut: "/brand/shield-logo.svg",
    apple: "/brand/shield-logo.svg",
  },
  openGraph: {
    title: "AI Traffic Voice Assistant — Ask. Understand. Follow.",
    description:
      "Ask. Understand. Follow. Multilingual AI-Powered Traffic Voice Assistant & Civic e-Challan Portal for traffic rules, fine checking, and instant settlements.",
    url: "https://traffic-voice-assistant.vercel.app",
    siteName: "AI Traffic Voice Assistant",
    locale: "en_US",
    type: "website",
    images: [
      {
        url: "/brand/brand-showcase.jpg",
        width: 1200,
        height: 630,
        alt: "AI Traffic Voice Assistant — Ask. Understand. Follow.",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "AI Traffic Voice Assistant — Ask. Understand. Follow.",
    description:
      "Ask. Understand. Follow. Multilingual AI-Powered Traffic Voice Assistant & Civic e-Challan Portal.",
    images: ["/brand/brand-showcase.jpg"],
  },
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
