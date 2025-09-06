import "./globals.css";
import "./data-tables-css.css";
import "./satoshi.css";
import Providers from "./providers";

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body suppressHydrationWarning={true}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
