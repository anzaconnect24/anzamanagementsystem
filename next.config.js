/** @type {import('next').NextConfig} */
const nextConfig = {
    reactStrictMode: false,  // Disable Strict Mode
    images: {
        domains: [
            "localhost",
            "encrypted-tbn0.gstatic.com",
            "res.cloudinary.com",
            "195.35.8.142",
            "serverapipointer.online",
            "anzaentrepreneurs.co.tz",
            "api.anzaconnect.co.tz"
        ]
    }
}

module.exports = nextConfig;
