// api/bagibagi-webhook.js
const axios = require('axios');

module.exports = async (req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, X-Bagibagi-Token');
    
    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }
    
    if (req.method !== 'POST') {
        return res.status(200).json({ 
            status: 'OK',
            message: 'BagiBagi webhook ready! 🎁'
        });
    }
    
    try {
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log('🎁 BagiBagi webhook received');
        console.log('📦 Headers:', JSON.stringify(req.headers, null, 2));
        console.log('📦 Body:', JSON.stringify(req.body, null, 2));
        
        // ═══════════════════════════════════════════════════════
        // ⚠️ TOKEN CHECK DISABLED FOR TESTING
        // ═══════════════════════════════════════════════════════
        
        // Uncomment this after confirming webhook works:
        
        const BAGIBAGI_TOKEN = process.env.BAGIBAGI_TOKEN;
        
        if (BAGIBAGI_TOKEN) {
            const receivedToken = req.headers['x-bagibagi-token'] || req.body.token;
            
            if (!receivedToken) {
                console.log('❌ No token in request');
                return res.status(401).json({ 
                    success: false,
                    error: 'Token missing'
                });
            }
            
            if (receivedToken !== BAGIBAGI_TOKEN) {
                console.log('❌ Token mismatch');
                return res.status(403).json({ 
                    success: false,
                    error: 'Invalid token'
                });
            }
            
            console.log('✅ Token verified');
        }
        
        
        const donation = req.body;
        
        const donationData = {
            donor_name: donation.supporter_name || donation.name || "Anonymous",
            amount: parseInt(donation.amount) || 0,
            message: donation.support_message || donation.message || "",
            timestamp: Date.now(),
            platform: 'bagibagi'
        };
        
        console.log('📤 Sending to Roblox:', JSON.stringify(donationData, null, 2));
        
        const ROBLOX_API_KEY = process.env.ROBLOX_API_KEY;
        const UNIVERSE_ID = process.env.UNIVERSE_ID;
        
        if (!ROBLOX_API_KEY || !UNIVERSE_ID) {
            console.error('❌ Missing Roblox env variables');
            return res.status(500).json({ 
                success: false,
                error: 'Missing env variables'
            });
        }
        
        await axios.post(
            `https://apis.roblox.com/messaging-service/v1/universes/${UNIVERSE_ID}/topics/BagiBagiDonation`,
            { message: JSON.stringify(donationData) },
            {
                headers: {
                    'x-api-key': ROBLOX_API_KEY,
                    'Content-Type': 'application/json'
                },
                timeout: 5000
            }
        );
        
        console.log('✅ Successfully sent to Roblox!');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        
        return res.status(200).json({ 
            success: true,
            platform: 'bagibagi',
            donor: donationData.donor_name,
            amount: donationData.amount,
            token_check: 'disabled'
        });
        
    } catch (error) {
        console.error('❌ ERROR:', error.message);
        
        return res.status(500).json({ 
            success: false,
            error: error.message
        });
    }
};
