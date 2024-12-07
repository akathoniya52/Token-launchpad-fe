import { formatNumber } from "../helpers/largeNumberFormator";

export function Table({tokens}){
    return (
      (
        <div>
          <h2>Previous Tokens</h2>
          <table style={{ borderCollapse: 'collapse', width: '100%' }}>
            <thead>
              <tr>
                <th style={{ border: '1px solid black', padding: '8px' }}>Name</th>
                <th style={{ border: '1px solid black', padding: '8px' }}>Symbol</th>
                <th style={{ border: '1px solid black', padding: '8px' }}>Decimal</th>
                <th style={{ border: '1px solid black', padding: '8px' }}>Network</th>
                <th style={{ border: '1px solid black', padding: '8px' }}>Total Supply</th>
              </tr>
            </thead>
            <tbody>
              {tokens.map((token, index) => (
                <tr key={index}>
                  <td style={{ border: '1px solid black', padding: '8px' }}>{token.name}</td>
                  <td style={{ border: '1px solid black', padding: '8px' }}>{token.symbol}</td>
                  <td style={{ border: '1px solid black', padding: '8px' }}>{token.decimal}</td>
                  <td style={{ border: '1px solid black', padding: '8px' }}>{token.network}</td>
                  <td style={{ border: '1px solid black', padding: '8px' }}>{formatNumber(token.supply)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )
    )
  }
  