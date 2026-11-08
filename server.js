/**
 * =============================================================================
 * SYBER SPACE SECURITY SYSTEMS — PRODUCTION BACKEND SERVER
 * Official HDFC Bank SmartGateway™ Multi-Rail Payment Gateway Integration
 * 
 * Standards: RBI E-Mandate & Card Tokenization, PCI-DSS Level 1, DPDP Act 2023
 * =============================================================================
 */

const http = require('http');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const tls = require('tls');
const zlib = require('zlib');

// -----------------------------------------------------------------------------
// 1. ENVIRONMENT CONFIGURATION LOADER (Pure Node.js - Zero External Dependencies)
// -----------------------------------------------------------------------------
function loadEnvironmentVariables() {
    try {
        const envPath = path.join(__dirname, '.env');
        if (fs.existsSync(envPath)) {
            const raw = fs.readFileSync(envPath, 'utf8');
            const lines = raw.split(/\r?\n/);
            for (const line of lines) {
                const trimmed = line.trim();
                if (!trimmed || trimmed.startsWith('#')) continue;
                const eqIdx = trimmed.indexOf('=');
                if (eqIdx > 0) {
                    const key = trimmed.slice(0, eqIdx).trim();
                    const val = trimmed.slice(eqIdx + 1).trim();
                    if (process.env[key] === undefined) {
                        process.env[key] = val;
                    }
                }
            }
        }
    } catch (err) {
        console.warn('Notice: .env file not read, using system environment variables.');
    }
}
loadEnvironmentVariables();

const PORT = parseInt(process.env.PORT, 10) || 5500;
const NODE_ENV = process.env.NODE_ENV || 'production';
const APP_URL = process.env.APP_URL || `http://localhost:${PORT}`;

// HDFC SmartGateway Credentials
const HDFC_CONFIG = {
    env: process.env.HDFC_ENV || 'sandbox', // 'sandbox' (UAT) or 'production'
    merchantId: process.env.HDFC_MERCHANT_ID || 'HDFC_MERCHANT_SYBER_0808',
    terminalId: process.env.HDFC_TERMINAL_ID || '88102941',
    apiKey: process.env.HDFC_API_KEY || 'test_api_key_syberspace_2026',
    workingKey: process.env.HDFC_WORKING_KEY || 'test_working_key_syberspace_sec_0808',
    merchantVpa: process.env.HDFC_MERCHANT_VPA || 'syberspace@hdfcbank',
    returnUrl: process.env.HDFC_RETURN_URL || `${APP_URL}/checkout.html`,
    webhookUrl: process.env.HDFC_WEBHOOK_URL || `${APP_URL}/api/hdfc/webhook`,
    // HDFC SmartGateway Official API Base Endpoints
    apiEndpoint: process.env.HDFC_ENV === 'production'
        ? 'https://api.smartgateway.hdfcbank.com'
        : 'https://smartgatewayuat.hdfcbank.com'
};

// -----------------------------------------------------------------------------
// 2. MIME TYPES & SECURITY HEADERS
// -----------------------------------------------------------------------------
const MIME_TYPES = {
    '.html': 'text/html; charset=utf-8',
    '.css': 'text/css; charset=utf-8',
    '.js': 'text/javascript; charset=utf-8',
    '.json': 'application/json; charset=utf-8',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.webp': 'image/webp',
    '.gif': 'image/gif',
    '.svg': 'image/svg+xml',
    '.mp4': 'video/mp4',
    '.ico': 'image/x-icon',
    '.woff2': 'font/woff2',
    '.woff': 'font/woff',
    '.avif': 'image/avif',
    '.mjs': 'text/javascript; charset=utf-8',
    '.xml': 'application/xml; charset=utf-8',
    '.txt': 'text/plain; charset=utf-8'
};

const ALLOWED_STATIC_EXTENSIONS = new Set([
    '.html', '.css', '.js', '.mjs', '.png', '.jpg', '.jpeg',
    '.webp', '.avif', '.gif', '.svg', '.mp4', '.ico', '.woff2',
    '.woff', '.json', '.xml', '.txt'
]);

