#!/usr/bin/env node

/**
 * Script to list all tags in Cloudinary account
 * Run: node list-cloudinary-tags.js
 */

require('dotenv').config();
const cloudinary = require('cloudinary').v2;

// Debug: Check what env vars are available
const envVars = Object.keys(process.env).filter(key => key.includes('CLOUDINARY'));
console.log('Found Cloudinary env vars:', envVars);

// Configure Cloudinary - try different possible variable names
let cloudName = process.env.CLOUDINARY_CLOUD_NAME || process.env.CLOUD_NAME;
const apiKey = process.env.CLOUDINARY_API_KEY || process.env.API_KEY;
const apiSecret = process.env.CLOUDINARY_API_SECRET || process.env.API_SECRET;

// Extract cloud name if it's a full connection string
if (cloudName && cloudName.includes('@')) {
  // Format: cloudinary://api_key:api_secret@cloud_name
  const match = cloudName.match(/@([^/]+)/);
  if (match) {
    cloudName = match[1];
    console.log(`Extracted cloud_name from connection string: ${cloudName}`);
  }
}

if (!cloudName || !apiKey || !apiSecret) {
  console.error('❌ Error: Missing Cloudinary credentials in .env file');
  console.error('Required variables:');
  console.error('  - CLOUDINARY_CLOUD_NAME (or CLOUD_NAME)');
  console.error('  - CLOUDINARY_API_KEY (or API_KEY)');
  console.error('  - CLOUDINARY_API_SECRET (or API_SECRET)');
  console.error('\nCurrent values:');
  console.error(`  cloud_name: ${cloudName ? '✓' : '✗'}`);
  console.error(`  api_key: ${apiKey ? '✓' : '✗'}`);
  console.error(`  api_secret: ${apiSecret ? '✓' : '✗'}`);
  process.exit(1);
}

cloudinary.config({
  cloud_name: cloudName,
  api_key: apiKey,
  api_secret: apiSecret
});

async function listAllTags() {
  try {
    console.log('Testing Cloudinary Admin API connection...\n');
    
    // Test connection first
    try {
      const pingResult = await cloudinary.api.ping();
      console.log('✓ Cloudinary API connection successful\n');
    } catch (pingErr) {
      console.log('⚠ Ping failed, but continuing with resources call...\n');
    }
    
    console.log('Fetching all images using Admin API...\n');
    console.log(`Using cloud_name: ${cloudName}\n`);
    
    // Use Admin API to list resources
    // The Admin API requires type: 'upload' for uploaded images
    // Request tags explicitly
    const result = await cloudinary.api.resources({
      type: 'upload',
      resource_type: 'image',
      max_results: 500,
      tags: true, // Explicitly request tags
      context: true // Also get context/metadata
    });

    if (!result || !result.resources) {
      console.error('❌ No resources found or invalid response');
      console.log('Response:', JSON.stringify(result, null, 2));
      return [];
    }

    console.log(`✓ Found ${result.resources.length} images\n`);

    // Extract all unique tags
    const tagSet = new Set();
    const tagCounts = {};
    
    result.resources.forEach(img => {
      if (img.tags && Array.isArray(img.tags) && img.tags.length > 0) {
        img.tags.forEach(tag => {
          tagSet.add(tag);
          tagCounts[tag] = (tagCounts[tag] || 0) + 1;
        });
      }
    });

    const tags = Array.from(tagSet).sort();
    
    if (tags.length === 0) {
      console.log('⚠ No tags found on any images.');
      console.log('\nSample image data (first 3 images with all fields):');
      result.resources.slice(0, 3).forEach((img, idx) => {
        console.log(`\nImage ${idx + 1}:`);
        console.log(JSON.stringify({
          public_id: img.public_id,
          tags: img.tags,
          context: img.context,
          folder: img.folder,
          format: img.format,
          width: img.width,
          height: img.height
        }, null, 2));
      });
      
      // Check if images are in folders that might indicate categories
      const folders = new Set();
      result.resources.forEach(img => {
        if (img.folder) {
          folders.add(img.folder);
        }
      });
      
      if (folders.size > 0) {
        console.log('\n📁 Found folders (could be used as categories):');
        Array.from(folders).sort().forEach(folder => {
          const count = result.resources.filter(img => img.folder === folder).length;
          console.log(`  - "${folder}": ${count} images`);
        });
      }
    } else {
      console.log(`✓ Found ${tags.length} unique tags:\n`);
      tags.forEach((tag, index) => {
        console.log(`${index + 1}. "${tag}" (${tagCounts[tag]} images)`);
      });
    }

    return tags;

  } catch (error) {
    console.error('\n❌ Error fetching resources:');
    console.error('Message:', error.message || 'Unknown error');
    if (error.http_code) {
      console.error(`HTTP Code: ${error.http_code}`);
    }
    if (error.error) {
      console.error('Error details:', JSON.stringify(error.error, null, 2));
    }
    
    // More helpful error messages
    if (error.http_code === 401) {
      console.error('\n💡 This looks like an authentication error.');
      console.error('   Check that your API_KEY and API_SECRET are correct in .env');
    } else if (error.http_code === 403) {
      console.error('\n💡 This looks like a permissions error.');
      console.error('   Make sure your API key has Admin API permissions enabled.');
    } else if (error.http_code === 404) {
      console.error('\n💡 This looks like the endpoint doesn\'t exist.');
      console.error('   Make sure Admin API is enabled for your account.');
    }
    
    throw error;
  }
}

listAllTags().catch(err => {
  console.error('Unhandled error:', err);
  process.exit(1);
});

