;(async function () {
  const hotjarID = await fetch(
    'https://ihi.enkomion.com/call/public?shop=' + Shopify.shop,
    { mode: 'cors' }
  )
    .then(res => {
      console.log('res:', res)
      return res.text()
    })
    .then(code => {
      console.log('code:', code)
      return code.match(/\d{5,10}/)[0]
    })

  //console.log('hotjarID:', hotjarID)

  const hotjarSnippet = `
  (function(h,o,t,j,a,r){
    h.hj=h.hj||function(){(h.hj.q=h.hj.q||[]).push(arguments)};
    h._hjSettings={hjid:${hotjarID},hjsv:6};
    a=o.getElementsByTagName('head')[0];
    r=o.createElement('script');r.async=1;
    r.src=t+h._hjSettings.hjid+j+h._hjSettings.hjsv;
    a.appendChild(r);
  })(window,document,'https://static.hotjar.com/c/hotjar-','.js?sv=');
  `

  const hotjarScript = document.createElement('script')
  hotjarScript.type = 'text/javascript'
  hotjarScript.text = hotjarSnippet

  //console.log(hotjarScript)

  document.getElementsByTagName('head')[0].appendChild(hotjarScript)
})()