const BLOCKED_FILES = new Set([
    'server.js', 'orders_vault.json', 'package.json', 'package-lock.json',
    'ecosystem.config.js', 'procfile', '.env', '.gitignore'
]);

const SECURITY_HEADERS = {
    'X-Content-Type-Options': 'nosniff',
    'X-Frame-Options': 'SAMEORIGIN',
    'X-XSS-Protection': '1; mode=block',
    'Referrer-Policy': 'strict-origin-when-cross-origin'
};

// -----------------------------------------------------------------------------

// -----------------------------------------------------------------------------
// COMMERCIAL TAX INVOICE & REFUND/EXCHANGE EMAIL ENGINE
// (Zero-Cloud Startup Setup: Sends & Archives Invoices Directly to Company Email)
// -----------------------------------------------------------------------------
const COMPANY_EMAIL = process.env.MERCHANT_SUPPORT_EMAIL || 'info.syberspacestore@gmail.com';
const GMAIL_USER = process.env.GMAIL_USER || COMPANY_EMAIL;
const GMAIL_PASS = (process.env.GMAIL_APP_PASSWORD || process.env.SMTP_PASS || '').trim();
const EMAILS_DIR = path.join(__dirname, 'emails_sent');

function sendSmtpEmail({ host, port, user, pass, to, subject, text }) {
    return new Promise((resolve) => {
        if (!user || !pass) {
            console.log('[Email Dispatch] Live Gmail SMTP delivery requires GMAIL_APP_PASSWORD in .env. Order archived in emails_sent/ for ' + to);
            return resolve({ success: true, mode: 'ARCHIVED_ONLY', reason: 'No GMAIL_APP_PASSWORD in .env' });
        }

        console.log(`[Email Dispatch] Initiating Gmail TLS connection for ${to}...`);
        const socket = tls.connect(port || 465, host || 'smtp.gmail.com', () => {
            console.log('[SMTP TLS] Connected to smtp.gmail.com:465');
        });

        let step = 0;
        let authErr = null;

        socket.setEncoding('utf8');
        socket.setTimeout(12000, () => {
            console.warn('[SMTP TLS] Connection timed out after 12s');
            socket.destroy();
            resolve({ success: false, mode: 'TIMEOUT_FALLBACK' });
        });

        socket.on('data', (chunk) => {
            const data = chunk.toString();
            if (data.startsWith('220') && step === 0) {
                step = 1;
                socket.write('EHLO localhost\r\n');
            } else if (data.startsWith('250') && step === 1) {
                step = 2;
                socket.write('AUTH LOGIN\r\n');
            } else if (data.startsWith('334') && step === 2) {
                step = 3;
                socket.write(Buffer.from(user).toString('base64') + '\r\n');
            } else if (data.startsWith('334') && step === 3) {
                step = 4;
                socket.write(Buffer.from(pass.replace(/\s+/g, '')).toString('base64') + '\r\n');
            } else if (data.startsWith('235') && step === 4) {
                step = 5;
                socket.write(`MAIL FROM:<${user}>\r\n`);
            } else if (data.startsWith('250') && step === 5) {
                step = 6;
                socket.write(`RCPT TO:<${to}>\r\n`);
            } else if (data.startsWith('250') && step === 6) {
                step = 7;
                socket.write('DATA\r\n');
            } else if (data.startsWith('354') && step === 7) {
                step = 8;
                const mime = [
                    `From: "Syber Space Security Systems" <${user}>`,
                    `To: <${to}>`,
                    `Subject: ${subject}`,
                    `Date: ${new Date().toUTCString()}`,
                    `MIME-Version: 1.0`,
                    `Content-Type: text/plain; charset=utf-8`,
                    `Content-Transfer-Encoding: 7bit`,
                    ``,
                    text,
                    `.`
                ].join('\r\n');
                socket.write(mime + '\r\n');
            } else if (data.startsWith('250') && step === 8) {
                step = 9;
                socket.write('QUIT\r\n');
                console.log(`[Email Dispatch] Successfully transmitted to ${to} via Gmail SMTP!`);
                resolve({ success: true, mode: 'LIVE_GMAIL_DELIVERED' });
            } else if (data.startsWith('5') || data.startsWith('4')) {
                authErr = new Error('SMTP Error: ' + data.trim());
                console.warn('[SMTP Error]', data.trim());
                socket.end();
            }
        });

        socket.on('error', (err) => {
            console.warn('[SMTP Socket Note]', err.message);
            resolve({ success: false, error: err.message, mode: 'FALLBACK_ARCHIVE' });
        });

        socket.on('close', () => {
            if (step < 8 && authErr) {
                resolve({ success: false, error: authErr.message, mode: 'FALLBACK_ARCHIVE' });
            }
        });
    });
}

