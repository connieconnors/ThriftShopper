// web/scripts/test-semantic-search.ts
/**
 * Test script for semantic search
 * Run with: npx tsx scripts/test-semantic-search.ts
 */

import { semanticSearch } from '../lib/semantic-search';

async function testSemanticSearch() {
  console.log('🧪 Testing Semantic Search\n');
  console.log('=' .repeat(60));

  const testQueries = [
    'whimsical gift for mom that is vintage',
    'cozy mug for myself',
    'retro stereo under $100',
    'elegant decor',
    'something quirky for a friend',
  ];

  for (const query of testQueries) {
    console.log(`\n📝 Query: "${query}"`);
    console.log('-'.repeat(60));

    try {
      const result = await semanticSearch(query, { limit: 5 });

      if (result.interpretation) {
        console.log('\n🧠 Interpretation:');
        console.log(`   Query: ${result.interpretation.originalQuery}`);
        console.log(
          `   Terms: ${result.interpretation.termGroups.map((group) => group.term).join(', ') || 'none'}`
        );
        console.log(`   Source: ${result.interpretation.source}`);
      }

      console.log(`\n📊 Results: ${result.listings.length} listings found`);

      if (result.listings.length > 0) {
        console.log('\n🎯 Top Results:');
        result.listings.slice(0, 3).forEach((listing, i) => {
          console.log(`   ${i + 1}. ${listing.title}`);
          console.log(`      Price: $${listing.price}`);
          console.log(`      Category: ${listing.category || 'N/A'}`);
          console.log(`      Moods: ${listing.moods?.join(', ') || 'none'}`);
          console.log(`      Styles: ${listing.styles?.join(', ') || 'none'}`);
          console.log(`      Intents: ${listing.intents?.join(', ') || 'none'}`);
        });
      } else {
        console.log('   ❌ No results found');
      }

      console.log('\n✅ Test passed');
    } catch (error) {
      console.error('\n❌ Test failed:', error);
    }

    console.log('='.repeat(60));
  }

  console.log('\n🎉 All tests completed!\n');
}

// Run tests
testSemanticSearch().catch(console.error);

