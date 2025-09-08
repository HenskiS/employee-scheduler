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
    this.isRefreshing = false; // Prevent multiple concurrent refresh attempts
    
    // Debug environment variables - but only log once
    if (!this._configLogged) {
      console.log('🔧 Dropbox Auth Config:');
      console.log(`   App Key: ${this.clientId ? '✅ Set' : '❌ Missing'}`);
      console.log(`   App Secret: ${this.clientSecret ? '✅ Set' : '❌ Missing'}`);
      console.log(`   Token File: ${this.tokenFile}`);
      this._configLogged = true;
    }
    
    // REMOVED: Auto-initialization that was causing loops
    // Don't auto-initialize in constructor - let it be called explicitly when needed
  }

  async init() {
    if (this.initialized) {
      return this.dropbox;
    }
    
    // Prevent multiple simultaneous initialization attempts
    if (this.isRefreshing) {
      console.log('⏳ Dropbox initialization already in progress...');
      return null;
    }
    
    try {
      this.isRefreshing = true;
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
              console.warn('⚠️ No refresh token available - need re-authorization');
              this.initialized = true; // Mark as initialized even if failed
              return null;
            }
          }
          console.error('❌ Dropbox test failed:', error.message);
          this.initialized = true; // Mark as initialized even if failed
          return null;
        }
      } else {
        console.log('ℹ️ No Dropbox tokens found. Need to authorize app.');
        this.initialized = true;
        return null;
      }
    } catch (error) {
      console.error('❌ Dropbox auth initialization failed:', error.message);
      this.initialized = true; // Always mark as initialized to prevent loops
      return null;
    } finally {
      this.isRefreshing = false;
    }
  }

  async loadTokens() {
    try {
      const data = await fs.readFile(this.tokenFile, 'utf8');
      const tokens = JSON.parse(data);
      
      // Check if tokens are expired (with some buffer)
      const now = Date.now();
      const expiryBuffer = 5 * 60 * 1000; // 5 minute buffer
      
      if (tokens.expires_at && (now + expiryBuffer) > tokens.expires_at) {
        console.log('⚠️ Access token will expire soon or has expired');
      }
      
      return tokens;
    } catch (error) {
      if (error.code === 'ENOENT') {
        return null; // File doesn't exist
      }
      throw error;
    }
  }

  async saveTokens(tokens) {
    try {
      // Ensure config directory exists
      const configDir = path.dirname(this.tokenFile);
      await fs.mkdir(configDir, { recursive: true });
      
      const tokenData = {
        access_token: tokens.access_token,
        refresh_token: tokens.refresh_token,
        expires_at: Date.now() + (tokens.expires_in * 1000), // Convert to timestamp
        updated_at: new Date().toISOString()
      };

      await fs.writeFile(this.tokenFile, JSON.stringify(tokenData, null, 2));
      console.log('💾 Dropbox tokens saved');
    } catch (error) {
      console.error('❌ Failed to save tokens:', error.message);
      throw error;
    }
  }

  async refreshAccessToken(refreshToken) {
    if (!refreshToken) {
      throw new Error('No refresh token available. Need to re-authorize app.');
    }

    // Prevent multiple concurrent refresh attempts
    if (this.isRefreshing) {
      console.log('⏳ Token refresh already in progress...');
      return null;
    }

    try {
      this.isRefreshing = true;
      console.log('🔄 Refreshing Dropbox access token...');
      
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
        const errorText = await response.text();
        throw new Error(`Token refresh failed: ${response.status} ${response.statusText} - ${errorText}`);
      }

      const newTokens = await response.json();
      
      // Save new tokens
      await this.saveTokens({
        access_token: newTokens.access_token,
        refresh_token: newTokens.refresh_token || refreshToken, // Keep old refresh token if new one not provided
        expires_in: newTokens.expires_in
      });

      // Create new Dropbox client with fresh token
      this.dropbox = new Dropbox({ 
        accessToken: newTokens.access_token,
        clientId: this.clientId,
        clientSecret: this.clientSecret
      });

      console.log('✅ Dropbox access token refreshed successfully');
      return this.dropbox;

    } catch (error) {
      console.error('❌ Token refresh failed:', error.message);
      // Clear the client so we don't keep using invalid tokens
      this.dropbox = null;
      throw error;
    } finally {
      this.isRefreshing = false;
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
        const errorText = await response.text();
        throw new Error(`Authorization failed: ${response.status} ${response.statusText} - ${errorText}`);
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

  // Reset the auth state (useful for debugging)
  reset() {
    this.dropbox = null;
    this.initialized = false;
    this.isRefreshing = false;
  }
}

module.exports = new DropboxAuth();