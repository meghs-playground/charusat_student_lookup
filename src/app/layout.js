import "./globals.css";

export const metadata = {
  title: "CHARUSAT Student ID Lookup",
  description:
    "Can't remember a friend's ID? Or want to find who someone is from their ID? Look up student names and IDs with instant fuzzy search.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <div className="bg-grid" aria-hidden="true" />
        {children}
        <footer className="footer">CHARUSAT · Semester Results Lookup</footer>
      </body>
    </html>
  );
}
