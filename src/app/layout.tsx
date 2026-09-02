import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Chatify — Live chat your customers actually want to use",
  description:
    "Real-time human support for any website. See who's browsing, reply in one shared inbox, and ship it with a single line of code.",
  icons: {
    icon: "/chat-icon.png",
    shortcut: "/chat-icon.png",
    apple: "/logo.png",
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#fbfbf9" },
    { media: "(prefers-color-scheme: dark)", color: "#08080a" },
  ],
};

/**
 * Applies the stored theme before first paint. Without this the page renders
 * light for a frame and then snaps to dark, which looks broken.
 */
/**
 * Resolves the theme before first paint. `data-theme` is ALWAYS written — even
 * on "system" — because the `dark:` Tailwind variant keys off the attribute and
 * cannot see a media query. Storage stays empty for "system" so the choice
 * remains "follow the OS" rather than a pinned value.
 */
const themeBootstrap = `
(function () {
  var stored = null;
  try { stored = localStorage.getItem('chatify-theme'); } catch (e) {}
  var theme = stored === 'light' || stored === 'dark'
    ? stored
    : (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
  document.documentElement.setAttribute('data-theme', theme);
})();
`;

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full`}
      suppressHydrationWarning
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeBootstrap }} />
      </head>
      <body className="min-h-full bg-canvas text-ink">{children}</body>
    </html>
  );
}
