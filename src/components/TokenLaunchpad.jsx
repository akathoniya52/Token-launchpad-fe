import { Connection, Keypair, PublicKey, SystemProgram, Transaction, TransactionInstruction } from "@solana/web3.js";
import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import {
  createMintToInstruction,
  createAssociatedTokenAccountInstruction,
  getMintLen,
  createInitializeMetadataPointerInstruction,
  createInitializeMintInstruction,
  TYPE_SIZE,
  LENGTH_SIZE,
  ExtensionType,
  getAssociatedTokenAddressSync,
} from "@solana/spl-token";
import { createInitializeInstruction, pack } from "@solana/spl-token-metadata";
import {  useEffect, useState } from "react";
import { usePreviousTokens } from "../hooks/usePreviousTokens";
import { Table } from "./Table";
import { storeTokenLaunch } from "../hooks/storeTokenData";


export function TokenLaunchpad() {
  const CUSTOM_TOKEN_2022_PROGRAM_ID = new PublicKey('FGyzDo6bhE7gFmSYymmFnJ3SZZu3xWGBA7sNHXR7QQsn');
  const ASSOCIATED_TOKEN_PROGRAM_ID = new PublicKey('CAQRHHqKTHPyhiSTUTxBvpcCmcFe6J3htW5MBAKJjCxs');
  // const httpsConnection = new Connection("https://rpc.gorbchain.xyz")
  const RPC_ENDPOINT = 'https://rpc.gorbchain.xyz';
const WS_ENDPOINT = 'wss://rpc.gorbchain.xyz/ws/';
const httpsConnection = new Connection(RPC_ENDPOINT, {
  commitment: 'confirmed',
  wsEndpoint: WS_ENDPOINT,
  disableRetryOnRateLimit: false,
    confirmTransactionInitialTimeout: 120000, // 2 minutes initial timeout
    httpHeaders: {
      'Content-Type': 'application/json',
    },
});
  const { connection } = useConnection();
  const wallet = useWallet();

  const [network, setNetwork] = useState("solana-devnet");
  // Use the custom hook to get previous tokens
  const { previousTokens, loading, error } = usePreviousTokens(wallet);

  const [balance, setBalance] = useState(0); // Add state for balance

  async function fetchBalance() {
    if (wallet.publicKey) {
      const balance = await connection.getBalance(wallet.publicKey);
      setBalance(balance / 1e9); // Convert lamports to SOL
    }
  }

  // Call fetchBalance when the network changes or wallet changes
  useEffect(() => {
    fetchBalance();
  }, [network, wallet.publicKey]);

  async function createToken() {
    try {

      const name = document.getElementById("name").value;
      const symbol = document.getElementById("symbol").value;
      const supply = document.getElementById("supply").value;
      const img = document.getElementById("img").value;
      const decimal = document.getElementById("decimal").value;
      if(!name){
        return alert("Name is required..!")
      }
      if(!symbol){
        return alert("Symbole is required..!")
      }
      if(!supply){
        return alert("Supply is required..!")
      }
      if(!img){
        return alert("Image is required..!")
      }
      if(!decimal){
        return alert("Decimal is required..!")
      }
      const mintKeypair = Keypair.generate();
      const metadata = {
        mint: mintKeypair.publicKey,
        name: name,
        symbol: symbol,
        uri: img,
        additionalMetadata: [],
      };

      const mintLen = getMintLen([ExtensionType.MetadataPointer]);
      const metadataLen = TYPE_SIZE + LENGTH_SIZE + pack(metadata).length;

      const lamports = await connection.getMinimumBalanceForRentExemption(
        mintLen + metadataLen
      );

      const transaction = new Transaction().add(
        SystemProgram.createAccount({
          fromPubkey: wallet.publicKey,
          newAccountPubkey: mintKeypair.publicKey,
          space: mintLen,
          lamports,
          programId: CUSTOM_TOKEN_2022_PROGRAM_ID,
        }),
        createInitializeMetadataPointerInstruction(
          mintKeypair.publicKey,
          wallet.publicKey,
          mintKeypair.publicKey,
          CUSTOM_TOKEN_2022_PROGRAM_ID
        ),
        createInitializeMintInstruction(
          mintKeypair.publicKey,
          decimal,
          wallet.publicKey,
          null,
          CUSTOM_TOKEN_2022_PROGRAM_ID
        ),
        createInitializeInstruction({
          programId: CUSTOM_TOKEN_2022_PROGRAM_ID,
          mint: mintKeypair.publicKey,
          metadata: mintKeypair.publicKey,
          name: metadata.name,
          symbol: metadata.symbol,
          uri: metadata.uri,
          mintAuthority: wallet.publicKey,
          updateAuthority: wallet.publicKey,
        })
      );

      transaction.feePayer = wallet.publicKey;
      const { blockhash } = await httpsConnection.getLatestBlockhash();
      transaction.recentBlockhash = blockhash;
      transaction.partialSign(mintKeypair);
      
      // Sign the transaction with the wallet
      const signedTx = await wallet.signTransaction(transaction);
      const txSignature = await httpsConnection.sendRawTransaction(signedTx.serialize(), {
        skipPreflight: true,
      });
      console.log("Signature: ", signedTx);
      const result = await httpsConnection.confirmTransaction(txSignature, 'confirmed');
      console.log("Result: ", result);


      console.log(`Token mint created at ${mintKeypair.publicKey.toBase58()}`);
      const associatedToken = getAssociatedTokenAddressSync(
        mintKeypair.publicKey,
        wallet.publicKey,
        false,
        CUSTOM_TOKEN_2022_PROGRAM_ID,
        ASSOCIATED_TOKEN_PROGRAM_ID
      );

      console.log("Associated token: ", associatedToken.toBase58());

      const transaction2 = new Transaction().add(
        createAssociatedTokenAccountInstruction(
          wallet.publicKey,
          associatedToken,
          wallet.publicKey,
          mintKeypair.publicKey,
          CUSTOM_TOKEN_2022_PROGRAM_ID,
          ASSOCIATED_TOKEN_PROGRAM_ID
        )
      );

      transaction2.feePayer = wallet.publicKey;
      const { blockhash: blockhash2 } = await httpsConnection.getLatestBlockhash();
      transaction2.recentBlockhash = blockhash2;
      
      const signedTx2 = await wallet.signTransaction(transaction2);
      const txSignature2 = await httpsConnection.sendRawTransaction(signedTx2.serialize(), {
        skipPreflight: true,
      });
      console.log("Signature2: ",   signedTx2);
      const result2 = await httpsConnection.confirmTransaction(txSignature2, 'confirmed');
      console.log("Result2: ", result2);


      const transaction3 = new Transaction().add(
        createMintToInstruction(
          mintKeypair.publicKey,
          associatedToken,
          wallet.publicKey,
          supply,
          [],
          CUSTOM_TOKEN_2022_PROGRAM_ID
        )
      );

      transaction3.feePayer = wallet.publicKey;
      const { blockhash: blockhash3 } = await httpsConnection.getLatestBlockhash();
      transaction3.recentBlockhash = blockhash3;
      
      const signedTx3 = await wallet.signTransaction(transaction3);
      const txSignature3 = await httpsConnection.sendRawTransaction(signedTx3.serialize(), {
        skipPreflight: true,
      });
      console.log("Signature3: ", signedTx3);
      const result3 = await httpsConnection.confirmTransaction(txSignature3, 'confirmed');
      console.log("Result3: ", result3);
      
      console.log("Minted!");
      await storeTokenLaunch(associatedToken, mintKeypair.publicKey, wallet.publicKey, name, symbol, img, supply, decimal,network);
      // window.location.reload();
    } catch (error) {
      console.log("Error while minting... ", error);
    }
  }

  // async function createToken(){
  //   try{
  //     const name = document.getElementById("name").value;
  //         const symbol = document.getElementById("symbol").value;
  //         const supply = document.getElementById("supply").value;
  //         const img = document.getElementById("img").value;
  //         const decimal = document.getElementById("decimal").value;
  //         if(!name){
  //           return alert("Name is required..!")
  //         }
  //         if(!symbol){
  //           return alert("Symbole is required..!")
  //         }
  //         if(!supply){
  //           return alert("Supply is required..!")
  //         }
  //         if(!img){
  //           return alert("Image is required..!")
  //         }
  //         if(!decimal){
  //           return alert("Decimal is required..!")
  //         }
  //     const TOKEN22_PROGRAM = new PublicKey(
  //       "FGyzDo6bhE7gFmSYymmFnJ3SZZu3xWGBA7sNHXR7QQsn",
  //     );  

  //     const mint = new Keypair();
  // const tokenAccount = new Keypair();

  // console.log("📋 Details:");
  // console.log("Payer:", tokenAccount.publicKey.toString());
  // const TOTAL_SUPPLY = BigInt(Number(supply));

  // const mintSize = 82; // Standard mint account size for Token-2022
  // const rentMint =
  //   await connection.getMinimumBalanceForRentExemption(mintSize);
  // console.log(
  //   "Rent needed for mint account:",
  //   (rentMint / 1e9).toFixed(6),
  //   "SOL",
  // );
  // const transaction1 = new Transaction();

  // // Create mint account
  // const createMintIx = SystemProgram.createAccount({
  //   fromPubkey: wallet.publicKey,
  //   newAccountPubkey: mint.publicKey,
  //   lamports: rentMint,
  //   space: mintSize,
  //   programId: TOKEN22_PROGRAM,
  // });
  // transaction1.add(createMintIx);

  // // Initialize mint using InitializeMint2 (instruction 20)
  // const initMintData = Buffer.alloc(35);
  // initMintData[0] = 20; // InitializeMint2 instruction
  // initMintData[1] = 9; // decimals
  // wallet.publicKey.toBuffer().copy(initMintData, 2, 0, 32); // mint_authority
  // initMintData[34] = 0; // freeze_authority: None (COption discriminant)

  // const initMintIx = new TransactionInstruction({
  //   programId: TOKEN22_PROGRAM,
  //   keys: [
  //     { pubkey: mint.publicKey, isSigner: false, isWritable: true }, // mint
  //   ],
  //   data: initMintData,
  // });
  // transaction1.add(initMintIx);
  // const {blockhash} = await httpsConnection.getLatestBlockhash();
  // transaction1.recentBlockhash = blockhash;
  // transaction1.feePayer = wallet.publicKey;
  // console.log("🚀 Creating and initializing mint account...");
  // transaction1.partialSign(mint);
  // const signedTx = await wallet.signTransaction(transaction1,connection);
  // const signature1 = await httpsConnection.sendRawTransaction(signedTx.serialize(),{skipPreflight: true});
  
  // console.log("Mint account created and initialized 1 : ", signature1);

  // // Step 2: Create Token Account
  // console.log("🔧 Step 2: Creating Token Account...");

  // const tokenAccountSize = 165; // Standard token account size
  // const rentTokenAccount =
  //   await connection.getMinimumBalanceForRentExemption(tokenAccountSize);
  // console.log(
  //   "Rent needed for token account:",
  //   (rentTokenAccount / 1e9).toFixed(6),
  //   "SOL",
  // );

  // const transaction2 = new Transaction();

  // // Create the token account
  // const createTokenAccountIx = SystemProgram.createAccount({
  //   fromPubkey: wallet.publicKey,
  //   newAccountPubkey: tokenAccount.publicKey,
  //   lamports: rentTokenAccount,
  //   space: tokenAccountSize,
  //   programId: TOKEN22_PROGRAM,
  // });
  // transaction2.add(createTokenAccountIx);

  // // Initialize the token account using InitializeAccount3 (instruction 18)
  // const initAccountData = Buffer.alloc(33);
  // initAccountData[0] = 18; // InitializeAccount3 instruction
  // wallet.publicKey.toBuffer().copy(initAccountData, 1, 0, 32); // owner

  // const initAccountIx = new TransactionInstruction({
  //   programId: TOKEN22_PROGRAM,
  //   keys: [
  //     { pubkey: tokenAccount.publicKey, isSigner: false, isWritable: true }, // account
  //     { pubkey: mint.publicKey, isSigner: false, isWritable: false }, // mint
  //   ],
  //   data: initAccountData,
  // });
  // transaction2.add(initAccountIx);
  // const {blockhash:blockhash2} = await httpsConnection.getLatestBlockhash();
  // transaction2.recentBlockhash = blockhash2;
  // transaction2.feePayer = wallet.publicKey;
  // console.log("🚀 Creating and initializing token account...");
  // transaction2.partialSign(tokenAccount);
  // const signedTx2 = await wallet.signTransaction(transaction2,connection);
  // const signature2 = await httpsConnection.sendRawTransaction(signedTx2.serialize(),{skipPreflight: true});
  // console.log("✅ Token Account Created! Transaction:", signature2);


  // // Step 3: Mint tokens to the account
  // console.log("🔧 Step 3: Minting 1 Billion SHIT Tokens...");

  // const transaction3 = new Transaction();

  // // MintTo instruction data: instruction_type (7) + amount (8 bytes)
  // const mintData = Buffer.alloc(9);
  // mintData[0] = 7; // MintTo instruction

  // // Write the amount as little-endian 64-bit integer
  // const amountBuffer = Buffer.alloc(8);
  // amountBuffer.writeBigUInt64LE(TOTAL_SUPPLY, 0);
  // amountBuffer.copy(mintData, 1);

  // const mintToIx = new TransactionInstruction({
  //   programId: TOKEN22_PROGRAM,
  //   keys: [
  //     { pubkey: mint.publicKey, isSigner: false, isWritable: true }, // mint
  //     { pubkey: tokenAccount.publicKey, isSigner: false, isWritable: true }, // destination
  //     { pubkey: wallet.publicKey, isSigner: true, isWritable: false }, // mint_authority
  //   ],
  //   data: mintData,
  // });

  // transaction3.add(mintToIx);

  // console.log("🚀 Minting tokens...");
  // const {blockhash:blockhash3} = await httpsConnection.getLatestBlockhash();
  // transaction3.recentBlockhash = blockhash3;
  // transaction3.feePayer = wallet.publicKey;
  // const signedTx3 = await wallet.signTransaction(transaction3,connection);
  // const signature3 = await httpsConnection.sendRawTransaction(signedTx3.serialize(),{skipPreflight: true});
  // console.log("✅ Tokens Minted Successfully! Transaction:", signature3);

  // const txn = new Transaction().add(createInitializeInstruction({
  //           programId: CUSTOM_TOKEN_2022_PROGRAM_ID,
  //           mint: mint.publicKey,
  //           metadata: mint.publicKey,
  //           name: name,
  //           symbol: symbol,
  //           uri: "",
  //           mintAuthority: wallet.publicKey,
  //           updateAuthority: wallet.publicKey,
  //         }));
  //         const {blockhash:blockhash4} = await httpsConnection.getLatestBlockhash();
  //         txn.recentBlockhash = blockhash4;
  //         txn.feePayer = wallet.publicKey;
  //         const signedTx4 = await wallet.signTransaction(txn,connection);
  //         const signature4 = await httpsConnection.sendRawTransaction(signedTx4.serialize(),{skipPreflight: true});
  //         console.log("✅ Token Metadata Created! Transaction:", signature4);
  //   }
  //   catch(error){
  //     console.log("Error while minting... ", error);
  //   }
  // }

  return (
    <div
      style={{
        height: "100vh",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        flexDirection: "column",
      }}
    >
      <h1>Solana Token Launchpad</h1>
      <select value={network} onChange={(e) => setNetwork(e.target.value)}>
        <option value="solana-devnet">solana-devnet</option>
        {/* <option value="solana-mainnet">solana-mainnet</option> */}
      </select>
      <br />
      <input
        id="name"
        className="inputText"
        type="text"
        placeholder="Name"
        required
      ></input>{" "}
      <br />
      <input
        id="symbol"
        className="inputText"
        type="text"
        placeholder="Symbol"
        required
      ></input>{" "}
      <br />
      <input
        id="img"
        className="inputText"
        type="text"
        placeholder="Image URL"
      ></input>{" "}
      <br />
      <input
        id="supply"
        className="inputText"
        type="text"
        placeholder="Initial Supply"
      ></input>{" "}
      <br />
      <input
        id="decimal"
        className="inputText"
        type="text"
        placeholder="Token decimal"
      ></input>{" "}
      <br />
      <button id="btn" onClick={createToken} className="btn">
        Create a token
      </button>
      {wallet.publicKey && <p>Wallet Balance: {balance} SOL</p>}
      {/* Conditional rendering for loading and error states */}
      {loading && <p>Loading previous tokens...</p>}
      {error && <p style={{ color: 'red' }}>Error: {error}</p>}
      { wallet?.publicKey && !loading && !error && previousTokens.length > 0 && <Table tokens={previousTokens}/>}
      {!loading && !error && previousTokens?.length === 0 && (
        <p>No token launch happened for this wallet address.</p>
      )}
    </div>
  );
}

