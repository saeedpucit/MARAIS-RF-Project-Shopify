import { useState, useEffect } from 'react';

import { Fancybox } from '@fancyapps/ui/dist/fancybox/';

export default function useFancybox (options = {}) {
  const [root, setRoot] = useState(null);

  useEffect(() => {
    if (root) {
      Fancybox.bind(root, '[data-fancybox]', options);
      return () => Fancybox.unbind(root, '[data-fancybox]');
    }
  }, [root, options]);

  return [setRoot];
}