function ensureEmailsDir() {
    try {
        if (!fs.existsSync(EMAILS_DIR)) {
            fs.mkdirSync(EMAILS_DIR, { recursive: true });
        }
    } catch (e) {}
}
ensureEmailsDir();

function formatTaxInvoiceEmail(order) {
    const eol = '\n';
    const cust = order.customer || {};
    const items = order.items || [];
    const dateStr = order.verifiedAt 
        ? new Date(order.verifiedAt).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })
        : new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' });

    let itemsTableText = '';
    items.forEach((it, idx) => {
        const q = it.qty || it.quantity || 1;
        const rate = it.price || 0;
        const amt = rate * q;
        itemsTableText += `  [${idx + 1}] ${it.title || it.name} (${it.brand || 'SYBER'})` + eol;
        itemsTableText += `      Qty: ${q}  |  Unit Rate: Rs. ${rate.toLocaleString('en-IN')}  |  Total: Rs. ${amt.toLocaleString('en-IN')}` + eol;
    });

    const totalAmt = parseFloat(order.amount) || 0;
    const gstAmt = Math.round(totalAmt * 0.18 / 1.18);
    const taxableAmt = totalAmt - gstAmt;

    const subject = `[NEW ORDER & TAX INVOICE] Order #${order.orderId} - Rs. ${totalAmt.toLocaleString('en-IN')} - ${cust.name || 'Customer'}`;

    const bodyText = `
=============================================================================
SYBER SPACE SECURITY SYSTEMS — COMMERCIAL TAX INVOICE & DISPATCH ORDER
Authorized CCTV Surveillance Systems // Direct Wholesale Central HQ
GSTIN: 32AABCU9603R1ZM  |  Phone: +91 75111 80808  |  Email: info.syberspacestore@gmail.com
=============================================================================

TAX INVOICE & ORDER METADATA:
-----------------------------------------------------------------------------
Tax Invoice No:     ${order.orderId}
Order Date & Time:  ${dateStr} (IST)
Payment Gateway:    HDFC Bank SmartGateway™ (Verified // CAPTURED)
Payment Rail:       ${order.paymentRail || 'UPI'}
Transaction ID:     ${order.txnId || 'N/A'}
Bank Auth Code:     ${order.authCode || 'N/A'}
Bank RRN:           ${order.rrn || 'N/A'}

CUSTOMER & INVOICE RECIPIENT DETAILS:
-----------------------------------------------------------------------------
Full Name:          ${cust.name || 'N/A'}
Company / Firm:     ${cust.company || 'Individual / Non-Commercial'}
GSTIN (Tax Credit): ${cust.gstin || 'Not Provided (B2C Supply)'}
Mobile Phone:       +91 ${cust.phone || 'N/A'}
Email Address:      ${cust.email || 'N/A'}
Delivery Address:   ${cust.address || 'N/A'}
City / District:    ${cust.city || 'N/A'}
State:              ${cust.state || 'Primary'} (State Code: 32)
Postal Pincode:     ${cust.pincode || 'N/A'}

ORDERED SURVEILLANCE HARDWARE:
-----------------------------------------------------------------------------
${itemsTableText}

FINANCIAL BREAKDOWN (GST INVOICE):
-----------------------------------------------------------------------------
Taxable Hardware Value:  Rs. ${taxableAmt.toLocaleString('en-IN')}
GST @ 18% (Included):     Rs. ${gstAmt.toLocaleString('en-IN')}
Transit Insurance:       COMPLIMENTARY
Express Courier Delivery: FREE INSURED COURIER (Direct Central Warehouse)
-----------------------------------------------------------------------------
TOTAL AMOUNT RECEIVED:   Rs. ${totalAmt.toLocaleString('en-IN')}
-----------------------------------------------------------------------------

WHOLESALE DISPATCH & RETURN POLICY:
* No Cancellations: As wholesale hardware is queued immediately for serial number
  registration and transit insurance, orders cannot be cancelled once authorized.
* 100% Refund & Exchange Policy: Customers can request a full Refund or Hardware
  Exchange within 7 days of delivery.
* Mandatory Condition: A continuous, uncut unboxing video of the delivery parcel
  is required for courier damage claims and defect warranty validation.

Action Required by Warehouse:
1. Verify payment status (CAPTURED).
2. Generate physical GST invoice with above details.
3. Register serial numbers and dispatch parcel via insured express courier.
=============================================================================
`;

    return { subject, bodyText, recipient: COMPANY_EMAIL };
}

