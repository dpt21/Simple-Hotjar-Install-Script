(async function () {
	const hotjarID = await fetch(
		"https://ihi.enkomion.com/call/public?shop=" + Shopify.shop,
		{ mode: "cors" }
	)
		.then((res) => res.text())
		.then((code) => {
			// Handle null/empty responses gracefully
			if (!code || code.trim() === "") {
				console.warn("Hotjar: No code received from endpoint");
				return null;
			}

			// Try to extract ID - endpoint should return just the ID now, but handle both cases
			const match = code.match(/\d{5,10}/);
			if (match && match[0]) {
				return match[0];
			}

			// If no match found, log warning and return null
			console.warn(
				"Hotjar: Could not extract ID from response:",
				code.substring(0, 100)
			);
			return null;
		})
		.catch((error) => {
			console.error("Hotjar: Error fetching code:", error);
			return null;
		});

	// Only proceed if we have a valid Hotjar ID
	if (!hotjarID) {
		console.warn("Hotjar: No valid ID found, skipping Hotjar initialization");
		return;
	}

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
  `;

	const hotjarScript = document.createElement("script");
	hotjarScript.type = "text/javascript";
	hotjarScript.text = hotjarSnippet;

	//console.log(hotjarScript)

	document.getElementsByTagName("head")[0].appendChild(hotjarScript);
})();
