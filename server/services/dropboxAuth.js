// services/dropboxAuth.js
const fs = require('fs').promises;
const path = require('path');
const { Dropbox } = require('dropbox');

class DropboxAuth {
  constructor() {
    this.tokenFile = path.join(__dirname, '..', 'config', '.dropbox_tokens.json');
    this.clientId = process.env.DROPBOX_APP_KEY;
    this.clientSecret = process.env.DROPBOX_APP_SECRET;
    this.dropbox = null;
    this.initialized = false;
    
    // Debug environment variables
    console.log('🔧 Dropbox Auth Config:');
    console.log(`   App Key: ${this.clientId ? '✅ Set' : '❌ Missing'}`);
    console.log(`   App Secret: ${this.clientSecret ? '✅ Set' : '❌ Missing'}`);
    console.log(`   Token File: ${this.tokenFile}`);
    
    // Auto-initialize
    this.init().catch(error => {
      console.warn('⚠️ Auto-initialization failed:', error.message);
    });
  }

  async init() {
    if (this.initialized) {
      return this.dropbox;
    }
    
    try {
      console.log('🔍 Loading Dropbox tokens...');
      const tokens = await this.loadTokens();
      
      if (tokens && tokens.access_token) {
        console.log('✅ Tokens found, creating Dropbox client...');
        this.dropbox = new Dropbox({ 
          accessToken: tokens.access_token,
          clientId: this.clientId,
          clientSecret: this.clientSecret
        });

        // Test if token is still valid
        try {
          console.log('🧪 Testing Dropbox connection...');
          await this.dropbox.usersGetCurrentAccount();
          console.log('✅ Dropbox access token is valid');
          this.initialized = true;
          return this.dropbox;
        } catch (error) {
          if (error.status === 401) {
            console.log('🔄 Access token expired, attempting refresh...');
            if (tokens.refresh_token) {
              const result = await this.refreshAccessToken(tokens.refresh_token);
              this.initialized = true;
              return result;
            } else {
              console.warn('⚠️ No refresh token available');
              return null;
            }
          }
          console.error('❌ Dropbox test failed:', error.message);
          throw error;
        }
      } else {
        console.warn('⚠️ No Dropbox tokens found. Need to authorize app.');
        this.initialized = true;
        return null;
      }
    } catch (error) {
      console.error('❌ Dropbox auth initialization failed:', error.message);
      this.initialized = true;
      return null;
    }
  }

  async loadTokens() {
    try {
      console.log(`🔍 Looking for token file at: ${this.tokenFile}`);
      const data = await fs.readFile(this.tokenFile, 'utf8');
      const tokens = JSON.parse(data);
      console.log('✅ Token file loaded successfully');
      console.log(`📅 Tokens last updated: ${tokens.updated_at}`);
      console.log(`⏰ Tokens expire at: ${new Date(tokens.expires_at).toISOString()}`);
      
      // Check if tokens are expired
      if (tokens.expires_at && Date.now() > tokens.expires_at) {
        console.log('⚠️ Access token has expired');
      } else {
        console.log('✅ Access token is still valid');
      }
      
      return tokens;
    } catch (error) {
      if (error.code === 'ENOENT') {
        console.log('❌ Token file does not exist');
        return null; // File doesn't exist
      }
      console.error('❌ Error loading token file:', error.message);
      throw error;
    }
  }

  async saveTokens(tokens) {
    const tokenData = {
      access_token: tokens.access_token,
      refresh_token: tokens.refresh_token,
      expires_at: Date.now() + (tokens.expires_in * 1000), // Convert to timestamp
      updated_at: new Date().toISOString()
    };

    await fs.writeFile(this.tokenFile, JSON.stringify(tokenData, null, 2));
    console.log('💾 Dropbox tokens saved');
  }

  async refreshAccessToken(refreshToken) {
    if (!refreshToken) {
      throw new Error('No refresh token available. Need to re-authorize app.');
    }

    try {
      const response = await fetch('https://api.dropbox.com/oauth2/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          grant_type: 'refresh_token',
          refresh_token: refreshToken,
          client_id: this.clientId,
          client_secret: this.clientSecret,
        }),
      });

      if (!response.ok) {
        throw new Error(`Token refresh failed: ${response.status} ${response.statusText}`);
      }

      const tokens = await response.json();
      
      // Save new tokens
      await this.saveTokens({
        access_token: tokens.access_token,
        refresh_token: tokens.refresh_token || refreshToken, // Some providers don't return new refresh token
        expires_in: tokens.expires_in
      });

      // Create new Dropbox client with fresh token
      this.dropbox = new Dropbox({ 
        accessToken: tokens.access_token,
        clientId: this.clientId,
        clientSecret: this.clientSecret
      });

      console.log('✅ Dropbox access token refreshed');
      return this.dropbox;

    } catch (error) {
      console.error('❌ Token refresh failed:', error.message);
      throw error;
    }
  }

  // Generate authorization URL for initial setup
  getAuthUrl(redirectUri = 'http://localhost:5000/auth/dropbox/callback') {
    const baseUrl = 'https://www.dropbox.com/oauth2/authorize';
    const params = new URLSearchParams({
      client_id: this.clientId,
      response_type: 'code',
      redirect_uri: redirectUri,
      token_access_type: 'offline' // This ensures we get a refresh token
    });
    
    return `${baseUrl}?${params.toString()}`;
  }

  // Exchange authorization code for tokens (call this from your callback route)
  async exchangeCodeForTokens(code, redirectUri = 'http://localhost:5000/auth/dropbox/callback') {
    try {
      const response = await fetch('https://api.dropbox.com/oauth2/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          code,
          grant_type: 'authorization_code',
          redirect_uri: redirectUri,
          client_id: this.clientId,
          client_secret: this.clientSecret,
        }),
      });

      if (!response.ok) {
        throw new Error(`Authorization failed: ${response.status} ${response.statusText}`);
      }

      const tokens = await response.json();
      await this.saveTokens(tokens);

      this.dropbox = new Dropbox({ 
        accessToken: tokens.access_token,
        clientId: this.clientId,
        clientSecret: this.clientSecret
      });

      console.log('✅ Dropbox authorization complete');
      return this.dropbox;

    } catch (error) {
      console.error('❌ Code exchange failed:', error.message);
      throw error;
    }
  }

  getDropboxClient() {
    return this.dropbox;
  }
}

module.exports = new DropboxAuth();