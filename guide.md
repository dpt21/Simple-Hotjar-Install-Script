Yes, you can retroactively update the script tag source for all your existing users! You'll need to create a script that:

1. Fetches all existing script tags from each store
2. Updates them to point to the new CDN URL
3. Or deletes the old ones and creates new ones

Let me search your codebase to see how you're currently managing script tags and then show you how to create a migration script.


[1 tool called]

Now let me look at your database structure to understand how you're storing user data:


[1 tool called]

Perfect! Now I can see the full picture. You have a database with all your existing users, and you need to update their script tags from the old Vercel URL to the new CDN URL.

Here's what you need to do to migrate all 1300 existing users:

## Option 1: Create a Migration Script (Recommended)

Create a new file `web/migrate-script-tags.js`:

```javascript:web/migrate-script-tags.js
import mongoose from 'mongoose'
import User from './db/user-model.js'
import { addScriptTag, deleteScriptTag } from './queries/index.js'
import shopify from './shopify.js'

// Connect to your database
mongoose.connect(process.env.MONGODB_URI)

async function migrateScriptTags() {
  try {
    // Get all users from your database
    const users = await User.find({})
    console.log(`Found ${users.length} users to migrate`)
    
    let successCount = 0
    let errorCount = 0
    
    for (const user of users) {
      try {
        console.log(`Migrating shop: ${user.shopOrigin}`)
        
        // Create a session object for this shop
        const session = { shop: user.shopOrigin }
        
        // Get all existing script tags for this shop
        const allScriptTags = await shopify.api.rest.ScriptTag.all({
          session: session
        })
        
        // Find the old Hotjar script tag
        const oldScriptTag = allScriptTags.data.find(tag => 
          tag.src === 'https://enkomion.com/instantHotjarInstall.js' ||
          tag.src.includes('enkomion.com') ||
          tag.src.includes('vercel.app')
        )
        
        if (oldScriptTag) {
          // Delete the old script tag
          await deleteScriptTag(session, oldScriptTag.id)
          console.log(`Deleted old script tag for ${user.shopOrigin}`)
          
          // Add the new CDN script tag
          await addScriptTag(session)
          console.log(`Added new CDN script tag for ${user.shopOrigin}`)
          
          successCount++
        } else {
          console.log(`No old script tag found for ${user.shopOrigin}`)
        }
        
        // Add a small delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 100))
        
      } catch (error) {
        console.error(`Error migrating ${user.shopOrigin}:`, error.message)
        errorCount++
      }
    }
    
    console.log(`\nMigration complete!`)
    console.log(`Success: ${successCount}`)
    console.log(`Errors: ${errorCount}`)
    
  } catch (error) {
    console.error('Migration failed:', error)
  } finally {
    mongoose.disconnect()
  }
}

// Run the migration
migrateScriptTags()
```

## Option 2: Add a Migration Endpoint

Add this to your `web/index.js`:

```javascript:web/index.js
// ... existing code ...

app.post('/api/migrate-all', async (req, res) => {
  try {
    const users = await User.find({})
    let results = []
    
    for (const user of users) {
      try {
        const session = { shop: user.shopOrigin }
        
        // Get existing script tags
        const allScriptTags = await shopify.api.rest.ScriptTag.all({
          session: session
        })
        
        // Find and delete old script tag
        const oldScriptTag = allScriptTags.data.find(tag => 
          tag.src === 'https://enkomion.com/instantHotjarInstall.js' ||
          tag.src.includes('enkomion.com') ||
          tag.src.includes('vercel.app')
        )
        
        if (oldScriptTag) {
          await deleteScriptTag(session, oldScriptTag.id)
          await addScriptTag(session)
          results.push({ shop: user.shopOrigin, status: 'success' })
        } else {
          results.push({ shop: user.shopOrigin, status: 'no-old-tag' })
        }
        
      } catch (error) {
        results.push({ shop: user.shopOrigin, status: 'error', error: error.message })
      }
    }
    
    res.json({ success: true, results })
    
  } catch (error) {
    res.status(500).json({ success: false, error: error.message })
  }
})
```

## How to Run the Migration

1. **For Option 1**: Run the script directly:
   ```bash
   cd web
   node migrate-script-tags.js
   ```

2. **For Option 2**: Call the endpoint from your admin panel or via curl:
   ```bash
   curl -X POST https://your-app.com/api/migrate-all
   ```

## Important Notes

- **Rate Limiting**: The script includes a 100ms delay between shops to avoid hitting Shopify's API limits
- **Error Handling**: Each shop is processed individually, so if one fails, others continue
- **Logging**: The script logs progress so you can monitor the migration
- **Safety**: It only updates shops that actually have the old script tag

This will update all 1300 existing users to use the new CDN URL, stopping the Vercel edge requests immediately!