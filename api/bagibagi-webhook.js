// api/bagibagi-webhook.js
// ✅ TOKEN OPTIONAL - Works with or without token

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
            message: 'BagiBagi webhook ready! 🎁',
            version: '2.0',
            token_check: 'optional'
        });
    }
    
    try {
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log('🎁 BagiBagi webhook received:', new Date().toISOString());
        console.log('📦 Request body:', JSON.stringify(req.body, null, 2));
        
        // ═══════════════════════════════════════════════════════════
        // TOKEN CHECK - OPTIONAL (NOT REQUIRED)
        // ═══════════════════════════════════════════════════════════
        
        const BAGIBAGI_TOKEN = process.env.BAGIBAGI_TOKEN;
        
        if (BAGIBAGI_TOKEN) {
            const receivedToken = req.headers['x-bagibagi-token'] 
                               || req.headers['authorization']
                               || req.body.token
                               || req.body.webhook_token;
            
            if (receivedToken) {
                const cleanToken = receivedToken.replace(/^Bearer\s+/i, '');
                
                if (cleanToken === BAGIBAGI_TOKEN) {
                    console.log('✅ Token verified');
                } else {
                    console.log('⚠️  Token provided but invalid - Allowing anyway');
                }
            } else {
                console.log('⚠️  No token in request - Allowing without verification');
            }
        } else {
            console.log('ℹ️  Token check disabled (BAGIBAGI_TOKEN not set)');
        }
        
        // ═══════════════════════════════════════════════════════════
        // PARSE DONATION DATA
        // ═══════════════════════════════════════════════════════════
        
        const donation = req.body;
        
        const donationData = {
            donor_name: donation.supporter_name 
                     || donation.name 
                     || donation.donatur_name
                     || "Anonymous",
            amount: parseInt(donation.amount) 
                 || parseInt(donation.amount_raw) 
                 || 0,
            message: donation.support_message 
                  || donation.message 
                  || "",
            timestamp: Date.now(),
            platform: 'bagibagi'
        };
        
        console.log('📤 Sending to Roblox:', JSON.stringify(donationData, null, 2));
        
        // ═══════════════════════════════════════════════════════════
        // SEND TO ROBLOX MESSAGINGSERVICE
        // ═══════════════════════════════════════════════════════════
        
        const ROBLOX_API_KEY = process.env.ROBLOX_API_KEY;
        const UNIVERSE_ID = process.env.UNIVERSE_ID;
        
        if (!ROBLOX_API_KEY || !UNIVERSE_ID) {
            console.error('❌ Missing Roblox environment variables!');
            console.error('   ROBLOX_API_KEY:', ROBLOX_API_KEY ? 'SET' : 'MISSING');
            console.error('   UNIVERSE_ID:', UNIVERSE_ID ? 'SET' : 'MISSING');
            
            return res.status(500).json({ 
                success: false,
                error: 'Server configuration error - Missing Roblox credentials'
            });
        }
        
        const robloxUrl = `https://apis.roblox.com/messaging-service/v1/universes/${UNIVERSE_ID}/topics/BagiBagiDonation`;
        
        const robloxResponse = await axios.post(
            robloxUrl,
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
        console.log('📊 Roblox response status:', robloxResponse.status);
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        
        return res.status(200).json({ 
            success: true,
            platform: 'bagibagi',
            donor: donationData.donor_name,
            amount: donationData.amount,
            message: donationData.message || '(no message)',
            token_verified: false,
            timestamp: new Date().toISOString()
        });
        
    } catch (error) {
        console.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.error('❌ ERROR:', error.message);
        console.error('Stack:', error.stack);
        
        if (error.response) {
            console.error('Roblox API error:', error.response.status);
            console.error('Roblox API data:', error.response.data);
        }
        
        console.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        
        return res.status(500).json({ 
            success: false,
            error: error.message,
            details: error.response?.data || 'No additional details'
        });
    }
};
