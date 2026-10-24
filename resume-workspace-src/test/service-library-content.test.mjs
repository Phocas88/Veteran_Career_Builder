import test from 'node:test';
import assert from 'node:assert/strict';
import {guideReference,guideText} from '../../scripts/service-library-content.mjs';
test('website guide content is copied as text and credential considerations without salaries or emblems',()=>{
 const html='<header><img src="branch-logo.png"><h1>Supply</h1><p>Records &amp; logistics.</p></header><main><div class="paths"><article><div class="path-head"><small>Civilian</small><h3>Inventory &amp; supply</h3></div><p class="pay">$100,000</p><p class="why"><strong>Why it fits:</strong> Records &amp; planning.</p><p class="bridge"><strong>What it takes:</strong> Verify credentials.</p><a href="/supply.html">Explore this route →</a></article></div></section><section class="sources"><a href="https://example.com/">Official reference</a></section></main>';
 const value=guideReference(html);assert.equal(value.intro,'Records & logistics.');assert.deepEqual(value.paths[0],{name:'Inventory & supply',sector:'Civilian',why:'Records & planning.',bridge:'Verify credentials.',href:'/supply.html'});assert.equal(value.citations[0].url,'https://example.com/');assert.ok(!JSON.stringify(value).includes('100,000'));assert.ok(!JSON.stringify(value).includes('branch-logo'));
 assert.equal(guideText('Navy&#39;s &amp; Coast Guard'),"Navy's & Coast Guard");
});
