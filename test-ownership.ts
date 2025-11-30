/**
 * Test script to debug ownership check
 * Run: npx ts-node test-ownership.ts
 */

import { ZunoSDK } from './src';
import { ethers } from 'ethers';

const RPC_URL = 'http://127.0.0.1:8545';
const COLLECTION_ADDRESS = '0x400890FeB77e0E555d02f8969ca00850F65b96D2'; // From bug.txt
const USER_ADDRESS = '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266'; // From bug.txt
const TOKEN_ID = '1'; // From bug.txt

async function main() {
  console.log('=== Testing Ownership Check ===\n');
  
  // Test 1: Direct ethers call
  console.log('1. Direct ethers ownerOf() call:');
  try {
    const provider = new ethers.JsonRpcProvider(RPC_URL);
    const contract = new ethers.Contract(
      COLLECTION_ADDRESS,
      ['function ownerOf(uint256 tokenId) view returns (address)'],
      provider
    );
    const owner = await contract.ownerOf(TOKEN_ID);
    console.log(`   Owner of token ${TOKEN_ID}: ${owner}`);
    console.log(`   Expected user: ${USER_ADDRESS}`);
    console.log(`   Match: ${owner.toLowerCase() === USER_ADDRESS.toLowerCase()}`);
  } catch (error: any) {
    console.log(`   ERROR: ${error.message}`);
  }
  
  // Test 2: SDK getMintedTokens
  console.log('\n2. SDK getMintedTokens():');
  try {
    const sdk = new ZunoSDK({
      apiKey: 'test',
      network: 31337,
      rpcUrl: RPC_URL,
    });
    const minted = await sdk.collection.getUserMintedTokens(COLLECTION_ADDRESS, USER_ADDRESS);
    console.log(`   Minted tokens: ${JSON.stringify(minted)}`);
  } catch (error: any) {
    console.log(`   ERROR: ${error.message}`);
  }
  
  // Test 3: SDK getUserOwnedTokens
  console.log('\n3. SDK getUserOwnedTokens():');
  try {
    const sdk = new ZunoSDK({
      apiKey: 'test',
      network: 31337,
      rpcUrl: RPC_URL,
    });
    const owned = await sdk.collection.getUserOwnedTokens(COLLECTION_ADDRESS, USER_ADDRESS);
    console.log(`   Owned tokens: ${JSON.stringify(owned)}`);
  } catch (error: any) {
    console.log(`   ERROR: ${error.message}`);
  }
  
  console.log('\n=== Done ===');
}

main().catch(console.error);