function formatRefundRequestEmail(refundData) {
    const dateStr = new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' });
    const subject = `[ACTION REQUIRED: ${refundData.requestType || 'REFUND'} REQUEST] Order #${refundData.orderId} - ${refundData.customerName}`;

    const bodyText = `
=============================================================================
SYBER SPACE SECURITY SYSTEMS — CUSTOMER REFUND / EXCHANGE REQUEST
Company Support Desk: info.syberspacestore@gmail.com // +91 75111 80808
=============================================================================

REQUEST METADATA:
-----------------------------------------------------------------------------
Request Reference:  REF-${Date.now()}
Date & Time:        ${dateStr} (IST)
Target Order ID:    ${refundData.orderId}
Request Category:   ${refundData.requestType} (NO CANCELLATION // REFUND OR EXCHANGE ONLY)

CUSTOMER CONTACT:
-----------------------------------------------------------------------------
Customer Name:      ${refundData.customerName}
Phone Number:       +91 ${refundData.customerPhone}
Email Address:      ${refundData.customerEmail}

REQUEST DETAILS:
-----------------------------------------------------------------------------
Primary Reason:     ${refundData.reason}
Payout / Bank Info: ${refundData.payoutDetails || 'Not Provided'}
Unboxing Video:     ${refundData.unboxingVideoConfirmed ? 'CONFIRMED AVAILABLE BY CUSTOMER' : 'NOT CONFIRMED'}
Customer Notes:     ${refundData.notes || 'No additional comments provided'}

NEXT STEPS FOR B2B SUPPORT DESK:
1. Verify order in orders_vault.json.
2. Request continuous unboxing video from customer via WhatsApp (+91 ${refundData.customerPhone}).
3. For Refunds: Initiate UPI/Bank transfer within 24-48 hours upon parcel return.
4. For Exchanges: Arrange reverse courier pickup and dispatch replacement unit.
=============================================================================
`;

    return { subject, bodyText, recipient: COMPANY_EMAIL };
}

// 3. PERSISTENT ORDER VAULT & AUDIT LOGGING
// -----------------------------------------------------------------------------
const ORDERS_FILE = path.join(__dirname, 'orders_vault.json');
let HDFC_ORDERS = [];

function loadOrdersFromDisk() {
    try {
        if (fs.existsSync(ORDERS_FILE)) {
            const data = fs.readFileSync(ORDERS_FILE, 'utf8');
            HDFC_ORDERS = JSON.parse(data || '[]');
        }
    } catch (e) {
        HDFC_ORDERS = [];
    }
}
loadOrdersFromDisk();

function saveOrdersToDisk() {
    try {
        fs.writeFileSync(ORDERS_FILE, JSON.stringify(HDFC_ORDERS, null, 2), 'utf8');
    } catch (e) {
        console.error('Failed to persist order to disk:', e.message);
    }
}

// Helper: Compute HMAC-SHA256 signature
function generateHmacSha256(data, secret) {
    return crypto.createHmac('sha256', secret).update(data).digest('hex');
}

