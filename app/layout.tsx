import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Link from "next/link";
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
  title: "E-Commerce Dashboard",
  description: "Full-stack e-commerce management application",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <div className="min-h-screen bg-gray-50">
          {/* Navigation */}
          <nav className="bg-white shadow-sm border-b border-gray-200">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="flex justify-between h-16">
                <div className="flex">
                  <div className="flex-shrink-0 flex items-center">
                    <h1 className="text-xl font-bold text-gray-900">
                      E-Commerce Dashboard
                    </h1>
                  </div>
                  <div className="hidden sm:ml-8 sm:flex sm:space-x-8">
                    <Link
                      href="/"
                      className="border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium"
                    >
                      Dashboard
                    </Link>
                    <Link
                      href="/customers"
                      className="border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium"
                    >
                      Customers
                    </Link>
                    <Link
                      href="/products"
                      className="border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium"
                    >
                      Products
                    </Link>
                    <Link
                      href="/orders"
                      className="border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium"
                    >
                      Orders
                    </Link>
                  </div>
                </div>
              </div>
            </div>
            {/* Mobile navigation */}
            <div className="sm:hidden flex justify-around space-x-1 px-2 pb-2">
              <Link
                href="/"
                className="text-gray-600 hover:text-gray-900 inline-flex items-center px-3 py-2 text-sm font-medium"
              >
                Dashboard
              </Link>
              <Link
                href="/customers"
                className="text-gray-600 hover:text-gray-900 inline-flex items-center px-3 py-2 text-sm font-medium"
              >
                Customers
              </Link>
              <Link
                href="/products"
                className="text-gray-600 hover:text-gray-900 inline-flex items-center px-3 py-2 text-sm font-medium"
              >
                Products
              </Link>
              <Link
                href="/orders"
                className="text-gray-600 hover:text-gray-900 inline-flex items-center px-3 py-2 text-sm font-medium"
              >
                Orders
              </Link>
            </div>
          </nav>

          {/* Main content */}
          <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            {children}
          </main>
        </div>
      </body>
    </html>
  );
}
