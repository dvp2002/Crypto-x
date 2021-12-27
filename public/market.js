const COIN_RANKING_API_URL = "http://localhost:3000/coins"
const coinList = document.getElementById("data")
const filterInput = document.getElementById("filter")

let coinsData = []
let filteredCoins = []

var formatCash = n => {
  if (n < 1e3) return n;
  if (n >= 1e4) return "$ " + (n / 1e9).toFixed(2) + " billion"
}


filterInput.addEventListener('keyup', (e) => {
  const inputValue = e.target.value

  filteredCoins = coinsData.filter(coin => {
    return coin.name.toLowerCase().includes(inputValue)
  })
  displayCoins(filteredCoins)
})

const loadCoins = async () => {
  try {
    const res = await fetch(COIN_RANKING_API_URL)
    const dataResponse = await res.json()
    coinsData = dataResponse.data.coins
    console.log(dataResponse)
    displayCoins(dataResponse.data.coins)
  } catch (error) {
    console.log(error)
  }
}

const displayCoins = (coins) => {
  const htmlString = coins.map((coin) => {
    return `
    <tr>
      <td><b>${coin.rank}</b></td>
      <td><img src="${coin.iconUrl}" height="25" width="25" ></td>
      <td><b>${coin.name}</b></td>
      <td><b>${coin.symbol}</b></td>
      <td><b>${new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(coin.price)}</b></td>
      <td><b>${formatCash(coin.marketCap)}</b></td>
    </tr>
    `
  })
    .join('');
  coinList.innerHTML = htmlString
}
loadCoins()