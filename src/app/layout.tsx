import type { Metadata } from "next";
import { Poppins, Inter_Tight } from "next/font/google";
import Script from "next/script";
import "./globals.css";

const display = Poppins({
  weight: ["500", "600", "700"],
  variable: "--font-poppins",
  subsets: ["latin"],
  display: "swap",
});

const sans = Inter_Tight({
  variable: "--font-inter-tight",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Lumen Create — the day-in-the-life editor",
  description:
    "Upload the day's raw clips, say what you want, and get back a finished, ready-to-post vertical short — with music or an AI voiceover.",
};

const themeScript = `(function(){try{var b=localStorage.getItem("bg");if(b==="black")document.documentElement.classList.add("mode-black");else if(b==="white")document.documentElement.classList.add("mode-white");}catch(e){}})();`;

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${display.variable} ${sans.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <body className="min-h-full flex flex-col text-ink">
        <Script
          id="theme-init"
          strategy="beforeInteractive"
          dangerouslySetInnerHTML={{ __html: themeScript }}
        />
        {children}
      </body>
    </html>
  );
}
