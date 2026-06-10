import { Links, Meta, Outlet, Scripts, ScrollRestoration } from 'react-router';
import './tailwind.css';

export default function App () {
  return (
    <html lang="en">
    <head>
      <meta charSet="utf-8"/>
      <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      <link rel="preconnect" href="https://cdn.shopify.com/"/>
      <link href="/app/style.css" rel="stylesheet"/>
      <link
        rel="stylesheet"
        href="https://cdn.shopify.com/static/fonts/inter/v4/styles.css"
      />
      <link
        rel="stylesheet"
        href="https://cdn.jsdelivr.net/npm/@fancyapps/ui@6.1/dist/fancybox/fancybox.css"
      />
      <link
        href="https://cdn.jsdelivr.net/npm/react-confirm-alert@3.0.6/src/react-confirm-alert.min.css"
        rel="stylesheet"/>
      <Meta/>
      <Links/>
    </head>
    <body>
    <Outlet/>
    <ScrollRestoration/>
    <Scripts/>
    </body>
    </html>
  );
}