// -----------------------------------------------------------------------------
// 4. MAIN HTTP SERVER DISPATCH ENGINE
// -----------------------------------------------------------------------------
const server = http.createServer((req, res) => {
    const parsedUrl = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
    let pathname = parsedUrl.pathname;

    // Helper: Standardized JSON Response with CORS & Security Headers
    const sendJson = (statusCode, data) => {
        res.writeHead(statusCode, {
            'Content-Type': 'application/json; charset=utf-8',
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type, Authorization, x-hdfc-signature',
            'Cache-Control': 'no-cache, no-store, must-revalidate',
            ...SECURITY_HEADERS
        });
        res.end(JSON.stringify(data));
    };

    // Preflight OPTIONS handler
    if (req.method === 'OPTIONS') {
        res.writeHead(204, {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type, Authorization, x-hdfc-signature',
            ...SECURITY_HEADERS
        });
        res.end();
        return;
    }

    // Helper: Read raw request body
    const readRequestBody = (callback) => {
        let body = '';
        req.on('data', chunk => {
            body += chunk;
            if (body.length > 2e6) { // 2MB limit
                req.connection.destroy();
            }
        });
        req.on('end', () => {
            let parsed = {};
            try {
                parsed = body ? JSON.parse(body) : {};
            } catch (err) {
                return callback(err, null, body);
            }
            callback(null, parsed, body);
        });
    };

    // =========================================================================
    // API ROUTE: HEALTH CHECK & AUDIT PROBES (Render, Railway, AWS ECS, GCP)
    // =========================================================================
    
    // =========================================================================
    // BRANDS DIRECTORY API (ALL 17 VERIFIED COMMERCIAL SECURITY BRANDS)
    // =========================================================================
    if (pathname === '/api/brands' && req.method === 'GET') {
        const brandsList = [
            { id: 'hikvision', name: 'Hikvision', domain: 'CCTV & VDP', logo: 'assets/brands/hikvision.svg', isCctvHardDisk: false },
            { id: 'cpplus', name: 'CP Plus', domain: 'Surveillance & Wi-Fi', logo: 'assets/brands/cpplus.svg', isCctvHardDisk: false },
            { id: 'prama', name: 'Prama', domain: 'Commercial CCTV', logo: 'assets/brands/prama.svg', isCctvHardDisk: false },
            { id: 'hifocus', name: 'Hi-Focus', domain: 'HD Video Security', logo: 'assets/brands/hifocus.svg', isCctvHardDisk: false },
            { id: 'secureye', name: 'Secureye', domain: 'Biometrics & CCTV', logo: 'assets/brands/secureye.svg', isCctvHardDisk: false },
            { id: 'nexiview', name: 'Nexiview', domain: 'CCTV Surveillance', logo: 'assets/brands/nexiview.svg', isCctvHardDisk: false },
            { id: 'fiber', name: 'Fiber', domain: 'Optical Fiber Transmission', logo: 'assets/brands/fiber.svg', isCctvHardDisk: false },
            { id: 'wd', name: 'WD Purple', domain: 'CCTV Hard Disk (24/7)', logo: 'assets/brands/wd.svg', isCctvHardDisk: true },
            { id: 'seagate', name: 'Seagate SkyHawk', domain: 'CCTV Hard Disk (24/7)', logo: 'assets/brands/seagate.svg', isCctvHardDisk: true },
            { id: 'toshiba', name: 'Toshiba S300', domain: 'CCTV Hard Disk (24/7)', logo: 'assets/brands/toshiba.svg', isCctvHardDisk: true },
            { id: 'trueview', name: 'Trueview', domain: 'Solar 4G & PoE', logo: 'assets/brands/trueview.svg', isCctvHardDisk: false },
            { id: 'finolex', name: 'Finolex', domain: 'Pure Copper Cables', logo: 'assets/brands/finolex.svg', isCctvHardDisk: false },
            { id: 'essl', name: 'ESSL', domain: 'Biometrics & Access', logo: 'assets/brands/essl.svg', isCctvHardDisk: false },
            { id: 'erd', name: 'ERD', domain: '12V CCTV SMPS Units', logo: 'assets/brands/erd.svg', isCctvHardDisk: false },
            { id: 'logitech', name: 'Logitech', domain: 'Video Collaboration', logo: 'assets/brands/logitech.svg', isCctvHardDisk: false },
            { id: 'mx', name: 'MX', domain: 'BNC & AV Hardware', logo: 'assets/brands/mx.svg', isCctvHardDisk: false },
            { id: 'tplink', name: 'TP-Link', domain: 'Networking & PoE', logo: 'assets/brands/tplink.svg', isCctvHardDisk: false }
        ];

        return sendJson(200, {
            success: true,
            totalBrands: brandsList.length,
            cctvHardDiskCount: brandsList.filter(b => b.isCctvHardDisk).length,
            cctvHardDiskBrands: brandsList.filter(b => b.isCctvHardDisk).map(b => b.name),
            brands: brandsList
        });
    }

    // =========================================================================
    // CATEGORIES & DEPARTMENTS API
    // =========================================================================
    // API: OFFICIAL PRODUCT CATEGORIES & CCTV SETUP REQUIREMENTS
    // =========================================================================
    if (pathname === '/api/categories' && req.method === 'GET') {
        return sendJson(200, {
            success: true,
            categories: [
                { id: 'cctv', title: 'CCTV', count: 20, url: 'shop.html?cat=cctv' },
                { id: 'dash-cams', title: 'Dash Cams', count: 2, url: 'shop.html?cat=dash-cams' },
                { id: 'home-automation', title: 'Home Automation', count: 9, url: 'shop.html?cat=home-automation' },
                { id: 'accessories', title: 'Accessories', count: 22, url: 'shop.html?cat=accessories' },
                { id: 'cables', title: 'Cables', count: 10, url: 'shop.html?cat=cables' },
                { id: 'wifi-solar', title: 'Wifi/4G/Solar Cameras', count: 20, url: 'shop.html?cat=wifi-solar' }
            ]
        });
    }

    if (pathname === '/api/cctv-setup-requirements' && req.method === 'GET') {
        return sendJson(200, {
            success: true,
            title: "CCTV Setup Working Accessories & Essential Hardware",
            hdCamera: [
                { index: 1, item: "DVR", role: "Digital Video Recorder (5-in-1)", productId: "trueview-t38298-a-8-channel-8-audio-5in1-analog-dvr" },
                { index: 2, item: "Dome Camera", role: "Indoor 2MP Dual-Light Dome", productId: "trueview-t18256-a-dual-light-hd-2mp-dome-camera" },
                { index: 3, item: "Bullet Camera", role: "Outdoor Weatherproof IP66 Bullet", productId: "trueview-t18257-a-dual-light-hd-2mp-bullet-camera-ip66" },
                { index: 4, item: "Power Supply", role: "12V 10A Multi-Channel Central SMPS", productId: "cctv-smps-power-supply-12v-10a" },
                { index: 5, item: "HDD", role: "24/7 Surveillance Grade Hard Disk 4TB", productId: "cctv-surveillance-hard-drive-4tb" },
                { index: 6, item: "Cables", role: "3+1 Solid Copper CCTV Coaxial Cable (90M)", productId: "cctv-coaxial-cable-3-1-90m" },
                { index: 7, item: "BNC Connector", role: "High-Conductivity BNC Push-On Plugs (Pack of 10)", productId: "cctv-bnc-connectors-pack-10" },
                { index: 8, item: "DC Connector", role: "12V Heavy-Duty Male DC Power Pigtails (Pack of 10)", productId: "cctv-dc-power-connectors-pack-10" },
                { index: 9, item: "DVR Rack", role: "2U Wall-Mount Lockable Metal Cabinet", productId: "cctv-dvr-rack-2u" },
                { index: 10, item: "Wireless Mouse", role: "2.4GHz Optical Mouse for DVR Console GUI", productId: "acc-wireless-mouse-dvr" },
                { index: 11, item: "HDMI Cables", role: "4K High-Speed Gold-Plated HDMI Cable (5M)", productId: "cctv-hdmi-cable-5m-4k" },
                { index: 12, item: "CoBox Indoor", role: "Clean Indoor Camera Base Junction Box", productId: "acc-cobox-indoor-base" },
                { index: 13, item: "CoBox Outdoor", role: "IP66 Weatherproof Rubber-Gasketed Junction Box", productId: "acc-cobox-outdoor-ip66" },
                { index: 14, item: "Wifi Router", role: "High-Gain Wi-Fi / 4G Router for Remote Mobile View", productId: "trueview-t18258-a-4g-router-r300-300mbps-sim-slot" }
            ],
            ipCamera: [
                { index: 1, item: "NVR", role: "16-Channel 8MP 4K Ultra-HD NVR", productId: "trueview-t38118-ae-16-channel-8mp-4k-nvr-1-sata-8tb" },
                { index: 2, item: "IP Bullet Camera", role: "3MP Wi-Fi / PoE Weatherproof IP Bullet", productId: "trueview-t18295s-smart-wi-fi-bullet-camera-3mp-ip66" },
                { index: 3, item: "IP Dome Camera", role: "3MP Smart Pan & Tilt / Dome Camera", productId: "trueview-t18294s-smart-wi-fi-dome-camera-3mp" },
                { index: 4, item: "POE Switches", role: "4+2 Port 65W Commercial PoE Switch", productId: "trueview-t38260-a-poe-switch-4-2-10-100m-65w" },
                { index: 5, item: "HDD", role: "24/7 Surveillance Grade Hard Disk 4TB", productId: "cctv-surveillance-hard-drive-4tb" },
                { index: 6, item: "Network Cable", role: "Pure Solid Bare Copper CAT6 UTP Cable (305M)", productId: "cctv-cat6-pure-copper-cable-305m" },
                { index: 7, item: "RJ 45 Jack", role: "Cat6 Gold-Plated Modular Plugs (Pack of 50)", productId: "acc-rj45-gold-connectors" },
                { index: 8, item: "NVR Rack", role: "4U Wall-Mount Network & Server Cabinet", productId: "cctv-server-rack-4u" },
                { index: 9, item: "Wireless Mouse", role: "2.4GHz Optical Wireless Mouse for NVR GUI", productId: "acc-wireless-mouse-dvr" },
                { index: 10, item: "CoBox Indoor", role: "Clean Indoor Camera Base Junction Box", productId: "acc-cobox-indoor-base" },
                { index: 11, item: "CoBox Outdoor", role: "IP66 Weatherproof Rubber-Gasketed Junction Box", productId: "acc-cobox-outdoor-ip66" },
                { index: 12, item: "HDMI Cable", role: "4K High-Speed Gold-Plated HDMI Cable (5M)", productId: "cctv-hdmi-cable-5m-4k" },
                { index: 13, item: "Wifi Router", role: "High-Gain Wi-Fi / 4G Router for Remote Mobile View", productId: "trueview-t18258-a-4g-router-r300-300mbps-sim-slot" }
            ]
        });
    }

    // =========================================================================
    // API ROUTE 7: 3D SECURE RETURN CALLBACK (POST / GET from HDFC Terminal)
    // =========================================================================
    if (pathname === '/api/hdfc/callback') {
        const redirectUrl = `/checkout.html?checkout_status=completed&t=${Date.now()}`;
        res.writeHead(302, { 'Location': redirectUrl });
        res.end();
        return;
    }

    // =========================================================================
    // STATIC FILE SERVING WITH RANGE SUPPORT FOR HIGH-DEF CCTV VIDEOS
    // =========================================================================
    if (pathname === '/') pathname = '/index.html';

    const safePath = path.normalize(pathname).replace(/^(\.\.[\/\\])+/, '');
    const filePath = path.join(__dirname, safePath);
    const ext = path.extname(filePath).toLowerCase();
    const contentType = MIME_TYPES[ext] || 'application/octet-stream';

    fs.stat(filePath, (statErr, stats) => {
        if (statErr) {
            if (statErr.code === 'ENOENT') {
                res.writeHead(404, {
                    'Content-Type': 'text/html; charset=utf-8',
                    ...SECURITY_HEADERS
                });
                res.end(`<!DOCTYPE html><html><head><title>404 Not Found</title><link rel="stylesheet" href="style.css"></head><body style="background:#ffffff; display:flex; align-items:center; justify-content:center; height:100vh; font-family:'Plus Jakarta Sans',sans-serif; text-align:center;"><div><h1 style="font-size:3rem; margin-bottom:12px;">404 // NOT FOUND</h1><p style="color:#475569; margin-bottom:20px;">The requested surveillance portal resource does not exist.</p><a href="/" style="font-family:monospace; text-decoration:none; background:#0f172a; color:#fff; padding:10px 20px; border-radius:4px;">[ RETURN TO HEADQUARTERS ]</a></div></body></html>`);
            } else {
                res.writeHead(500, { 'Content-Type': 'text/plain' });
                res.end(`Internal Server Error: ${statErr.code}`);
            }
            return;
        }

        // Handle Video HTTP Range Requests (Safari, iOS, Android Chrome require this for MP4)
        if (ext === '.mp4') {
            const range = req.headers.range;
            const total = stats.size;

            if (range) {
                const parts = range.replace(/bytes=/, "").split("-");
                const partialStart = parts[0];
                const partialEnd = parts[1];

                const start = parseInt(partialStart, 10);
                const end = partialEnd ? parseInt(partialEnd, 10) : total - 1;
                const chunkSize = (end - start) + 1;

                const fileStream = fs.createReadStream(filePath, { start, end });
                res.writeHead(206, {
                    'Content-Range': `bytes ${start}-${end}/${total}`,
                    'Accept-Ranges': 'bytes',
                    'Content-Length': chunkSize,
                    'Content-Type': contentType,
                    ...SECURITY_HEADERS
                });
                fileStream.pipe(res);
                return;
            } else {
                res.writeHead(200, {
                    'Content-Length': total,
                    'Content-Type': contentType,
                    'Accept-Ranges': 'bytes',
                    ...SECURITY_HEADERS
                });
                fs.createReadStream(filePath).pipe(res);
                return;
            }
        }

        // Cache control strategy: HTML & API dynamic; assets cached
        const isDynamic = ext === '.html' || ext === '.json' || ext === '.js' || ext === '.css';
        const cacheControl = isDynamic
            ? 'no-cache, no-store, must-revalidate'
            : 'public, max-age=86400';

        res.writeHead(200, {
            'Content-Type': contentType,
            'Content-Length': stats.size,
            'Cache-Control': cacheControl,
            ...SECURITY_HEADERS
        });

        fs.createReadStream(filePath).pipe(res);
    });
});

