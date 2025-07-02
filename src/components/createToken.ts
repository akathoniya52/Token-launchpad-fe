// import React, { useEffect, useState } from "react";
// import {
//   Connection,
//   Keypair,
//   PublicKey,
//   SystemProgram,
//   Transaction,
// } from "@solana/web3.js";
// import {
//   createMintToInstruction,
//   createAssociatedTokenAccountInstruction,
//   getMintLen,
//   createInitializeMintInstruction,
//   getAssociatedTokenAddressSync,
// } from "@solana/spl-token";
// import { useConnection, useWallet } from "@solana/wallet-adapter-react";
// import { storeTokenLaunch } from "../hooks/storeTokenData";

// export const CreateToken= () => {
//   const CUSTOM_TOKEN_2022_PROGRAM_ID = new PublicKey("2dwpmEaGB8euNCirbwWdumWUZFH3V91mbPjoFbWT24An");
//   const ASSOCIATED_TOKEN_PROGRAM_ID = new PublicKey("BWBbPGpceCtFCUuMFjYUYpHEnagcT58bNi9c44VJ4rkW");

//   const RPC_ENDPOINT = "https://rpc.gorbchain.xyz";
//   const WS_ENDPOINT = "wss://rpc.gorbchain.xyz/ws/";
//   const httpsConnection = new Connection(RPC_ENDPOINT, {
//     commitment: "confirmed",
//     wsEndpoint: WS_ENDPOINT,
//     disableRetryOnRateLimit: false,
//     confirmTransactionInitialTimeout: 120000,
//     httpHeaders: {
//       "Content-Type": "application/json",
//     },
//   });

//   const { connection } = useConnection();
//   const wallet = useWallet();

//   const [balance, setBalance] = useState<number>(0);
//   const [network, setNetwork] = useState("solana-devnet");

//   useEffect(() => {
//     fetchBalance();
//   }, [network, wallet.publicKey]);

//   const fetchBalance = async () => {
//     if (wallet.publicKey) {
//       const bal = await connection.getBalance(wallet.publicKey);
//       setBalance(bal / 1e9); // lamports to SOL
//     }
//   };

//   const createToken = async () => {
//     try {
//         if(!wallet){
//             return alert("Please connect wallet")
//         }
//       const symbol = (document.getElementById("symbol") as HTMLInputElement).value;
//       const supply = (document.getElementById("supply") as HTMLInputElement).value;
//       const decimal = parseInt((document.getElementById("decimal") as HTMLInputElement).value);

//       if (!symbol || !supply || isNaN(decimal)) {
//         return alert("Symbol, Supply and Decimal are required!");
//       }

//       const mintKeypair = Keypair.generate();
//       const mintPubkey = mintKeypair.publicKey;

//       const mintLen = getMintLen([]);
//       const lamports = await connection.getMinimumBalanceForRentExemption(mintLen);

//       const transaction = new Transaction().add(
//         SystemProgram.createAccount({
//           fromPubkey: wallet.publicKey!,
//           newAccountPubkey: mintPubkey,
//           space: mintLen,
//           lamports,
//           programId: CUSTOM_TOKEN_2022_PROGRAM_ID,
//         }),
//         createInitializeMintInstruction(
//           mintPubkey,
//           decimal,
//           wallet.publicKey!,
//           null,
//           CUSTOM_TOKEN_2022_PROGRAM_ID
//         )
//       );

//       transaction.feePayer = wallet.publicKey!;
//       const { blockhash } = await httpsConnection.getLatestBlockhash();
//       transaction.recentBlockhash = blockhash;
//       transaction.partialSign(mintKeypair);

//       const signedTx = await wallet.signTransaction(transaction);
//       const txSig = await httpsConnection.sendRawTransaction(signedTx.serialize(), {
//         skipPreflight: true,
//       });
//       await httpsConnection.confirmTransaction(txSig, "confirmed");

//       console.log("Mint created:", mintPubkey.toBase58());

//       const associatedToken = getAssociatedTokenAddressSync(
//         mintPubkey,
//         wallet.publicKey!,
//         false,
//         CUSTOM_TOKEN_2022_PROGRAM_ID,
//         ASSOCIATED_TOKEN_PROGRAM_ID
//       );

//       const transaction2 = new Transaction().add(
//         createAssociatedTokenAccountInstruction(
//           wallet.publicKey!,
//           associatedToken,
//           wallet.publicKey!,
//           mintPubkey,
//           CUSTOM_TOKEN_2022_PROGRAM_ID,
//           ASSOCIATED_TOKEN_PROGRAM_ID
//         )
//       );

//       transaction2.feePayer = wallet.publicKey!;
//       const { blockhash: bh2 } = await httpsConnection.getLatestBlockhash();
//       transaction2.recentBlockhash = bh2;

//       const signedTx2 = await wallet.signTransaction(transaction2);
//       const txSig2 = await httpsConnection.sendRawTransaction(signedTx2.serialize(), {
//         skipPreflight: true,
//       });
//       await httpsConnection.confirmTransaction(txSig2, "confirmed");

//       console.log("ATA Created:", associatedToken.toBase58());

//       const transaction3 = new Transaction().add(
//         createMintToInstruction(
//           mintPubkey,
//           associatedToken,
//           wallet.publicKey!,
//           supply,
//           [],
//           CUSTOM_TOKEN_2022_PROGRAM_ID
//         )
//       );

//       transaction3.feePayer = wallet.publicKey!;
//       const { blockhash: bh3 } = await httpsConnection.getLatestBlockhash();
//       transaction3.recentBlockhash = bh3;

//       const signedTx3 = await wallet.signTransaction(transaction3);
//       const txSig3 = await httpsConnection.sendRawTransaction(signedTx3.serialize(), {
//         skipPreflight: true,
//       });
//       await httpsConnection.confirmTransaction(txSig3, "confirmed");

//       console.log("Minted", supply, "tokens to", associatedToken.toBase58());

//       await storeTokenLaunch(
//         associatedToken,
//         mintPubkey,
//         wallet.publicKey!,
//         "", // name
//         symbol,
//         "", // image
//         supply,
//         decimal,
//         network
//       );

//       alert("Token minted successfully!");
//     } catch (err) {
//       console.error("Minting failed:", err);
//       alert("Something went wrong during minting!");
//     }
//   };

//   return (
//     <div
//       style={{
//         height: "100vh",
//         display: "flex",
//         flexDirection: "column",
//         alignItems: "center",
//         justifyContent: "center",
//         gap: "10px",
//       }}
//     >
//       <h2>SPL Token Mint (No Metadata)</h2>
//       <select value={network} onChange={(e) => setNetwork(e.target.value)}>
//         <option value="solana-devnet">Solana Devnet</option>
//       </select>
//       <input id="symbol" placeholder="Token Symbol" className="inputText" />
//       <input id="supply" placeholder="Total Supply" className="inputText" />
//       <input id="decimal" placeholder="Decimals (e.g. 6)" className="inputText" />
//       <button onClick={createToken} className="btn">Create Token</button>
//       {wallet.publicKey && <p>Wallet Balance: {balance.toFixed(3)} SOL</p>}
//     </div>
//   );
// };