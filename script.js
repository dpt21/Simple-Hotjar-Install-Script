;(async function () {
  try {
    const shop = window.Shopify && Shopify.shop ? Shopify.shop : ''
    if (!shop) return

    const res = await fetch('https://ihi.enkomion.com/call/public?shop=' + encodeURIComponent(shop), {
      mode: 'cors',
      cache: 'force-cache'
    })
    if (!res.ok) return

    const text = await res.text()
    const match = text.match(/\b\d{5,10}\b/)
    if (!match) return
    const hotjarID = match[0]

    const s = document.createElement('script')
    s.defer = true
    s.src = 'https://static.hotjar.com/c/hotjar-' + hotjarID + '.js?sv=6'
    document.head.appendChild(s)
  } catch (e) {}
})()