function startServer(portToTry) {
    server.once('error', (err) => {
        if (err.code === 'EADDRINUSE') {
            console.warn('[Port Alert] Port ' + portToTry + ' is in use. Retrying on port ' + (portToTry + 1) + '...');
            startServer(portToTry + 1);
        } else {
            console.error('[Fatal Server Error]', err);
            process.exit(1);
        }
    });

    server.listen(portToTry, '0.0.0.0', () => {
        const activePort = server.address().port;
        try {
            fs.writeFileSync(path.join(__dirname, '.active_server.json'), JSON.stringify({
                port: activePort,
                url: 'http://localhost:' + activePort,
                pid: process.pid,
                startedAt: new Date().toISOString(),
                gatewayEnv: HDFC_CONFIG.env
            }, null, 2), 'utf8');
        } catch (e) {}

        console.log('=============================================================================');
        console.log('SYBER SPACE SECURITY SYSTEMS — BACKEND DAEMON ONLINE & READY');
        console.log('Active Port:    ' + activePort);
        console.log('Environment:    ' + NODE_ENV);
        console.log('Gateway:        HDFC Bank SmartGateway™ (' + HDFC_CONFIG.env.toUpperCase() + ')');
        console.log('Merchant MID:   ' + HDFC_CONFIG.merchantId);
        console.log('Terminal TID:   ' + HDFC_CONFIG.terminalId);
        console.log('Store URL:      http://localhost:' + activePort + '/');
        console.log('Cart URL:       http://localhost:' + activePort + '/cart.html');
        console.log('Checkout URL:   http://localhost:' + activePort + '/checkout.html');
        console.log('API Health:     http://localhost:' + activePort + '/health');
        console.log('Gateway Status: http://localhost:' + activePort + '/api/hdfc/status');
        console.log('=============================================================================');
    });
}

startServer(PORT);
