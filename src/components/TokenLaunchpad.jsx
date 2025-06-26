import { Connection, Keypair, SystemProgram, Transaction } from "@solana/web3.js";
import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import {
  TOKEN_2022_PROGRAM_ID,
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

  // const httpsConnection = new Connection("https://rpc.gorbchain.xyz")
  const RPC_ENDPOINT = 'https://rpc.gorbchain.xyz';
const WS_ENDPOINT = 'wss://rpc.gorbchain.xyz/ws/';
const httpsConnection = new Connection(RPC_ENDPOINT, {
  commitment: 'confirmed',
  wsEndpoint: WS_ENDPOINT,
  disableRetryOnRateLimit: false,
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

      const lamports = await httpsConnection.getMinimumBalanceForRentExemption(
        mintLen + metadataLen
      );

      const transaction = new Transaction().add(
        SystemProgram.createAccount({
          fromPubkey: wallet.publicKey,
          newAccountPubkey: mintKeypair.publicKey,
          space: mintLen,
          lamports,
          programId: TOKEN_2022_PROGRAM_ID,
        }),
        createInitializeMetadataPointerInstruction(
          mintKeypair.publicKey,
          wallet.publicKey,
          mintKeypair.publicKey,
          TOKEN_2022_PROGRAM_ID
        ),
        createInitializeMintInstruction(
          mintKeypair.publicKey,
          decimal,
          wallet.publicKey,
          null,
          TOKEN_2022_PROGRAM_ID
        ),
        createInitializeInstruction({
          programId: TOKEN_2022_PROGRAM_ID,
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
      console.log("Signature: ", txSignature);
      await httpsConnection.confirmTransaction(txSignature, 'confirmed');

      console.log(`Token mint created at ${mintKeypair.publicKey.toBase58()}`);
      const associatedToken = getAssociatedTokenAddressSync(
        mintKeypair.publicKey,
        wallet.publicKey,
        false,
        TOKEN_2022_PROGRAM_ID
      );

      console.log(associatedToken.toBase58());

      const transaction2 = new Transaction().add(
        createAssociatedTokenAccountInstruction(
          wallet.publicKey,
          associatedToken,
          wallet.publicKey,
          mintKeypair.publicKey,
          TOKEN_2022_PROGRAM_ID
        )
      );

      transaction2.feePayer = wallet.publicKey;
      const { blockhash: blockhash2 } = await httpsConnection.getLatestBlockhash();
      transaction2.recentBlockhash = blockhash2;
      
      const signedTx2 = await wallet.signTransaction(transaction2);
      const txSignature2 = await httpsConnection.sendRawTransaction(signedTx2.serialize(), {
        skipPreflight: true,
      });
      console.log("Signature2: ", txSignature2);
      await httpsConnection.confirmTransaction(txSignature2, 'confirmed');

      const transaction3 = new Transaction().add(
        createMintToInstruction(
          mintKeypair.publicKey,
          associatedToken,
          wallet.publicKey,
          supply,
          [],
          TOKEN_2022_PROGRAM_ID
        )
      );

      transaction3.feePayer = wallet.publicKey;
      const { blockhash: blockhash3 } = await httpsConnection.getLatestBlockhash();
      transaction3.recentBlockhash = blockhash3;
      
      const signedTx3 = await wallet.signTransaction(transaction3);
      const txSignature3 = await httpsConnection.sendRawTransaction(signedTx3.serialize(), {
        skipPreflight: true,
      });
      console.log("Signature3: ", txSignature3);
      await httpsConnection.confirmTransaction(txSignature3, 'confirmed');
      
      console.log("Minted!");
      await storeTokenLaunch(associatedToken, mintKeypair.publicKey, wallet.publicKey, name, symbol, img, supply, decimal,network);
      window.location.reload();
    } catch (error) {
      console.log("Error while minting... ", error);
    }
  }

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

