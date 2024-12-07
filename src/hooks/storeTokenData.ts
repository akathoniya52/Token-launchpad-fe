export async function storeTokenLaunch(associatedTokenAddress:any, mintAddress:any, walletAddress:any, name:string, symbol:string, img:string, supply:any, decimal:string,network:string) {
  try {
    const response = await fetch('https://token-launchpad-be-3.onrender.com/createtokenlaunch', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        walletAddress,
        tokenLaunchData: {
          mintAddress:mintAddress.toBase58(),
          associatedTokenAddress : associatedTokenAddress.toBase58(),
          name,
          symbol,
          img,
          supply,
          decimal,
          network:network
        },
      }),
    });

    if (!response.ok) {
      throw new Error('Failed to store token launch');
    }

    const data = await response.json();
    console.log(data);
  } catch (error) {
    console.error('Error storing token launch:', error);
  }
}