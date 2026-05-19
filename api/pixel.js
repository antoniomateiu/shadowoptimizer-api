(function() {
  const clientId = window.SHADOW_OPTIMIZER_CLIENT_ID;
  const apiUrl = window.SHADOW_OPTIMIZER_API_URL || 'https://shadowoptimizer-api.vercel.app';

  if (!clientId) {
    console.warn('ShadowOptimizer: clientId not set');
    return;
  }

  // Detecteaza produse pe pagina
  function optimizeProducts() {
    const productElements = document.querySelectorAll('[data-product-id]');
    
    productElements.forEach(async (element) => {
      const productId = element.getAttribute('data-product-id');
      const titleElement = element.querySelector('[data-product-title]');
      const descElement = element.querySelector('[data-product-desc]');
      
      if (!titleElement || !descElement) return;
      
      const originalText = descElement.innerText;
      
      try {
        const response = await fetch(`${apiUrl}/api/optimize`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            clientId,
            productId,
            originalText
          })
        });
        
        const data = await response.json();
        
        if (data.variantShown === 'B') {
          descElement.innerText = data.variantB;
        }
        
        // Track view event
        await fetch(`${apiUrl}/api/track-event`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            clientId,
            productId,
            eventType: 'view',
            variant: data.variantShown
          })
        });
      } catch (error) {
        console.error('ShadowOptimizer error:', error);
      }
    });
  }

  // Ruleaza cand pagina se incarca
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', optimizeProducts);
  } else {
    optimizeProducts();
  }

  // Track click events
  document.addEventListener('click', function(e) {
    const productElement = e.target.closest('[data-product-id]');
    if (productElement) {
      const productId = productElement.getAttribute('data-product-id');
      fetch(`${apiUrl}/api/track-event`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clientId,
          productId,
          eventType: 'click',
          variant: productElement.getAttribute('data-variant')
        })
      }).catch(err => console.error('Track error:', err));
    }
  });
})();